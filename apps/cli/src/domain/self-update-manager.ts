import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const defaultSelfUpdateRepo =
  'https://github.com/mickmetalholic/CthuTool.git';
export const defaultSelfUpdateRef = 'main';
export const committedCliBundlePath = 'apps/cli/dist/index.js';

export type SelfUpdateOptions = {
  readonly repo?: string;
  readonly ref?: string;
  readonly installDir?: string;
};

export type SelfUpdateStep =
  | 'clone'
  | 'fetch'
  | 'checkout'
  | 'pull'
  | 'verify-bundle'
  | 'install-global';

export type SelfUpdateCommandResult = {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd?: string;
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

export type SelfUpdateResult = {
  readonly repo: string;
  readonly ref: string;
  readonly installDir: string;
  readonly steps: readonly SelfUpdateStep[];
};

export type CliInstallationStatus = {
  readonly version: string;
  readonly mode: 'local' | 'remote';
  readonly installDir: string;
  readonly repo: string;
  readonly ref: string;
  readonly commit?: string;
  readonly bundlePath: string;
  readonly bundlePresent: boolean;
};

export type SelfUpdateDeps = {
  readonly exists: (path: string) => boolean;
  readonly mkdir: (path: string) => Promise<void>;
  readonly run: (
    command: string,
    args: readonly string[],
    options?: { readonly cwd?: string; readonly allowFailure?: boolean },
  ) => Promise<SelfUpdateCommandResult>;
  readonly env: Record<string, string | undefined>;
  readonly home: () => string;
  readonly onStep?: (step: SelfUpdateStep) => void;
};

export class SelfUpdateError extends Error {
  readonly result: SelfUpdateCommandResult;

  constructor(result: SelfUpdateCommandResult) {
    super(formatFailedCommand(result));
    this.name = 'SelfUpdateError';
    this.result = result;
  }
}

export function getDefaultSelfUpdateInstallDir(home = homedir()): string {
  return join(home, '.cthutool', 'source', 'CthuTool');
}

export function createSelfUpdateDeps(
  onStep?: (step: SelfUpdateStep) => void,
): SelfUpdateDeps {
  return {
    exists: existsSync,
    mkdir: async (path) => {
      await mkdir(path, { recursive: true });
    },
    run: runCommand,
    env: process.env,
    home: homedir,
    onStep,
  };
}

export function getCliVersion(): string {
  return readPackageVersion(findRepoRootFromModule());
}

export function resolveSelfUpdateOptions(
  options: SelfUpdateOptions,
  deps: SelfUpdateDeps,
): Required<SelfUpdateOptions> {
  const home = deps.home();
  return {
    repo:
      options.repo ??
      deps.env.CHC_REPO_URL ??
      deps.env.CHC_REPO ??
      defaultSelfUpdateRepo,
    ref: options.ref ?? deps.env.CHC_REF ?? defaultSelfUpdateRef,
    installDir:
      options.installDir ??
      deps.env.CHC_INSTALL_DIR ??
      getDefaultSelfUpdateInstallDir(home),
  };
}

function emitStep(deps: SelfUpdateDeps, step: SelfUpdateStep): void {
  deps.onStep?.(step);
}

function ensureOk(result: SelfUpdateCommandResult): void {
  if (result.code !== 0) {
    throw new SelfUpdateError(result);
  }
}

async function runRequired(
  deps: SelfUpdateDeps,
  command: string,
  args: readonly string[],
  options?: { readonly cwd?: string },
): Promise<void> {
  ensureOk(await deps.run(command, args, options));
}

async function remoteRefExists(
  deps: SelfUpdateDeps,
  installDir: string,
  ref: string,
): Promise<boolean> {
  const result = await deps.run(
    'git',
    ['rev-parse', '--verify', `origin/${ref}`],
    { cwd: installDir, allowFailure: true },
  );
  return result.code === 0;
}

export async function runSelfUpdate(
  options: SelfUpdateOptions = {},
  deps = createSelfUpdateDeps(),
): Promise<SelfUpdateResult> {
  const resolved = resolveSelfUpdateOptions(options, deps);
  const completedSteps: SelfUpdateStep[] = [];
  const recordStep = (step: SelfUpdateStep) => {
    completedSteps.push(step);
    emitStep(deps, step);
  };

  if (deps.exists(join(resolved.installDir, '.git'))) {
    recordStep('fetch');
    await runRequired(
      deps,
      'git',
      ['remote', 'set-url', 'origin', resolved.repo],
      {
        cwd: resolved.installDir,
      },
    );
    await runRequired(deps, 'git', ['fetch', '--tags', 'origin'], {
      cwd: resolved.installDir,
    });
  } else {
    recordStep('clone');
    await deps.mkdir(dirname(resolved.installDir));
    await runRequired(deps, 'git', [
      'clone',
      resolved.repo,
      resolved.installDir,
    ]);
  }

  recordStep('checkout');
  await runRequired(deps, 'git', ['checkout', resolved.ref], {
    cwd: resolved.installDir,
  });

  if (await remoteRefExists(deps, resolved.installDir, resolved.ref)) {
    recordStep('pull');
    await runRequired(
      deps,
      'git',
      ['pull', '--ff-only', 'origin', resolved.ref],
      {
        cwd: resolved.installDir,
      },
    );
  }

  recordStep('verify-bundle');
  verifyCommittedBundle(deps, resolved.installDir);

  recordStep('install-global');
  await runRequired(deps, 'npm', [
    'install',
    '-g',
    '--ignore-scripts',
    resolved.installDir,
  ]);

  return {
    repo: resolved.repo,
    ref: resolved.ref,
    installDir: resolved.installDir,
    steps: completedSteps,
  };
}

export async function getCliInstallationStatus(
  options: SelfUpdateOptions = {},
  deps = createSelfUpdateDeps(),
): Promise<CliInstallationStatus> {
  const installDir =
    options.installDir ?? deps.env.CHC_INSTALL_DIR ?? findRepoRootFromModule();
  const resolved = resolveSelfUpdateOptions({ ...options, installDir }, deps);
  const bundlePath = join(resolved.installDir, committedCliBundlePath);
  const gitRoot = join(resolved.installDir, '.git');
  const repo = deps.exists(gitRoot)
    ? ((await runOptional(deps, 'git', ['remote', 'get-url', 'origin'], {
        cwd: resolved.installDir,
      })) ?? resolved.repo)
    : resolved.repo;
  const ref = deps.exists(gitRoot)
    ? ((await runOptional(deps, 'git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        cwd: resolved.installDir,
      })) ?? resolved.ref)
    : resolved.ref;
  const commit = deps.exists(gitRoot)
    ? await runOptional(deps, 'git', ['rev-parse', '--short', 'HEAD'], {
        cwd: resolved.installDir,
      })
    : undefined;

  return {
    version: getCliVersion(),
    mode:
      resolve(resolved.installDir) ===
      resolve(getDefaultSelfUpdateInstallDir(deps.home()))
        ? 'remote'
        : 'local',
    installDir: resolved.installDir,
    repo,
    ref,
    commit,
    bundlePath,
    bundlePresent: deps.exists(bundlePath),
  };
}

