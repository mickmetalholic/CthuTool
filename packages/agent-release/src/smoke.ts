import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import {
  mkdir,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createConnection } from 'node:net';
import { join, resolve } from 'node:path';
import { validateBundleInventory, validateBundleLayout } from './layout';

type InstanceRecord = {
  readonly protocolVersion: number;
  readonly pid: number;
  readonly nonce: string;
  readonly controlEndpoint: string;
  readonly executablePath: string;
  readonly entryPoint: string;
};

export type AgentBundleSmokeFailureKind =
  | 'NATIVE_SETUP_PACKAGING'
  | 'AGENT_RUNTIME'
  | 'BACKEND_CONNECTIVITY';

export class AgentBundleSmokeError extends Error {
  constructor(
    readonly kind: AgentBundleSmokeFailureKind,
    message: string,
    options?: { readonly cause?: unknown },
  ) {
    super(`[${kind}] ${message}`, options);
    this.name = 'AgentBundleSmokeError';
  }
}

export type AgentBundleSmokeResult = {
  readonly applicationVersion: string;
  readonly environmentId: string;
  readonly bridgeEndpoint: string;
  readonly bundledNodePath: string;
  readonly setupRequiredVerified: boolean;
};

const FORBIDDEN_EMBEDDED_MARKERS = [
  'agentSecret',
  'AGENT_SECRET',
  'BEGIN PRIVATE KEY',
  'BEGIN RSA PRIVATE KEY',
  'BEGIN OPENSSH PRIVATE KEY',
] as const;

export async function smokeExtractedAgentBundle(input: {
  readonly bundleRoot: string;
  readonly userDataDir: string;
  readonly timeoutMs?: number;
  readonly environment?: Readonly<Record<string, string | undefined>>;
  readonly deploymentOrigin?: string;
  readonly nativeSetupSmoke?: boolean;
}): Promise<AgentBundleSmokeResult> {
  const timeoutMs = input.timeoutMs ?? 20_000;
  let layout: ReturnType<typeof validateBundleLayout>;
  try {
    layout = validateBundleLayout(
      JSON.parse(await readFile(join(input.bundleRoot, 'layout.json'), 'utf8')),
    );
    validateBundleInventory(
      layout.target,
      await listBundleFiles(input.bundleRoot),
    );
    await assertNoForbiddenEmbeddedContent(input.bundleRoot);
  } catch (error) {
    throw wrapSmokeError('NATIVE_SETUP_PACKAGING', error);
  }

  const setupPath = resolve(
    input.bundleRoot,
    ...layout.entryPoints.setup.split('/'),
  );
  try {
    await realpath(setupPath);
  } catch (error) {
    throw new AgentBundleSmokeError(
      'NATIVE_SETUP_PACKAGING',
      `Native setup executable is missing at ${layout.entryPoints.setup}`,
      { cause: error },
    );
  }
  if (input.nativeSetupSmoke) {
    await smokeNativeSetupExecutable(setupPath, timeoutMs);
  }

  const userDataDir = resolve(input.userDataDir);
  const { deploymentOrigin } = input;
  if (typeof deploymentOrigin !== 'string' || deploymentOrigin.length === 0) {
    return smokeFreshSetupRequired({
      bundleRoot: input.bundleRoot,
      environment: input.environment,
      layout,
      timeoutMs,
      userDataDir,
    });
  }

  return smokeConfiguredReadiness({
    bundleRoot: input.bundleRoot,
    deploymentOrigin,
    environment: input.environment,
    layout,
    timeoutMs,
    userDataDir,
  });
}

