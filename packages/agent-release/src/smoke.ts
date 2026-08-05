import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { readdir, readFile, realpath, rm } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { join, resolve } from 'node:path';
import { validateEnvironmentCatalog } from './contracts';
import { validateBundleInventory, validateBundleLayout } from './layout';

type InstanceRecord = {
  readonly protocolVersion: number;
  readonly pid: number;
  readonly nonce: string;
  readonly controlEndpoint: string;
  readonly executablePath: string;
  readonly entryPoint: string;
};

export type AgentBundleSmokeResult = {
  readonly applicationVersion: string;
  readonly environmentId: string;
  readonly bridgeEndpoint: string;
  readonly bundledNodePath: string;
};

export async function smokeExtractedAgentBundle(input: {
  readonly bundleRoot: string;
  readonly userDataDir: string;
  readonly timeoutMs?: number;
  readonly environment?: Readonly<Record<string, string | undefined>>;
}): Promise<AgentBundleSmokeResult> {
  const timeoutMs = input.timeoutMs ?? 20_000;
  const layout = validateBundleLayout(
    JSON.parse(await readFile(join(input.bundleRoot, 'layout.json'), 'utf8')),
  );
  validateBundleInventory(
    layout.target,
    await listBundleFiles(input.bundleRoot),
  );
  const catalogPath = resolve(
    input.bundleRoot,
    ...layout.entryPoints.environmentCatalog.split('/'),
  );
  const catalog = validateEnvironmentCatalog(
    JSON.parse(await readFile(catalogPath, 'utf8')),
  );
  const userDataDir = resolve(input.userDataDir);
  const nodePath = await realpath(
    resolve(input.bundleRoot, ...layout.entryPoints.node.split('/')),
  );
  const agentPath = await realpath(
    resolve(input.bundleRoot, ...layout.entryPoints.agent.split('/')),
  );
  const instancePath = join(userDataDir, 'runtime', 'instance.json');
  await rm(instancePath, { force: true });

  const stderr: Buffer[] = [];
  const child = spawn(nodePath, [agentPath, '--user-data-dir', userDataDir], {
    cwd: input.bundleRoot,
    env: {
      ...process.env,
      ...input.environment,
      CTHUTOOL_AGENT_DISABLED: '1',
      CTHUTOOL_AGENT_ENVIRONMENTS_PATH: catalogPath,
      CTHUTOOL_AGENT_VERSION: layout.releaseVersion,
      NODE_ENV: 'production',
      PATH: '',
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    if (Buffer.concat(stderr).byteLength < 64 * 1024) {
      stderr.push(chunk);
    }
  });

  try {
    const record = await waitForInstance(
      instancePath,
      child,
      timeoutMs,
      stderr,
    );
    if (
      (await realpath(record.executablePath)) !== nodePath ||
      (await realpath(record.entryPoint)) !== agentPath ||
      record.pid !== child.pid
    ) {
      throw new Error(
        'Agent smoke process did not use the bundled entry points',
      );
    }
    const healthResult = requireSuccess(
      await requestControl(record, 'health'),
      'health',
    ) as {
      readonly applicationVersion?: string;
      readonly bridge?: { readonly endpoint?: string };
    };
    if (
      healthResult.applicationVersion !== layout.releaseVersion ||
      typeof healthResult.bridge?.endpoint !== 'string'
    ) {
      throw new Error(
        'Agent health did not report the release version and bridge',
      );
    }
    const environments = requireSuccess(
      await requestControl(record, 'environment.list'),
      'environment.list',
    ) as { readonly environments?: readonly { readonly id?: string }[] };
    const environmentId = catalog.profiles[0]?.environmentId;
    if (
      !environmentId ||
      !environments.environments?.some((item) => item.id === environmentId)
    ) {
      throw new Error(
        'Agent smoke did not load the release environment catalog',
      );
    }
    requireSuccess(
      await requestControl(record, 'environment.switch', environmentId),
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
      throw new Error('Agent bridge launch metadata is inconsistent');
    }
    const bootstrapResponse = await fetch(`${launch.endpoint}/v1/bootstrap`, {
      headers: { origin: catalog.profiles[0].webOrigin },
      signal: AbortSignal.timeout(Math.min(timeoutMs, 5_000)),
    });
    if (!bootstrapResponse.ok) {
      throw new Error(
        `Agent bridge readiness returned ${bootstrapResponse.status}`,
      );
    }
    await requestControl(record, 'shutdown');
    await waitForExit(child, timeoutMs);
    await waitForRemoval(instancePath, timeoutMs);
    return {
      applicationVersion: layout.releaseVersion,
      bridgeEndpoint: launch.endpoint,
      bundledNodePath: nodePath,
      environmentId,
    };
  } catch (error) {
    await terminateExactChild(child);
    const detail = Buffer.concat(stderr).toString('utf8').trim();
    throw new Error(
      `${error instanceof Error ? error.message : 'Agent bundle smoke failed'}${
        detail ? `\nAgent stderr:\n${detail}` : ''
      }`,
      { cause: error },
    );
  }
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
      throw new Error(
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
  throw new Error('Timed out waiting for Agent readiness record');
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
): Promise<unknown> {
  return new Promise((resolvePromise, rejectPromise) => {
    const socket = createConnection(record.controlEndpoint);
    const timer = setTimeout(() => {
      socket.destroy();
      rejectPromise(new Error(`Agent ${operation} request timed out`));
    }, 5_000);
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

function requireSuccess(value: unknown, operation: string): unknown {
  if (
    !value ||
    typeof value !== 'object' ||
    (value as { readonly ok?: boolean }).ok !== true ||
    !('result' in value)
  ) {
    throw new Error(`Agent ${operation} control request failed`);
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
              new Error(
                `Agent exited with code ${code ?? 'none'} signal ${signal ?? 'none'}`,
              ),
            );
      });
    }),
    delay(timeoutMs).then(() => {
      throw new Error('Timed out waiting for coordinated Agent shutdown');
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
  throw new Error('Agent shutdown left a stale instance record');
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

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) =>
    setTimeout(resolvePromise, milliseconds),
  );
}
