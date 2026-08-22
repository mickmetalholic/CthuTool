import { spawn } from 'node:child_process';

export type GitFailureKind =
  | 'start'
  | 'authentication'
  | 'network'
  | 'conflict'
  | 'non_fast_forward'
  | 'worktree'
  | 'unknown';

export type GitCommandResult = {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd?: string;
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

export class ObsidianAgentsGitError extends Error {
  readonly kind: GitFailureKind;
  readonly result?: GitCommandResult;

  constructor(
    kind: GitFailureKind,
    message: string,
    result?: GitCommandResult,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ObsidianAgentsGitError';
    this.kind = kind;
    this.result = result;
  }
}

export type GitRunOptions = {
  readonly cwd: string;
  readonly allowFailure?: boolean;
  readonly env?: NodeJS.ProcessEnv;
};

export type GitSnapshot = {
  readonly isRepository: boolean;
  readonly branch?: string;
  readonly remote?: string;
  readonly hasHead: boolean;
  readonly worktree: readonly string[];
  readonly ahead?: number;
  readonly behind?: number;
  readonly comparisonAvailable: boolean;
  readonly head?: string;
};

export async function runGit(
  args: readonly string[],
  options: GitRunOptions,
): Promise<GitCommandResult> {
  const result = await spawnGit(args, options);
  if (result.code !== 0 && options.allowFailure !== true) {
    throw createGitError(result);
  }
  return result;
}

export async function readGitSnapshot(cwd: string): Promise<GitSnapshot> {
  const root = await runGit(['rev-parse', '--show-toplevel'], {
    cwd,
    allowFailure: true,
  });
  if (root.code !== 0) {
    return {
      isRepository: false,
      hasHead: false,
      worktree: [],
      comparisonAvailable: false,
    };
  }

  const branchResult = await runGit(
    ['symbolic-ref', '--quiet', '--short', 'HEAD'],
    { cwd, allowFailure: true },
  );
  const branch =
    branchResult.code === 0 ? trimOutput(branchResult.stdout) : undefined;
  const remoteResult = await runGit(['remote', 'get-url', 'origin'], {
    cwd,
    allowFailure: true,
  });
  const remote =
    remoteResult.code === 0 ? trimOutput(remoteResult.stdout) : undefined;
  const headResult = await runGit(['rev-parse', '--verify', 'HEAD'], {
    cwd,
    allowFailure: true,
  });
  const head =
    headResult.code === 0 ? trimOutput(headResult.stdout) : undefined;
  const statusResult = await runGit(
    ['status', '--porcelain', '--untracked-files=all'],
    { cwd, allowFailure: true },
  );
  const worktree =
    statusResult.code === 0 ? splitLines(statusResult.stdout) : [];

  const comparison =
    branch && head
      ? await readAheadBehind(cwd, branch)
      : { ahead: undefined, behind: undefined, available: false };

  return {
    isRepository: true,
    branch,
    remote,
    hasHead: head !== undefined,
    head,
    worktree,
    ahead: comparison.ahead,
    behind: comparison.behind,
    comparisonAvailable: comparison.available,
  };
}

export async function initializeGitRepository(
  cwd: string,
  branch: string,
): Promise<void> {
  assertBranchName(branch);
  await runGit(['init'], { cwd });
  await runGit(['symbolic-ref', 'HEAD', `refs/heads/${branch}`], { cwd });
}

export async function cloneGitRepository(
  remote: string,
  targetPath: string,
  cwd: string,
): Promise<void> {
  await runGit(['clone', remote, targetPath], { cwd });
}

export async function configureGitRemote(
  cwd: string,
  remote: string,
): Promise<void> {
  const current = await runGit(['remote', 'get-url', 'origin'], {
    cwd,
    allowFailure: true,
  });
  if (current.code === 0) {
    if (trimOutput(current.stdout) !== remote) {
      await runGit(['remote', 'set-url', 'origin', remote], { cwd });
    }
    return;
  }
  await runGit(['remote', 'add', 'origin', remote], { cwd });
}

export async function fetchGitRemote(cwd: string): Promise<void> {
  await runGit(['fetch', '--no-tags', 'origin'], { cwd });
}

export async function remoteBranchExists(
  cwd: string,
  branch: string,
): Promise<boolean> {
  assertBranchName(branch);
  const result = await runGit(
    ['rev-parse', '--verify', `refs/remotes/origin/${branch}`],
    { cwd, allowFailure: true },
  );
  return result.code === 0;
}

export async function mergeFastForward(
  cwd: string,
  branch: string,
): Promise<void> {
  assertBranchName(branch);
  await runGit(['merge', '--ff-only', `origin/${branch}`], { cwd });
}

export async function commitAll(
  cwd: string,
  message: string,
): Promise<{ readonly changed: boolean; readonly commit?: string }> {
  const before = await runGit(
    ['status', '--porcelain', '--untracked-files=all'],
    { cwd },
  );
  if (trimOutput(before.stdout).length === 0) {
    return { changed: false };
  }
  await runGit(['add', '--all'], { cwd });
  await runGit(['commit', '-m', message], { cwd });
  const head = await runGit(['rev-parse', '--verify', 'HEAD'], { cwd });
  return { changed: true, commit: trimOutput(head.stdout) };
}

export async function pushGitBranch(
  cwd: string,
  branch: string,
): Promise<void> {
  assertBranchName(branch);
  await runGit(['push', '--set-upstream', 'origin', branch], { cwd });
}

export function redactGitText(value: string): string {
  return value
    .replace(/:\/\/[^/\s]+@/gu, '://***@')
    .replace(
      /(token|secret|password|passwd|authorization|credential)=([^&\s]+)/giu,
      '$1=[redacted]',
    );
}

export function gitErrorMessage(error: unknown): string {
  if (error instanceof ObsidianAgentsGitError) return error.message;
  return error instanceof Error ? error.message : String(error);
}

async function readAheadBehind(
  cwd: string,
  branch: string,
): Promise<{
  readonly ahead?: number;
  readonly behind?: number;
  readonly available: boolean;
}> {
  if (!(await remoteBranchExists(cwd, branch))) {
    return { available: false };
  }
  const result = await runGit(
    ['rev-list', '--left-right', '--count', `HEAD...origin/${branch}`],
    { cwd, allowFailure: true },
  );
  if (result.code !== 0) return { available: false };
  const [aheadRaw, behindRaw] = trimOutput(result.stdout).split(/\s+/u);
  const ahead = Number.parseInt(aheadRaw ?? '', 10);
  const behind = Number.parseInt(behindRaw ?? '', 10);
  if (!Number.isFinite(ahead) || !Number.isFinite(behind)) {
    return { available: false };
  }
  return { ahead, behind, available: true };
}

function spawnGit(
  args: readonly string[],
  options: GitRunOptions,
): Promise<GitCommandResult> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('git', [...args], {
      cwd: options.cwd,
      env: options.env ? { ...process.env, ...options.env } : process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      rejectPromise(
        new ObsidianAgentsGitError(
          'start',
          `Unable to start git: ${redactGitText(error.message)}`,
          undefined,
          { cause: error },
        ),
      );
    });
    child.on('close', (code) => {
      resolvePromise({
        command: 'git',
        args,
        cwd: options.cwd,
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

function createGitError(result: GitCommandResult): ObsidianAgentsGitError {
  const kind = classifyGitFailure(result);
  const detail = redactGitText(
    `${result.stderr.trim()} ${result.stdout.trim()}`,
  ).trim();
  const command = ['git', ...result.args].join(' ');
  return new ObsidianAgentsGitError(
    kind,
    detail.length > 0
      ? `Git ${kind.replaceAll('_', ' ')} failure while running ${command}: ${detail}`
      : `Git ${kind.replaceAll('_', ' ')} failure while running ${command}.`,
    result,
  );
}

function classifyGitFailure(result: GitCommandResult): GitFailureKind {
  const text = `${result.stderr}\n${result.stdout}`.toLowerCase();
  if (
    /authentication failed|permission denied|could not read username|access denied|http 401|http 403/u.test(
      text,
    )
  ) {
    return 'authentication';
  }
  if (/non-fast-forward|fetch first|rejected|failed to push/u.test(text)) {
    return 'non_fast_forward';
  }
  if (/conflict|merge conflict|unmerged/u.test(text)) return 'conflict';
  if (
    /could not resolve host|network is unreachable|connection timed out|unable to access/u.test(
      text,
    )
  ) {
    return 'network';
  }
  if (/not a git repository|working tree/u.test(text)) return 'worktree';
  return 'unknown';
}

function assertBranchName(branch: string): void {
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u.test(branch) ||
    branch.includes('..') ||
    branch.includes('//') ||
    branch.endsWith('/') ||
    branch.endsWith('.')
  ) {
    throw new ObsidianAgentsGitError(
      'worktree',
      `Invalid Git branch name: ${branch}`,
    );
  }
}

function trimOutput(value: string): string {
  return value.trim();
}

function splitLines(value: string): string[] {
  return value.split(/\r?\n/u).filter((line) => line.length > 0);
}
