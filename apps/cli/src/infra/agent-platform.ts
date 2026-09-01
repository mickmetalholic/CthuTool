import { spawn } from 'node:child_process';
import {
  chmod,
  mkdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { readAgentInstance, requestAgentHealth } from './agent-control';
import { type AgentPaths, readInstalledBundle } from './agent-paths';
import {
  readTrayInstanceRecord,
  requestTrayHealth,
  resolveTrayInstancePath,
} from './agent-tray-control';

export async function startInstalledAgent(
  paths: AgentPaths,
  timeoutMs = 20_000,
): Promise<'started' | 'already-running'> {
  const result = await startInstalledTray(paths, timeoutMs);
  const tray = await readTrayInstanceRecord(
    resolveTrayInstancePath(paths.userDataDir),
  );
  if (!tray) throw new Error('Agent tray instance record is not ready');
  const snapshot = await requestTrayHealth({ record: tray, timeoutMs: 500 });
  if (snapshot.setupRequired || snapshot.state === 'SetupRequired') {
    return 'started';
  }

  const bundle = await readInstalledBundle(paths);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const agent = await readAgentInstance(paths.userDataDir);
      if (!agent) throw new Error('Agent instance record is not ready');
      await assertExactAgentRuntime(bundle, agent);
      return result === 'already-running' ? 'already-running' : 'started';
    } catch {
      /* still starting */
    }
    await delay(100);
  }
  throw new Error('Timed out waiting for the tray-owned Agent to become ready');
}

export async function startInstalledTray(
  paths: AgentPaths,
  timeoutMs = 20_000,
): Promise<'started' | 'already-running'> {
  const bundle = await readInstalledBundle(paths);
  const executable = join(
    bundle.root,
    ...bundle.layout.entryPoints.tray.split('/'),
  );
  const instancePath = resolveTrayInstancePath(paths.userDataDir);
  const current = await readTrayInstanceRecord(instancePath);
  if (current) {
    let healthy = false;
    try {
      await requestTrayHealth({ record: current, timeoutMs: 500 });
      healthy = true;
    } catch {
      /* stale record is owned and recovered by the tray. */
    }
    if (healthy) {
      await assertExactTrayRuntime(executable, current.executablePath);
      return 'already-running';
    }
  }
  if (process.platform !== 'win32') await chmod(executable, 0o755);
  const child = spawn(executable, ['--user-data-dir', paths.userDataDir], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: { ...process.env, CTHUTOOL_AGENT_DATA_DIR: paths.userDataDir },
  });
  child.unref();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const record = await readTrayInstanceRecord(instancePath).catch(
      () => undefined,
    );
    if (record) {
      try {
        await requestTrayHealth({ record, timeoutMs: 500 });
        await assertExactTrayRuntime(executable, record.executablePath);
        return 'started';
      } catch {
        /* still starting */
      }
    }
    await delay(100);
  }
  throw new Error('Timed out waiting for the Agent tray to become ready');
}

async function assertExactTrayRuntime(
  expectedTray: string,
  actualTray: string,
): Promise<void> {
  if ((await realpath(actualTray)) !== (await realpath(expectedTray))) {
    throw new Error('Running tray identity does not match the active bundle');
  }
}

async function assertExactAgentRuntime(
  bundle: Awaited<ReturnType<typeof readInstalledBundle>>,
  agent: Awaited<ReturnType<typeof readAgentInstance>>,
): Promise<void> {
  if (!agent) throw new Error('Running tray has no exact Agent instance');
  const health = await requestAgentHealth(agent, 1_000);
  const expectedNode = join(
    bundle.root,
    ...bundle.layout.entryPoints.node.split('/'),
  );
  const expectedAgent = join(
    bundle.root,
    ...bundle.layout.entryPoints.agent.split('/'),
  );
  if (
    (await realpath(agent.executablePath)) !== (await realpath(expectedNode)) ||
    (await realpath(agent.entryPoint)) !== (await realpath(expectedAgent)) ||
    health.applicationVersion !== bundle.pointer.version
  ) {
    throw new Error('Running Agent identity does not match the active bundle');
  }
}

export function isAutostartSupported(
  platform: NodeJS.Platform = process.platform,
): boolean {
  return platform === 'darwin' || platform === 'win32';
}

export type AgentPlatformAdapterOptions = {
  readonly platform?: NodeJS.Platform;
  readonly launchAgentPath?: string;
  readonly runProcess?: (
    command: string,
    args: readonly string[],
  ) => Promise<number | null>;
};

export async function getAutostartStatus(
  _paths: AgentPaths,
  options: AgentPlatformAdapterOptions = {},
): Promise<{ readonly enabled: boolean; readonly supported: boolean }> {
  const platform = options.platform ?? process.platform;
  if (platform === 'darwin') {
    try {
      await readFile(options.launchAgentPath ?? resolveLaunchAgentPath());
      return { enabled: true, supported: true };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        return { enabled: false, supported: true };
      throw error;
    }
  }
  if (platform === 'win32') {
    const result = await (options.runProcess ?? runProcess)('reg.exe', [
      'query',
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
      '/v',
      'CthuToolAgent',
    ]);
    return { enabled: result === 0, supported: true };
  }
  return { enabled: false, supported: false };
}

export async function setAutostart(
  paths: AgentPaths,
  enabled: boolean,
  options: AgentPlatformAdapterOptions = {},
): Promise<{ readonly enabled: boolean; readonly supported: boolean }> {
  const platform = options.platform ?? process.platform;
  if (platform === 'darwin') {
    const plist = options.launchAgentPath ?? resolveLaunchAgentPath();
    if (!enabled) await rm(plist, { force: true });
    else {
      const executable = await resolveTrayExecutable(paths);
      await mkdir(dirname(plist), { mode: 0o700, recursive: true });
      await writeFile(
        plist,
        createLaunchAgentPlist(executable, paths.userDataDir),
        { mode: 0o600 },
      );
    }
    return { enabled, supported: true };
  }
  if (platform === 'win32') {
    const registry = [
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    ];
    const executable = enabled ? await resolveTrayExecutable(paths) : '';
    const args = enabled
      ? [
          'add',
          ...registry,
          '/v',
          'CthuToolAgent',
          '/t',
          'REG_SZ',
          '/d',
          `"${executable}" --user-data-dir "${paths.userDataDir}"`,
          '/f',
        ]
      : ['delete', ...registry, '/v', 'CthuToolAgent', '/f'];
    const code = await (options.runProcess ?? runProcess)('reg.exe', args);
    if (code !== 0 && enabled)
      throw new Error('Unable to update Windows Agent autostart');
    return { enabled, supported: true };
  }
  return { enabled: false, supported: false };
}

async function resolveTrayExecutable(paths: AgentPaths): Promise<string> {
  const bundle = await readInstalledBundle(paths);
  return join(bundle.root, ...bundle.layout.entryPoints.tray.split('/'));
}

function resolveLaunchAgentPath(): string {
  return join(homedir(), 'Library', 'LaunchAgents', 'dev.cthutool.agent.plist');
}

function createLaunchAgentPlist(
  executable: string,
  userDataDir: string,
): string {
  const escapeXml = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>Label</key><string>dev.cthutool.agent</string><key>ProgramArguments</key><array><string>${escapeXml(executable)}</string><string>--user-data-dir</string><string>${escapeXml(userDataDir)}</string></array><key>RunAtLoad</key><true/></dict></plist>\n`;
}

async function runProcess(
  command: string,
  args: readonly string[],
): Promise<number | null> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'ignore', windowsHide: true });
    child.once('error', () => resolve(null));
    child.once('exit', (code) => resolve(code));
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