async function smokeNativeSetupExecutable(
  setupPath: string,
  timeoutMs: number,
): Promise<void> {
  const stderr: Buffer[] = [];
  const child = spawn(setupPath, ['--smoke-test'], {
    cwd: resolve(setupPath, '..'),
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    if (Buffer.concat(stderr).byteLength < 16 * 1024) stderr.push(chunk);
  });
  try {
    const exit = await waitForExitCode(child, timeoutMs);
    if (exit.code !== 0) {
      throw new Error(
        `native setup exited with code ${exit.code ?? 'none'} signal ${exit.signal ?? 'none'}: ${Buffer.concat(stderr).toString('utf8').trim() || '<empty stderr>'}`,
      );
    }
  } catch (error) {
    await terminateExactChild(child);
    throw new AgentBundleSmokeError(
      'NATIVE_SETUP_PACKAGING',
      `Native setup executable failed its smoke test: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

async function smokeFreshSetupRequired(input: {
  readonly bundleRoot: string;
  readonly userDataDir: string;
  readonly layout: ReturnType<typeof validateBundleLayout>;
  readonly timeoutMs: number;
  readonly environment?: Readonly<Record<string, string | undefined>>;
}): Promise<AgentBundleSmokeResult> {
  const nodePath = await realpath(
    resolve(input.bundleRoot, ...input.layout.entryPoints.node.split('/')),
  );
  const agentPath = await realpath(
    resolve(input.bundleRoot, ...input.layout.entryPoints.agent.split('/')),
  );
  const instancePath = join(input.userDataDir, 'runtime', 'instance.json');
  await rm(instancePath, { force: true });

  const stderr: Buffer[] = [];
  const child = spawn(
    nodePath,
    [agentPath, '--user-data-dir', input.userDataDir],
    {
      cwd: input.bundleRoot,
      env: {
        ...process.env,
        ...input.environment,
        CTHUTOOL_AGENT_DISABLED: '1',
        CTHUTOOL_AGENT_VERSION: input.layout.releaseVersion,
        NODE_ENV: 'production',
        PATH: '',
      },
      stdio: ['ignore', 'ignore', 'pipe'],
    },
  );
  child.stderr?.on('data', (chunk: Buffer) => {
    if (Buffer.concat(stderr).byteLength < 64 * 1024) {
      stderr.push(chunk);
    }
  });

  try {
    const exit = await waitForExitCode(child, input.timeoutMs);
    const detail = Buffer.concat(stderr).toString('utf8');
    if (exit.code === 0) {
      throw new AgentBundleSmokeError(
        'AGENT_RUNTIME',
        'Fresh archive Agent exited successfully instead of SetupRequired',
      );
    }
    if (
      !/setup required|configure the deployment Origin|Agent Settings/i.test(
        detail,
      )
    ) {
      throw new AgentBundleSmokeError(
        'AGENT_RUNTIME',
        `Fresh archive did not report SetupRequired (exit ${exit.code ?? 'none'}): ${detail.trim() || '<empty stderr>'}`,
      );
    }
    await assertPathAbsent(instancePath);
    return {
      applicationVersion: input.layout.releaseVersion,
      bridgeEndpoint: '',
      bundledNodePath: nodePath,
      environmentId: 'self-use',
      setupRequiredVerified: true,
    };
  } catch (error) {
    await terminateExactChild(child);
    throw wrapSmokeError('AGENT_RUNTIME', error, stderr);
  }
}

async function smokeConfiguredReadiness(input: {
  readonly bundleRoot: string;
  readonly userDataDir: string;
  readonly layout: ReturnType<typeof validateBundleLayout>;
  readonly timeoutMs: number;
  readonly deploymentOrigin: string;
  readonly environment?: Readonly<Record<string, string | undefined>>;
}): Promise<AgentBundleSmokeResult> {
  await writeConfiguredUserData(input.userDataDir, input.deploymentOrigin);

  const nodePath = await realpath(
    resolve(input.bundleRoot, ...input.layout.entryPoints.node.split('/')),
  );
  const agentPath = await realpath(
    resolve(input.bundleRoot, ...input.layout.entryPoints.agent.split('/')),
  );
  const instancePath = join(input.userDataDir, 'runtime', 'instance.json');
  await rm(instancePath, { force: true });

  const stderr: Buffer[] = [];
  const child = spawn(
    nodePath,
    [agentPath, '--user-data-dir', input.userDataDir],
    {
      cwd: input.bundleRoot,
      env: {
        ...process.env,
        ...input.environment,
        CTHUTOOL_AGENT_DISABLED: '1',
        CTHUTOOL_AGENT_VERSION: input.layout.releaseVersion,
        NODE_ENV: 'production',
        PATH: '',
      },
      stdio: ['ignore', 'ignore', 'pipe'],
    },
  );
  child.stderr?.on('data', (chunk: Buffer) => {
    if (Buffer.concat(stderr).byteLength < 64 * 1024) {
      stderr.push(chunk);
    }
  });

  try {
    const record = await waitForInstance(
      instancePath,
      child,
      input.timeoutMs,
      stderr,
    );
    if (
      (await realpath(record.executablePath)) !== nodePath ||
      (await realpath(record.entryPoint)) !== agentPath ||
      record.pid !== child.pid
    ) {
      throw new AgentBundleSmokeError(
        'AGENT_RUNTIME',
        'Agent smoke process did not use the bundled entry points',
      );
    }
    const healthResult = (await waitForControl(
      record,
      child,
      input.timeoutMs,
      stderr,
    )) as {
      readonly applicationVersion?: string;
      readonly bridge?: { readonly endpoint?: string };
    };
    if (
      healthResult.applicationVersion !== input.layout.releaseVersion ||
      typeof healthResult.bridge?.endpoint !== 'string'
    ) {
      throw new AgentBundleSmokeError(
        'AGENT_RUNTIME',
        'Agent health did not report the release version and bridge',
      );
    }
    const environments = requireSuccess(
      await requestControl(record, 'environment.list'),
      'environment.list',
    ) as { readonly environments?: readonly { readonly id?: string }[] };
    const environmentId = 'self-use';
    if (!environments.environments?.some((item) => item.id === environmentId)) {
      throw new AgentBundleSmokeError(
        'AGENT_RUNTIME',
        'Configured Agent smoke did not load the fixed self-use environment',
      );
    }
    requireSuccess(
      await requestControl(
        record,
        'environment.switch',
        environmentId,
        input.timeoutMs,
      ),
      'environment.switch',
    );
    const launch = requireSuccess(
      await requestControl(record, 'bridge.launch'),
      'bridge.launch',
    ) as {
      readonly endpoint?: string;
      readonly environmentId?: string;
      readonly launchUrl?: string;
    };
    if (
      launch.endpoint !== healthResult.bridge.endpoint ||
      launch.environmentId !== environmentId ||
      typeof launch.launchUrl !== 'string'
    ) {
      throw new AgentBundleSmokeError(
        'AGENT_RUNTIME',
        'Agent bridge launch metadata is inconsistent',
      );
    }
    try {
      const bootstrapResponse = await fetch(`${launch.endpoint}/v1/bootstrap`, {
        headers: { origin: input.deploymentOrigin },
        signal: AbortSignal.timeout(Math.min(input.timeoutMs, 5_000)),
      });
      if (!bootstrapResponse.ok) {
        throw new AgentBundleSmokeError(
          'BACKEND_CONNECTIVITY',
          `Agent bridge readiness returned ${bootstrapResponse.status}`,
        );
      }
    } catch (error) {
      if (error instanceof AgentBundleSmokeError) {
        throw error;
      }
      throw new AgentBundleSmokeError(
        'BACKEND_CONNECTIVITY',
        error instanceof Error
          ? error.message
          : 'Agent bridge readiness probe failed',
        { cause: error },
      );
    }
    await requestControl(record, 'shutdown');
    await waitForExit(child, input.timeoutMs);
    await waitForRemoval(instancePath, input.timeoutMs);
    return {
      applicationVersion: input.layout.releaseVersion,
      bridgeEndpoint: launch.endpoint,
      bundledNodePath: nodePath,
      environmentId,
      setupRequiredVerified: false,
    };
  } catch (error) {
    await terminateExactChild(child);
    throw wrapSmokeError(
      error instanceof AgentBundleSmokeError ? error.kind : 'AGENT_RUNTIME',
      error,
      stderr,
    );
  }
}

export async function assertNoForbiddenEmbeddedContent(
  bundleRoot: string,
): Promise<void> {
  const files = await listBundleFiles(bundleRoot);
  for (const relativePath of files) {
    const lower = relativePath.toLowerCase();
    if (
      lower === 'agent/environments.json' ||
      lower === 'environments.json' ||
      lower.endsWith('/environments.json')
    ) {
      throw new AgentBundleSmokeError(
        'NATIVE_SETUP_PACKAGING',
        `Forbidden deployment URL catalog embedded at ${relativePath}`,
      );
    }
    if (
      lower.endsWith('.exe') ||
      lower.endsWith('.dylib') ||
      lower.endsWith('.so') ||
      lower.endsWith('.node') ||
      lower.includes('/node') ||
      lower.endsWith('/cthutool-agent-tray') ||
      lower.endsWith('/cthutool-agent-setup') ||
      lower.endsWith('cthutool-agent-tray.exe') ||
      lower.endsWith('cthutool-agent-setup.exe') ||
      lower.startsWith('agent/node_modules/') ||
      lower.startsWith('agent/dist/')
    ) {
      continue;
    }
    const absolute = join(bundleRoot, ...relativePath.split('/'));
    const bytes = await readFile(absolute);
    if (bytes.byteLength > 2 * 1024 * 1024) {
      continue;
    }
    const text = bytes.toString('utf8');
    for (const marker of FORBIDDEN_EMBEDDED_MARKERS) {
      if (text.includes(marker)) {
        throw new AgentBundleSmokeError(
          'NATIVE_SETUP_PACKAGING',
          `Forbidden secret or credential marker "${marker}" embedded in ${relativePath}`,
        );
      }
    }
    if (looksLikeDeploymentCatalog(text)) {
      throw new AgentBundleSmokeError(
        'NATIVE_SETUP_PACKAGING',
        `Forbidden deployment URL catalog content embedded in ${relativePath}`,
      );
    }
  }
}

function looksLikeDeploymentCatalog(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') || !trimmed.includes('"profiles"')) {
    return false;
  }
  try {
    const value = JSON.parse(trimmed) as {
      readonly profiles?: unknown;
      readonly schemaVersion?: unknown;
    };
    return (
      typeof value.schemaVersion === 'number' &&
      Array.isArray(value.profiles) &&
      value.profiles.some(
        (profile) =>
          profile &&
          typeof profile === 'object' &&
          'webOrigin' in profile &&
          'backendHttpUrl' in profile,
      )
    );
  } catch {
    return false;
  }
}

async function writeConfiguredUserData(
  userDataDir: string,
  deploymentOrigin: string,
): Promise<void> {
  await mkdir(userDataDir, { recursive: true });
  await writeFile(
    join(userDataDir, 'config.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      agentId: 'smoke-agent',
      deploymentOrigin,
      deviceName: 'smoke-host',
      connectionEnabled: true,
      browserRuntime: { kind: 'host-chrome' },
    })}\n`,
    { mode: 0o600 },
  );
  await writeFile(
    join(userDataDir, 'environment.json'),
    `${JSON.stringify({ activeEnvironmentId: 'self-use' })}\n`,
    { mode: 0o600 },
  );
}

async function listBundleFiles(
  root: string,
  directory = root,
): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...(await listBundleFiles(root, path)));
    } else if (entry.isFile()) {
      output.push(path.slice(root.length + 1).replaceAll('\\', '/'));
    }
  }
  return output;
}

