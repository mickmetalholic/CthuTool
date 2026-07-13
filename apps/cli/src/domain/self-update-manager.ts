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

const maxChangeHighlights = 5;
const maxSubjectLength = 120;
const maxDetailLines = 8;
const maxDetailLineLength = 240;

export type SelfUpdateOptions = {
  readonly repo?: string;
  readonly ref?: string;
  readonly installDir?: string;
};

export type SelfUpdatePlanStatus =
  | 'install_required'
  | 'update_available'
  | 'up_to_date'
  | 'blocked';

export type SelfUpdateApplyStatus = 'installed' | 'updated' | 'up_to_date';

export type SelfUpdatePhase =
  | 'preflight'
  | 'check_remote'
  | 'clone'
  | 'fetch'
  | 'checkout'
  | 'verify_bundle'
  | 'install_global';

export type SelfUpdateStep =
  | 'clone'
  | 'fetch'
  | 'checkout'
  | 'pull'
  | 'verify-bundle'
  | 'install-global';

export type SelfUpdateIdentity = {
  readonly ref: string;
  readonly commit: string;
  readonly shortCommit: string;
};

export type SelfUpdateChange = {
  readonly commit: string;
  readonly subject: string;
};

export type SelfUpdateChangeSummary = {
  readonly count: number;
  readonly highlights: readonly SelfUpdateChange[];
  readonly omitted: number;
};

export type SelfUpdateBlock = {
  readonly kind: 'dirty_checkout' | 'diverged_branch';
  readonly message: string;
  readonly hint: string;
};

export type SelfUpdatePlan = {
  readonly status: SelfUpdatePlanStatus;
  readonly repo: string;
  readonly ref: string;
  readonly installDir: string;
  readonly before?: SelfUpdateIdentity;
  readonly target?: SelfUpdateIdentity;
  readonly changes?: SelfUpdateChangeSummary;
  readonly block?: SelfUpdateBlock;
  readonly phases: readonly SelfUpdatePhase[];
};

