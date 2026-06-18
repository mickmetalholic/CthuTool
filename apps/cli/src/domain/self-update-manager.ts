import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const defaultSelfUpdateRepo =
  'https://github.com/mickmetalholic/CthuTool.git';
export const defaultSelfUpdateRef = 'main';

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
  | 'install-dependencies'
  | 'build'
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

function resolveOptions(
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
  const resolved = resolveOptions(options, deps);
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

  recordStep('install-dependencies');
  await runRequired(deps, 'pnpm', ['install', '--frozen-lockfile'], {
    cwd: resolved.installDir,
  });

  recordStep('build');
  await runRequired(deps, 'pnpm', ['--filter', '@cthutool/cli', 'build'], {
    cwd: resolved.installDir,
  });

  recordStep('install-global');
  await runRequired(deps, 'npm', ['install', '-g', resolved.installDir]);

  return {
    repo: resolved.repo,
    ref: resolved.ref,
    installDir: resolved.installDir,
    steps: completedSteps,
  };
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