async function waitForInstance(
  path: string,
  child: ChildProcess,
  timeoutMs: number,
  stderr: readonly Buffer[],
): Promise<InstanceRecord> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new AgentBundleSmokeError(
        'AGENT_RUNTIME',
        `Agent exited before readiness with code ${child.exitCode}: ${Buffer.concat(stderr).toString('utf8')}`,
      );
    }
    try {
      const value = JSON.parse(
        await readFile(path, 'utf8'),
      ) as Partial<InstanceRecord>;
      if (
        typeof value.protocolVersion === 'number' &&
        typeof value.pid === 'number' &&
        typeof value.nonce === 'string' &&
        typeof value.controlEndpoint === 'string' &&
        typeof value.executablePath === 'string' &&
        typeof value.entryPoint === 'string'
      ) {
        return value as InstanceRecord;
      }
    } catch {
      // The record may not exist yet or may be observed while being written.
    }
    await delay(50);
  }
  throw new AgentBundleSmokeError(
    'AGENT_RUNTIME',
    'Timed out waiting for Agent readiness record',
  );
}

async function requestControl(
  record: InstanceRecord,
  operation:
    | 'health'
    | 'environment.list'
    | 'environment.switch'
    | 'bridge.launch'
    | 'shutdown',
  environmentId?: string,
  timeoutMs = 5_000,
): Promise<unknown> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      return await requestControlOnce(
        record,
        operation,
        environmentId,
        Math.max(250, deadline - Date.now()),
      );
    } catch (error) {
      lastError = error;
      const code = (error as NodeJS.ErrnoException).code;
      if (
        code !== 'ENOENT' &&
        code !== 'ECONNREFUSED' &&
        code !== 'ECONNRESET' &&
        code !== 'ETIMEDOUT'
      ) {
        throw error;
      }
      await delay(50);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new AgentBundleSmokeError(
        'AGENT_RUNTIME',
        `Agent ${operation} request failed`,
      );
}

