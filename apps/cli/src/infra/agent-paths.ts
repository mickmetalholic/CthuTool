import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  chmod,
  mkdir,
  readdir,
  readFile,
  rename,
  writeFile,
} from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  type ActiveVersionPointer,
  type BundleLayout,
  type ReleaseEnvironmentCatalog,
  readActiveVersion,
  validateBundleInventory,
  validateBundleLayout,
  validateEnvironmentCatalog,
} from '@cthutool/agent-release';
import { resolveAgentUserDataDir } from './agent-tray-control';

export type AgentPaths = {
  readonly userDataDir: string;
  readonly installRoot: string;
  readonly runtimeDir: string;
  readonly logsDir: string;
};

export function resolveAgentPaths(
  input: { readonly userDataDir?: string; readonly installRoot?: string } = {},
): AgentPaths {
  const userDataDir = resolveAgentUserDataDir(input.userDataDir);
  let installRoot = input.installRoot ?? process.env.CTHUTOOL_AGENT_INSTALL_DIR;
  if (!installRoot) {
    if (process.platform === 'darwin') {
      installRoot = join(
        homedir(),
        'Library',
        'Application Support',
        'CthuTool',
        'agent-install',
      );
    } else if (process.platform === 'win32') {
      installRoot = join(
        process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'),
        'CthuTool',
        'Agent',
      );
    } else {
      installRoot = join(
        process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share'),
        'cthutool',
        'agent',
      );
    }
  }
  return {
    userDataDir,
    installRoot,
    runtimeDir: join(userDataDir, 'runtime'),
    logsDir: join(userDataDir, 'logs'),
  };
}

export async function readInstalledBundle(paths: AgentPaths): Promise<{
  readonly pointer: ActiveVersionPointer;
  readonly root: string;
  readonly layout: BundleLayout;
  readonly catalog: ReleaseEnvironmentCatalog;
}> {
  const pointer = await readActiveVersion(paths.installRoot);
  if (!pointer) throw new Error('CthuTool Agent is not installed');
  const root = join(paths.installRoot, 'versions', pointer.version);
  const layout = validateBundleLayout(
    JSON.parse(await readFile(join(root, 'layout.json'), 'utf8')),
  );
  const catalog = validateEnvironmentCatalog(
    JSON.parse(
      await readFile(
        join(root, ...layout.entryPoints.environmentCatalog.split('/')),
        'utf8',
      ),
    ),
  );
  return { pointer, root, layout, catalog };
}

export async function assertInstalledBundleInventory(
  bundle: Awaited<ReturnType<typeof readInstalledBundle>>,
): Promise<void> {
  validateBundleInventory(
    bundle.layout.target,
    await listRelativeFiles(bundle.root),
  );
}

export async function readEnvironmentSelection(
  paths: AgentPaths,
): Promise<string | undefined> {
  try {
    const value = JSON.parse(
      await readFile(join(paths.userDataDir, 'environment.json'), 'utf8'),
    ) as { readonly activeEnvironmentId?: unknown };
    return typeof value.activeEnvironmentId === 'string'
      ? value.activeEnvironmentId
      : undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

export async function writeEnvironmentSelection(
  paths: AgentPaths,
  environmentId: string,
): Promise<void> {
  await atomicPrivateWrite(
    join(paths.userDataDir, 'environment.json'),
    `${JSON.stringify({ activeEnvironmentId: environmentId }, null, 2)}\n`,
  );
}

export async function atomicPrivateWrite(
  path: string,
  value: string | Uint8Array,
): Promise<void> {
  await mkdir(dirname(path), { mode: 0o700, recursive: true });
  const temporary = `${path}.tmp-${randomUUID()}`;
  await writeFile(temporary, value, { mode: 0o600 });
  if (process.platform !== 'win32') await chmod(temporary, 0o600);
  else await protectWindowsFile(temporary);
  await rename(temporary, path);
}

async function protectWindowsFile(path: string): Promise<void> {
  const username = process.env.USERNAME;
  if (!username) {
    throw new Error(
      'Cannot resolve the Windows user for protected Agent storage',
    );
  }
  const identity = process.env.USERDOMAIN
    ? `${process.env.USERDOMAIN}\\${username}`
    : username;
  const exitCode = await new Promise<number | null>((resolvePromise) => {
    const child = spawn(
      'icacls.exe',
      [path, '/inheritance:r', '/grant:r', `${identity}:F`],
      { stdio: 'ignore', windowsHide: true },
    );
    child.once('error', () => resolvePromise(null));
    child.once('exit', resolvePromise);
  });
  if (exitCode !== 0) {
    throw new Error('Unable to protect Agent storage with a user-only ACL');
  }
}

async function listRelativeFiles(
  root: string,
  directory = root,
): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...(await listRelativeFiles(root, path)));
    } else if (entry.isFile()) {
      output.push(path.slice(root.length + 1).replaceAll('\\', '/'));
    }
  }
  return output;
}