async function runOptional(
  deps: SelfUpdateDeps,
  command: string,
  args: readonly string[],
  options?: { readonly cwd?: string },
): Promise<string | undefined> {
  const result = await deps.run(command, args, {
    ...options,
    allowFailure: true,
  });
  if (result.code !== 0) {
    return undefined;
  }
  const value = result.stdout.trim();
  return value.length > 0 ? value : undefined;
}

function verifyCommittedBundle(deps: SelfUpdateDeps, installDir: string): void {
  const bundlePath = join(installDir, committedCliBundlePath);
  if (!deps.exists(bundlePath)) {
    throw new Error(
      `missing committed CLI bundle: ${bundlePath}; the selected ref must include ${committedCliBundlePath}`,
    );
  }
}

function formatFailedCommand(result: SelfUpdateCommandResult): string {
  const cwd = result.cwd ? ` (cwd: ${result.cwd})` : '';
  const output = `${result.stderr}\n${result.stdout}`.trim();
  const suffix = output.length > 0 ? `\n${output}` : '';
  return `command failed: ${result.command} ${result.args.join(' ')}${cwd}${suffix}`;
}

function runCommand(
  command: string,
  args: readonly string[],
  options: { readonly cwd?: string; readonly allowFailure?: boolean } = {},
): Promise<SelfUpdateCommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd: options.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      reject(error);
    });
    child.on('close', (code) => {
      resolve({
        command,
        args,
        cwd: options.cwd,
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

function findRepoRootFromModule(): string {
  let current = dirname(fileURLToPath(import.meta.url));
  while (true) {
    if (isCthuToolRoot(current)) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      throw new Error('Unable to locate CthuTool package root.');
    }
    current = parent;
  }
}

function isCthuToolRoot(path: string): boolean {
  try {
    const pkg = JSON.parse(
      readFileSync(join(path, 'package.json'), 'utf8'),
    ) as {
      name?: unknown;
    };
    return pkg.name === 'cthutool';
  } catch {
    return false;
  }
}

function readPackageVersion(root: string): string {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
    version?: unknown;
  };
  if (typeof pkg.version !== 'string' || pkg.version.trim().length === 0) {
    throw new Error(
      `Package version is missing: ${join(root, 'package.json')}`,
    );
  }
  return pkg.version;
}