async function requestControlOnce(
  record: InstanceRecord,
  operation:
    | 'health'
    | 'environment.list'
    | 'environment.switch'
    | 'bridge.launch'
    | 'shutdown',
  environmentId: string | undefined,
  timeoutMs: number,
): Promise<unknown> {
  return new Promise((resolvePromise, rejectPromise) => {
    const socket = createConnection(record.controlEndpoint);
    const timer = setTimeout(() => {
      socket.destroy();
      const error: NodeJS.ErrnoException = new Error(
        `Agent ${operation} request timed out`,
      );
      error.code = 'ETIMEDOUT';
      rejectPromise(error);
    }, timeoutMs);
    let payload = '';
    socket.setEncoding('utf8');
    socket.once('connect', () => {
      socket.write(
        `${JSON.stringify({
          instanceNonce: record.nonce,
          operation,
          protocolVersion: record.protocolVersion,
          ...(environmentId ? { environmentId } : {}),
        })}\n`,
      );
    });
    socket.on('data', (chunk: string) => {
      payload += chunk;
      const newline = payload.indexOf('\n');
      if (newline >= 0) {
        clearTimeout(timer);
        socket.end();
        try {
          resolvePromise(JSON.parse(payload.slice(0, newline)));
        } catch (error) {
          rejectPromise(error);
        }
      }
    });
    socket.once('error', (error) => {
      clearTimeout(timer);
      rejectPromise(error);
    });
  });
}