export type SelfUpdateCommandResult = {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd?: string;
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

export type SelfUpdateEvent =
  | {
      readonly type: 'phase_started' | 'phase_completed';
      readonly phase: SelfUpdatePhase;
    }
  | { readonly type: 'plan'; readonly plan: SelfUpdatePlan }
  | {
      readonly type: 'command';
      readonly phase: SelfUpdatePhase;
      readonly command: string;
      readonly args: readonly string[];
      readonly cwd?: string;
      readonly code: number;
      readonly stdout?: string;
      readonly stderr?: string;
    }
  | {
      readonly type: 'failure';
      readonly phase: SelfUpdatePhase;
      readonly summary: string;
      readonly cause?: string;
      readonly hint: string;
    };

export type SelfUpdateResult = {
  readonly status: SelfUpdateApplyStatus;
  readonly repo: string;
  readonly ref: string;
  readonly installDir: string;
  readonly before?: SelfUpdateIdentity;
  readonly target?: SelfUpdateIdentity;
  readonly after?: SelfUpdateIdentity;
  readonly changes?: SelfUpdateChangeSummary;
  readonly phases: readonly SelfUpdatePhase[];
  /** Compatibility detail retained for existing JSON consumers. */
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
  readonly onEvent?: (event: SelfUpdateEvent) => void;
};

export class SelfUpdateError extends Error {
  readonly phase: SelfUpdatePhase;
  readonly summary: string;
  readonly causeText?: string;
  readonly hint: string;
  readonly result?: SelfUpdateCommandResult;

  constructor(options: {
    readonly phase: SelfUpdatePhase;
    readonly summary: string;
    readonly cause?: string;
    readonly hint: string;
    readonly result?: SelfUpdateCommandResult;
  }) {
    const cause = options.cause ? `\nCause: ${options.cause}` : '';
    super(`${options.summary}${cause}\nNext: ${options.hint}`);
    this.name = 'SelfUpdateError';
    this.phase = options.phase;
    this.summary = options.summary;
    this.causeText = options.cause;
    this.hint = options.hint;
    this.result = options.result;
  }
}

export function getDefaultSelfUpdateInstallDir(home = homedir()): string {
  return join(home, '.cthutool', 'source', 'CthuTool');
}

export function createSelfUpdateDeps(
  onEvent?: (event: SelfUpdateEvent) => void,
): SelfUpdateDeps {
  return {
    exists: existsSync,
    mkdir: async (path) => {
      await mkdir(path, { recursive: true });
    },
    run: runCommand,
    env: process.env,
    home: homedir,
    onEvent,
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

function emit(deps: SelfUpdateDeps, event: SelfUpdateEvent): void {
  deps.onEvent?.(event);
}

async function runPhase<T>(
  deps: SelfUpdateDeps,
  phase: SelfUpdatePhase,
  action: () => Promise<T>,
): Promise<T> {
  emit(deps, { type: 'phase_started', phase });
  try {
    const value = await action();
    emit(deps, { type: 'phase_completed', phase });
    return value;
  } catch (error) {
    const failure = toPhaseError(error, phase);
    emit(deps, {
      type: 'failure',
      phase: failure.phase,
      summary: failure.summary,
      cause: failure.causeText,
      hint: failure.hint,
    });
    throw failure;
  }
}

function phaseHint(phase: SelfUpdatePhase): string {
  switch (phase) {
    case 'preflight':
      return 'Check the selected directory and local Git state, then retry.';
    case 'check_remote':
      return 'Check the repository URL, ref, network access, and Git credentials.';
    case 'clone':
      return 'Check repository access and permissions for the managed source directory.';
    case 'fetch':
      return 'Check network access and the configured origin, then retry.';
    case 'checkout':
      return 'Inspect the checkout state and selected ref before retrying.';
    case 'verify_bundle':
      return `Select a ref containing ${committedCliBundlePath}.`;
    case 'install_global':
      return 'Check npm global-install permissions, then retry the update.';
  }
}

function toPhaseError(error: unknown, phase: SelfUpdatePhase): SelfUpdateError {
  if (error instanceof SelfUpdateError) {
    return error;
  }
  return new SelfUpdateError({
    phase,
    summary: `Update failed during ${formatPhase(phase)}.`,
    cause: boundedText(error instanceof Error ? error.message : String(error)),
    hint: phaseHint(phase),
  });
}

function commandFailure(
  phase: SelfUpdatePhase,
  result: SelfUpdateCommandResult,
): SelfUpdateError {
  return new SelfUpdateError({
    phase,
    summary: `Update failed during ${formatPhase(phase)}.`,
    cause:
      boundedCommandOutput(result) ||
      `Command exited with code ${result.code}.`,
    hint: phaseHint(phase),
    result,
  });
}

async function execute(
  deps: SelfUpdateDeps,
  phase: SelfUpdatePhase,
  command: string,
  args: readonly string[],
  options: { readonly cwd?: string; readonly allowFailure?: boolean } = {},
): Promise<SelfUpdateCommandResult> {
  let result: SelfUpdateCommandResult;
  try {
    result = await deps.run(command, args, options);
  } catch (error) {
    throw new SelfUpdateError({
      phase,
      summary: `Unable to start ${command} during ${formatPhase(phase)}.`,
      cause: boundedText(
        error instanceof Error ? error.message : String(error),
      ),
      hint: phaseHint(phase),
    });
  }
  emit(deps, {
    type: 'command',
    phase,
    command,
    args: redactArgs(args),
    cwd: options.cwd,
    code: result.code,
    stdout: boundedText(result.stdout),
    stderr: boundedText(result.stderr),
  });
  if (result.code !== 0 && options.allowFailure !== true) {
    throw commandFailure(phase, result);
  }
  return result;
}

async function requiredOutput(
  deps: SelfUpdateDeps,
  phase: SelfUpdatePhase,
  args: readonly string[],
  cwd: string,
): Promise<string> {
  const result = await execute(deps, phase, 'git', args, { cwd });
  const value = result.stdout.trim();
  if (value.length === 0) {
    throw new SelfUpdateError({
      phase,
      summary: `Git returned no identity during ${formatPhase(phase)}.`,
      hint: phaseHint(phase),
    });
  }
  return value;
}

async function readIdentity(
  deps: SelfUpdateDeps,
  phase: SelfUpdatePhase,
  cwd: string,
  fallbackRef: string,
  revision = 'HEAD',
): Promise<SelfUpdateIdentity> {
  const commit = await requiredOutput(
    deps,
    phase,
    ['rev-parse', '--verify', `${revision}^{commit}`],
    cwd,
  );
  const refResult =
    revision === 'HEAD'
      ? await execute(
          deps,
          phase,
          'git',
          ['symbolic-ref', '--quiet', '--short', 'HEAD'],
          { cwd, allowFailure: true },
        )
      : undefined;
  return {
    ref:
      refResult?.code === 0
        ? refResult.stdout.trim() || fallbackRef
        : fallbackRef,
    commit,
    shortCommit: commit.slice(0, 7),
  };
}

function finishPlan(
  deps: SelfUpdateDeps,
  plan: SelfUpdatePlan,
): SelfUpdatePlan {
  emit(deps, { type: 'plan', plan });
  return plan;
}

export async function planSelfUpdate(
  options: SelfUpdateOptions = {},
  deps = createSelfUpdateDeps(),
): Promise<SelfUpdatePlan> {
  const resolved = resolveSelfUpdateOptions(options, deps);
  const publicResolved = {
    ...resolved,
    repo: redactValue(resolved.repo),
  };
  const phases: SelfUpdatePhase[] = [];
  const gitRoot = join(resolved.installDir, '.git');

  const initial = await runPhase(deps, 'preflight', async () => {
    if (!deps.exists(gitRoot)) {
      return undefined;
    }
    const status = await execute(
      deps,
      'preflight',
      'git',
      ['status', '--porcelain', '--untracked-files=normal'],
      { cwd: resolved.installDir },
    );
    if (status.stdout.trim().length > 0) {
      return 'dirty' as const;
    }
    return readIdentity(deps, 'preflight', resolved.installDir, resolved.ref);
  });
  phases.push('preflight');

  if (initial === undefined) {
    return finishPlan(deps, {
      status: 'install_required',
      ...publicResolved,
      phases,
    });
  }
  if (initial === 'dirty') {
    return finishPlan(deps, {
      status: 'blocked',
      ...publicResolved,
      block: {
        kind: 'dirty_checkout',
        message: 'The selected checkout has uncommitted or untracked changes.',
        hint: 'Commit, stash, or remove the local changes, then retry.',
      },
      phases,
    });
  }

  const remote = await runPhase(deps, 'check_remote', async () => {
    await execute(
      deps,
      'check_remote',
      'git',
      ['fetch', '--no-tags', resolved.repo, resolved.ref],
      { cwd: resolved.installDir },
    );
    const target = await readIdentity(
      deps,
      'check_remote',
      resolved.installDir,
      resolved.ref,
      'FETCH_HEAD',
    );
    const branch = await execute(
      deps,
      'check_remote',
      'git',
      ['ls-remote', '--exit-code', '--heads', resolved.repo, resolved.ref],
      { cwd: resolved.installDir, allowFailure: true },
    );
    return {
      target,
      isBranch: branch.code === 0 && branch.stdout.trim().length > 0,
    };
  });
  phases.push('check_remote');

  if (initial.commit === remote.target.commit) {
    return finishPlan(deps, {
      status: 'up_to_date',
      ...publicResolved,
      before: initial,
      target: remote.target,
      phases,
    });
  }

  if (remote.isBranch) {
    const ancestor = await execute(
      deps,
      'check_remote',
      'git',
      ['merge-base', '--is-ancestor', initial.commit, remote.target.commit],
      { cwd: resolved.installDir, allowFailure: true },
    );
    if (ancestor.code === 1) {
      return finishPlan(deps, {
        status: 'blocked',
        ...publicResolved,
        before: initial,
        target: remote.target,
        block: {
          kind: 'diverged_branch',
          message:
            'The selected checkout cannot fast-forward to the remote branch.',
          hint: 'Reconcile the local branch manually, then retry.',
        },
        phases,
      });
    }
    if (ancestor.code !== 0) {
      throw commandFailure('check_remote', ancestor);
    }
  }

  const changes = await loadChangeSummary(
    deps,
    resolved.installDir,
    initial.commit,
    remote.target.commit,
  );
  return finishPlan(deps, {
    status: 'update_available',
    ...publicResolved,
    before: initial,
    target: remote.target,
    changes,
    phases,
  });
}

async function loadChangeSummary(
  deps: SelfUpdateDeps,
  cwd: string,
  before: string,
  target: string,
): Promise<SelfUpdateChangeSummary> {
  const countResult = await execute(
    deps,
    'check_remote',
    'git',
    ['rev-list', '--count', `${before}..${target}`],
    { cwd, allowFailure: true },
  );
  const parsedCount = Number.parseInt(countResult.stdout.trim(), 10);
  const count =
    countResult.code === 0 && Number.isFinite(parsedCount) ? parsedCount : 0;
  const logResult = await execute(
    deps,
    'check_remote',
    'git',
    [
      'log',
      `--max-count=${maxChangeHighlights}`,
      '--format=%h%x09%s',
      `${before}..${target}`,
    ],
    { cwd, allowFailure: true },
  );
  const highlights =
    logResult.code === 0
      ? logResult.stdout
          .split(/\r?\n/)
          .filter(Boolean)
          .slice(0, maxChangeHighlights)
          .map((line) => {
            const [commit = '', ...subject] = line.split('\t');
            return {
              commit: commit.slice(0, 12),
              subject: boundedLine(subject.join('\t'), maxSubjectLength),
            };
          })
      : [];
  return {
    count: Math.max(count, highlights.length),
    highlights,
    omitted: Math.max(0, count - highlights.length),
  };
}

function blockedError(plan: SelfUpdatePlan): SelfUpdateError {
  return new SelfUpdateError({
    phase: 'preflight',
    summary: `Update blocked: ${plan.block?.message ?? 'The selected checkout is not safe to update.'}`,
    hint: plan.block?.hint ?? phaseHint('preflight'),
  });
}

export function assertSelfUpdatePlanReady(plan: SelfUpdatePlan): void {
  if (plan.status === 'blocked') {
    throw blockedError(plan);
  }
}

export async function runSelfUpdate(
  options: SelfUpdateOptions = {},
  deps = createSelfUpdateDeps(),
): Promise<SelfUpdateResult> {
  const resolved = resolveSelfUpdateOptions(options, deps);
  const plan = await planSelfUpdate(options, deps);
  assertSelfUpdatePlanReady(plan);
  if (plan.status === 'up_to_date') {
    return {
      status: 'up_to_date',
      repo: plan.repo,
      ref: plan.ref,
      installDir: plan.installDir,
      before: plan.before,
      target: plan.target,
      after: plan.before,
      phases: plan.phases,
      steps: [],
    };
  }

  const phases = [...plan.phases];
  const steps: SelfUpdateStep[] = [];
  const isInstall = plan.status === 'install_required';

  if (isInstall) {
    await runPhase(deps, 'clone', async () => {
      await deps.mkdir(dirname(plan.installDir));
      await execute(deps, 'clone', 'git', [
        'clone',
        resolved.repo,
        plan.installDir,
      ]);
    });
    phases.push('clone');
    steps.push('clone');
  } else {
    await runPhase(deps, 'preflight', async () => {
      const status = await execute(
        deps,
        'preflight',
        'git',
        ['status', '--porcelain', '--untracked-files=normal'],
        { cwd: plan.installDir },
      );
      if (status.stdout.trim().length > 0) {
        throw new SelfUpdateError({
          phase: 'preflight',
          summary: 'Update blocked: the checkout changed after preflight.',
          hint: 'Preserve the new local changes, then retry.',
        });
      }
    });
  }

  if (!isInstall) {
    await runPhase(deps, 'fetch', async () => {
      await execute(
        deps,
        'fetch',
        'git',
        ['remote', 'set-url', 'origin', resolved.repo],
        { cwd: plan.installDir },
      );
      await execute(deps, 'fetch', 'git', ['fetch', '--tags', 'origin'], {
        cwd: plan.installDir,
      });
    });
    phases.push('fetch');
    steps.push('fetch');
  }

  await runPhase(deps, 'checkout', async () => {
    await execute(deps, 'checkout', 'git', ['checkout', plan.ref], {
      cwd: plan.installDir,
    });
    steps.push('checkout');
    const remoteBranch = await execute(
      deps,
      'checkout',
      'git',
      ['rev-parse', '--verify', `origin/${plan.ref}`],
      { cwd: plan.installDir, allowFailure: true },
    );
    if (remoteBranch.code === 0) {
      await execute(
        deps,
        'checkout',
        'git',
        ['pull', '--ff-only', 'origin', plan.ref],
        { cwd: plan.installDir },
      );
      steps.push('pull');
    }
  });
  phases.push('checkout');

  await runPhase(deps, 'verify_bundle', async () => {
    verifyCommittedBundle(deps, plan.installDir);
  });
  phases.push('verify_bundle');
  steps.push('verify-bundle');

  await runPhase(deps, 'install_global', async () => {
    await execute(deps, 'install_global', 'npm', [
      'install',
      '-g',
      '--ignore-scripts',
      plan.installDir,
    ]);
  });
  phases.push('install_global');
  steps.push('install-global');

  const after = await readIdentity(deps, 'checkout', plan.installDir, plan.ref);
  return {
    status: isInstall ? 'installed' : 'updated',
    repo: plan.repo,
    ref: plan.ref,
    installDir: plan.installDir,
    before: plan.before,
    target: plan.target ?? after,
    after,
    changes: plan.changes,
    phases,
    steps,
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
    throw new SelfUpdateError({
      phase: 'verify_bundle',
      summary: 'The selected ref does not contain the committed CLI bundle.',
      cause: `Missing ${bundlePath}.`,
      hint: phaseHint('verify_bundle'),
    });
  }
}

function formatPhase(phase: SelfUpdatePhase): string {
  return phase.replaceAll('_', ' ');
}

function boundedLine(value: string, maxLength: number): string {
  const normalized = value.replaceAll(/\s+/g, ' ').trim();
  return normalized.length <= maxLength
    ? normalized
    : `${normalized.slice(0, maxLength - 1)}…`;
}

function boundedText(value: string): string | undefined {
  const lines = value
    .split(/\r?\n/)
    .map((line) => boundedLine(line, maxDetailLineLength))
    .filter(Boolean)
    .slice(0, maxDetailLines);
  return lines.length > 0 ? lines.join('\n') : undefined;
}

function boundedCommandOutput(
  result: SelfUpdateCommandResult,
): string | undefined {
  return boundedText(`${result.stderr}\n${result.stdout}`);
}

function redactArgs(args: readonly string[]): readonly string[] {
  return args.map(redactValue);
}

function redactValue(value: string): string {
  return value.replace(/:\/\/[^/@\s]+@/g, '://***@');
}

function runCommand(
  command: string,
  args: readonly string[],
  options: { readonly cwd?: string; readonly allowFailure?: boolean } = {},
): Promise<SelfUpdateCommandResult> {
  return new Promise((resolvePromise, reject) => {
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
      resolvePromise({
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