async function waitForControl(
  record: InstanceRecord,
  child: ChildProcess,
  timeoutMs: number,
  stderr: readonly Buffer[],
): Promise<unknown> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `Agent exited before control readiness with code ${child.exitCode}: ${Buffer.concat(stderr).toString('utf8')}`,
      );
    }
    try {
      return requireSuccess(
        await requestControl(
          record,
          'health',
          undefined,
          Math.max(1, Math.min(500, deadline - Date.now())),
        ),
        'health',
      );
    } catch (error) {
      if (!isControlNotReadyError(error)) {
        throw error;
      }
      lastError = error;
      await delay(50);
    }
  }
  throw new Error(
    `Timed out waiting for Agent control readiness${
      lastError instanceof Error ? `: ${lastError.message}` : ''
    }`,
  );
}

function isControlNotReadyError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  return (
    code === 'ENOENT' ||
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT'
  );
}

function requireSuccess(value: unknown, operation: string): unknown {
  if (
    !value ||
    typeof value !== 'object' ||
    (value as { readonly ok?: boolean }).ok !== true ||
    !('result' in value)
  ) {
    throw new AgentBundleSmokeError(
      'AGENT_RUNTIME',
      `Agent ${operation} control request failed`,
    );
  }
  return (value as { readonly result: unknown }).result;
}

async function waitForExit(
  child: ChildProcess,
  timeoutMs: number,
): Promise<void> {
  if (child.exitCode !== null) {
    return;
  }
  await Promise.race([
    new Promise<void>((resolvePromise, rejectPromise) => {
      child.once('exit', (code, signal) => {
        code === 0
          ? resolvePromise()
          : rejectPromise(
              new AgentBundleSmokeError(
                'AGENT_RUNTIME',
                `Agent exited with code ${code ?? 'none'} signal ${signal ?? 'none'}`,
              ),
            );
      });
    }),
    delay(timeoutMs).then(() => {
      throw new AgentBundleSmokeError(
        'AGENT_RUNTIME',
        'Timed out waiting for coordinated Agent shutdown',
      );
    }),
  ]);
}

async function waitForExitCode(
  child: ChildProcess,
  timeoutMs: number,
): Promise<{
  readonly code: number | null;
  readonly signal: NodeJS.Signals | null;
}> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return { code: child.exitCode, signal: child.signalCode };
  }
  return Promise.race([
    new Promise<{
      readonly code: number | null;
      readonly signal: NodeJS.Signals | null;
    }>((resolvePromise) => {
      child.once('exit', (code, signal) => {
        resolvePromise({ code, signal });
      });
    }),
    delay(timeoutMs).then(() => {
      throw new AgentBundleSmokeError(
        'AGENT_RUNTIME',
        'Timed out waiting for SetupRequired Agent exit',
      );
    }),
  ]);
}

async function waitForRemoval(path: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await readFile(path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw error;
    }
    await delay(50);
  }
  throw new AgentBundleSmokeError(
    'AGENT_RUNTIME',
    'Agent shutdown left a stale instance record',
  );
}

async function assertPathAbsent(path: string): Promise<void> {
  try {
    await readFile(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw error;
  }
  throw new AgentBundleSmokeError(
    'AGENT_RUNTIME',
    'SetupRequired Agent left a runtime instance record',
  );
}

async function terminateExactChild(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.pid === undefined) {
    return;
  }
  child.kill('SIGTERM');
  await Promise.race([
    new Promise<void>((resolvePromise) =>
      child.once('exit', () => resolvePromise()),
    ),
    delay(2_000),
  ]);
  if (child.exitCode === null) {
    child.kill('SIGKILL');
  }
}

function wrapSmokeError(
  kind: AgentBundleSmokeFailureKind,
  error: unknown,
  stderr: readonly Buffer[] = [],
): AgentBundleSmokeError {
  if (error instanceof AgentBundleSmokeError) {
    const detail = Buffer.concat(stderr).toString('utf8').trim();
    if (!detail || error.message.includes(detail)) {
      return error;
    }
    return new AgentBundleSmokeError(
      error.kind,
      `${error.message}\nAgent stderr:\n${detail}`,
      { cause: error },
    );
  }
  const detail = Buffer.concat(stderr).toString('utf8').trim();
  return new AgentBundleSmokeError(
    kind,
    `${error instanceof Error ? error.message : 'Agent bundle smoke failed'}${
      detail ? `\nAgent stderr:\n${detail}` : ''
    }`,
    { cause: error },
  );
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) =>
    setTimeout(resolvePromise, milliseconds),
  );
}
