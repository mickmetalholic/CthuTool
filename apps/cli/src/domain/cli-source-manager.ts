import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import {
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { createWorktreeSourceId, sameSourcePath } from './cli-source-id';
import {
  committedCliBundlePath,
  getCliRuntimeRoot,
  getDefaultSelfUpdateInstallDir,
  runSelfUpdate,
} from './self-update-manager';

const sourceRegistryVersion = 1;
const sourceSwitchWaitMs = 2_000;
const sourceSwitchPollMs = 50;
const maxCommandDetailLength = 600;

export type CliSourceKind = 'main' | 'worktree' | 'managed';
export type CliSourceMode = 'local' | 'remote';
export type CliManagedSourceState = 'ready' | 'absent' | 'invalid';
const cliManagedSourceState = Symbol('cliManagedSourceState');

export type CliSourceCandidate = {
  readonly id: string;
  readonly kind: CliSourceKind;
  readonly mode: CliSourceMode;
  readonly path: string;
  readonly active: boolean;
  readonly available: boolean;
  readonly bundlePresent: boolean;
  readonly branch?: string;
  readonly commit?: string;
  readonly detached?: boolean;
  readonly dirty?: boolean;
  readonly locked?: boolean;
  readonly prunable?: boolean;
  readonly reason?: string;
  readonly [cliManagedSourceState]?: CliManagedSourceState;
};

export type CliSourceInventory = {
  readonly active: CliSourceCandidate;
  readonly candidates: readonly CliSourceCandidate[];
  readonly warnings: readonly string[];
};

export type CliSourceSwitchStatus =
  | 'switched'
  | 'already_active'
  | 'bootstrapped';

export type CliSourceSwitchResult = {
  readonly status: CliSourceSwitchStatus;
  readonly previous: CliSourceCandidate;
  readonly selected: CliSourceCandidate;
};

export type CliSourceRegistrationResult = {
  readonly mainRoot: string;
  readonly commonDir: string;
};

export type CliSourceErrorCode =
  | 'source_invalid'
  | 'source_unavailable'
  | 'source_busy'
  | 'source_switch_failed';

export class CliSourceError extends Error {
  readonly code: CliSourceErrorCode;
  readonly hint?: string;
  readonly causeText?: string;

  constructor(options: {
    readonly code: CliSourceErrorCode;
    readonly message: string;
    readonly hint?: string;
    readonly cause?: string;
  }) {
    const causeText = options.cause
      ? boundedCommandDetail(options.cause)
      : undefined;
    super(
      [
        options.message,
        causeText ? `Cause: ${causeText}` : undefined,
        options.hint ? `Next: ${options.hint}` : undefined,
      ]
        .filter(Boolean)
        .join('\n'),
    );
    this.name = 'CliSourceError';
    this.code = options.code;
    this.hint = options.hint;
    this.causeText = causeText;
  }
}

export type CliSourceCommandResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

export type CliSourceManagerDeps = {
  readonly home: () => string;
  readonly cwd: () => string;
  readonly runtimeRoot: () => string;
  readonly now: () => number;
  readonly sleep: (milliseconds: number) => Promise<void>;
  readonly runGit: (
    cwd: string,
    args: readonly string[],
  ) => Promise<CliSourceCommandResult>;
  readonly relinkGlobal: (target: string) => Promise<void>;
  readonly resolveGlobalPackageTarget: () => Promise<string | undefined>;
  readonly bootstrapManaged: (target: string) => Promise<void>;
};

type SourceRegistry = {
  readonly version: typeof sourceRegistryVersion;
  readonly mainRoot: string;
  readonly commonDir: string;
};

type GitWorktreeRecord = {
  readonly path: string;
  readonly head?: string;
  readonly branch?: string;
  readonly detached: boolean;
  readonly locked: boolean;
  readonly prunable: boolean;
};

type DevelopmentCheckout = {
  readonly root: string;
  readonly mainRoot: string;
  readonly commonDir: string;
  readonly worktrees: readonly GitWorktreeRecord[];
};

type RegistryReadResult = {
  readonly registry?: SourceRegistry;
  readonly warning?: string;
};

const defaultDeps: CliSourceManagerDeps = {
  home: homedir,
  cwd: () => process.cwd(),
  runtimeRoot: getCliRuntimeRoot,
  now: Date.now,
  sleep: (milliseconds) =>
    new Promise((resolvePromise) => {
      setTimeout(resolvePromise, milliseconds);
    }),
  runGit: (cwd, args) => runProcess('git', ['-C', cwd, ...args]),
  async relinkGlobal(target) {
    const result = await runProcess('npm', [
      'install',
      '-g',
      '--ignore-scripts',
      target,
    ]);
    if (result.code !== 0) {
      throw new CliSourceError({
        code: 'source_switch_failed',
        message: `Failed to relink the global chc command to ${target}.`,
        cause: result.stderr || result.stdout,
        hint: remoteInstallerRecoveryHint(),
      });
    }
  },
  async resolveGlobalPackageTarget() {
    const result = await runProcess('npm', ['root', '-g']);
    if (result.code !== 0 || result.stdout.trim().length === 0) {
      return undefined;
    }
    const packagePath = join(result.stdout.trim(), 'cthutool');
    if (!existsSync(packagePath)) {
      return undefined;
    }
    return realpath(packagePath);
  },
  async bootstrapManaged(target) {
    await runSelfUpdate({ installDir: target });
  },
};

export function createCliSourceManagerDeps(
  overrides: Partial<CliSourceManagerDeps> = {},
): CliSourceManagerDeps {
  return { ...defaultDeps, ...overrides };
}

export function getCliSourceRegistryPath(home = homedir()): string {
  return join(home, '.cthutool', 'cli', 'source-registry.json');
}

export function getCliSourceSwitchLockPath(home = homedir()): string {
  return join(home, '.cthutool', 'locks', 'cli-source-switch.lock');
}

export function parseGitWorktreeList(
  value: string,
): readonly GitWorktreeRecord[] {
  const records: GitWorktreeRecord[] = [];
  let current: {
    path?: string;
    head?: string;
    branch?: string;
    detached: boolean;
    locked: boolean;
    prunable: boolean;
  } | null = null;

  const finish = () => {
    if (current?.path) {
      records.push({
        path: current.path,
        head: current.head,
        branch: current.branch,
        detached: current.detached,
        locked: current.locked,
        prunable: current.prunable,
      });
    }
    current = null;
  };

  for (const line of `${value}\n`.split(/\r?\n/)) {
    if (line.length === 0) {
      finish();
      continue;
    }
    const separator = line.indexOf(' ');
    const key = separator === -1 ? line : line.slice(0, separator);
    const detail = separator === -1 ? '' : line.slice(separator + 1);
    if (key === 'worktree') {
      finish();
      current = {
        path: detail,
        detached: false,
        locked: false,
        prunable: false,
      };
      continue;
    }
    if (!current) continue;
    if (key === 'HEAD') current.head = detail;
    if (key === 'branch') current.branch = detail.replace(/^refs\/heads\//, '');
    if (key === 'detached') current.detached = true;
    if (key === 'locked') current.locked = true;
    if (key === 'prunable') current.prunable = true;
  }

  return records;
}

export async function discoverCliSources(
  deps = createCliSourceManagerDeps(),
): Promise<CliSourceInventory> {
  const runtimeRoot = await canonicalExistingPath(deps.runtimeRoot());
  const managedRoot = await canonicalPath(
    getDefaultSelfUpdateInstallDir(deps.home()),
  );
  const warnings: string[] = [];
  const candidates: CliSourceCandidate[] = [];
  const registryResult = await readSourceRegistry(deps.home());
  if (registryResult.warning) warnings.push(registryResult.warning);

  let development: DevelopmentCheckout | undefined;
  if (!sameSourcePath(runtimeRoot, managedRoot)) {
    development = await tryResolveDevelopmentCheckout(runtimeRoot, deps);
  }
  if (!development) {
    const cwdCheckout = await tryResolveDevelopmentCheckout(deps.cwd(), deps);
    if (cwdCheckout && !sameSourcePath(cwdCheckout.mainRoot, managedRoot)) {
      development = cwdCheckout;
    }
  }
  if (!development && registryResult.registry) {
    const registered = await tryResolveDevelopmentCheckout(
      registryResult.registry.mainRoot,
      deps,
    );
    if (
      registered &&
      sameSourcePath(registered.commonDir, registryResult.registry.commonDir)
    ) {
      development = registered;
    } else {
      candidates.push(
        unavailableCandidate({
          id: 'local',
          kind: 'main',
          path: registryResult.registry.mainRoot,
          active: sameSourcePath(runtimeRoot, registryResult.registry.mainRoot),
          reason:
            'The registered development checkout is missing or no longer matches its Git identity.',
        }),
      );
      warnings.push(
        'Registered development checkout is unavailable; run `chc source register <path>` from a valid CthuTool checkout.',
      );
    }
  }

  if (development) {
    for (const [index, record] of development.worktrees.entries()) {
      candidates.push(
        await inspectWorktreeCandidate(
          record,
          index === 0 ? 'main' : 'worktree',
          development.mainRoot,
          runtimeRoot,
          deps,
        ),
      );
    }
  } else if (!sameSourcePath(runtimeRoot, managedRoot)) {
    candidates.push(await inspectFallbackRuntimeCandidate(runtimeRoot, deps));
  }

  const managed = await inspectManagedCandidate(managedRoot, runtimeRoot, deps);
  candidates.push(managed);

  const deduplicated = deduplicateCandidates(candidates);
  const active = deduplicated.find((candidate) => candidate.active);
  if (!active) {
    const fallback = unavailableCandidate({
      id: 'current',
      kind: sameSourcePath(runtimeRoot, managedRoot) ? 'managed' : 'main',
      path: runtimeRoot,
      active: true,
      reason: 'The running source could not be classified as a valid checkout.',
    });
    return {
      active: fallback,
      candidates: [fallback, ...deduplicated],
      warnings,
    };
  }

  return { active, candidates: deduplicated, warnings };
}

export async function registerCliSource(
  path: string,
  deps = createCliSourceManagerDeps(),
): Promise<CliSourceRegistrationResult> {
  const checkout = await resolveDevelopmentCheckout(path, deps);
  const managedRoot = await canonicalPath(
    getDefaultSelfUpdateInstallDir(deps.home()),
  );
  if (sameSourcePath(checkout.mainRoot, managedRoot)) {
    throw new CliSourceError({
      code: 'source_invalid',
      message:
        'The managed checkout cannot be registered as the local development source.',
      hint: 'Register a separate development clone or one of its linked worktrees.',
    });
  }
  const registry = {
    version: sourceRegistryVersion,
    mainRoot: checkout.mainRoot,
    commonDir: checkout.commonDir,
  } satisfies SourceRegistry;
  await writeSourceRegistry(registry, deps.home());
  return {
    mainRoot: registry.mainRoot,
    commonDir: registry.commonDir,
  };
}

export async function switchCliSource(
  selector: string,
  deps = createCliSourceManagerDeps(),
): Promise<CliSourceSwitchResult> {
  const inventory = await discoverCliSources(deps);
  const selected = await resolveCliSourceSelector(selector, inventory, deps);
  const previous = inventory.active;

  if (
    selected.kind === 'managed' &&
    getCliManagedSourceState(selected) === 'absent'
  ) {
    await rememberDevelopmentSource(previous, deps);
    return withSourceSwitchLock(deps, async () => {
      try {
        await deps.bootstrapManaged(selected.path);
      } catch (error) {
        throw toSwitchError(
          error,
          `Failed to bootstrap the managed source at ${selected.path}.`,
        );
      }
      const refreshed = await inspectManagedCandidate(
        selected.path,
        selected.path,
        deps,
      );
      assertAvailableSource(refreshed);
      await assertGlobalTarget(refreshed.path, deps);
      return {
        status: 'bootstrapped',
        previous,
        selected: { ...refreshed, active: true },
      };
    });
  }

  assertAvailableSource(selected);
  if (selected.kind === 'managed') {
    await rememberDevelopmentSource(previous, deps);
  }

  if (sameSourcePath(selected.path, previous.path)) {
    if (selected.kind !== 'managed') {
      await registerCliSource(selected.path, deps);
    }
    return {
      status: 'already_active',
      previous,
      selected: { ...selected, active: true },
    };
  }

  return withSourceSwitchLock(deps, async () => {
    if (selected.kind !== 'managed') {
      await registerCliSource(selected.path, deps);
    }
    try {
      await deps.relinkGlobal(selected.path);
      await assertGlobalTarget(selected.path, deps);
    } catch (error) {
      throw toSwitchError(
        error,
        `Failed to switch chc from ${previous.path} to ${selected.path}.`,
      );
    }
    return {
      status: 'switched',
      previous,
      selected: { ...selected, active: true },
    };
  });
}

export async function getCliSourceSelectorCandidates(
  deps = createCliSourceManagerDeps(),
): Promise<readonly string[]> {
  try {
    const inventory = await discoverCliSources(deps);
    return [
      '.',
      'local',
      'remote',
      ...inventory.candidates
        .filter(
          (candidate) => candidate.kind === 'worktree' && candidate.available,
        )
        .map((candidate) => candidate.id),
    ];
  } catch {
    return ['.', 'local', 'remote'];
  }
}

async function resolveCliSourceSelector(
  rawSelector: string,
  inventory: CliSourceInventory,
  deps: CliSourceManagerDeps,
): Promise<CliSourceCandidate> {
  const selector = rawSelector.trim();
  if (!selector) {
    throw new CliSourceError({
      code: 'source_invalid',
      message: 'A source selector is required.',
    });
  }
  if (selector === 'remote') {
    return requiredCandidate(
      inventory.candidates.find((candidate) => candidate.kind === 'managed'),
      selector,
    );
  }
  if (selector === 'local') {
    return requiredCandidate(
      inventory.candidates.find((candidate) => candidate.kind === 'main'),
      selector,
    );
  }
  if (selector === '.') {
    return candidateFromExplicitPath(deps.cwd(), inventory.active.path, deps);
  }
  const discovered = inventory.candidates.find(
    (candidate) => candidate.id === selector,
  );
  if (discovered) return discovered;

  const explicitPath = resolve(deps.cwd(), selector);
  if (existsSync(explicitPath) || isAbsolute(selector)) {
    return candidateFromExplicitPath(explicitPath, inventory.active.path, deps);
  }
  throw new CliSourceError({
    code: 'source_unavailable',
    message: `Unknown source selector: ${selector}`,
    hint: 'Run `chc source list` to inspect available selectors.',
  });
}

async function candidateFromExplicitPath(
  path: string,
  runtimeRoot: string,
  deps: CliSourceManagerDeps,
): Promise<CliSourceCandidate> {
  const managedRoot = await canonicalPath(
    getDefaultSelfUpdateInstallDir(deps.home()),
  );
  const checkout = await resolveDevelopmentCheckout(path, deps);
  const record = checkout.worktrees.find((item) =>
    sameSourcePath(item.path, checkout.root),
  );
  if (!record) {
    throw new CliSourceError({
      code: 'source_invalid',
      message: `Git did not report the selected checkout at ${checkout.root}.`,
    });
  }
  if (sameSourcePath(checkout.root, managedRoot)) {
    return inspectManagedCandidate(managedRoot, runtimeRoot, deps);
  }
  return inspectWorktreeCandidate(
    record,
    sameSourcePath(checkout.root, checkout.mainRoot) ? 'main' : 'worktree',
    checkout.mainRoot,
    runtimeRoot,
    deps,
  );
}

async function resolveDevelopmentCheckout(
  path: string,
  deps: CliSourceManagerDeps,
): Promise<DevelopmentCheckout> {
  const requested = resolve(path);
  const rootResult = await deps.runGit(requested, [
    'rev-parse',
    '--show-toplevel',
  ]);
  if (rootResult.code !== 0 || rootResult.stdout.trim().length === 0) {
    throw new CliSourceError({
      code: 'source_invalid',
      message: `The selected path is not a Git checkout: ${requested}`,
      cause: rootResult.stderr,
    });
  }
  const root = await canonicalExistingPath(rootResult.stdout.trim());
  assertCthuToolPackage(root);

  const commonResult = await deps.runGit(root, [
    'rev-parse',
    '--git-common-dir',
  ]);
  if (commonResult.code !== 0 || commonResult.stdout.trim().length === 0) {
    throw new CliSourceError({
      code: 'source_invalid',
      message: `Unable to resolve the Git common directory for ${root}.`,
      cause: commonResult.stderr,
    });
  }
  const rawCommonDir = commonResult.stdout.trim();
  const commonDir = await canonicalExistingPath(
    isAbsolute(rawCommonDir) ? rawCommonDir : resolve(root, rawCommonDir),
  );

  const listResult = await deps.runGit(root, [
    'worktree',
    'list',
    '--porcelain',
  ]);
  if (listResult.code !== 0) {
    throw new CliSourceError({
      code: 'source_invalid',
      message: `Unable to enumerate Git worktrees for ${root}.`,
      cause: listResult.stderr,
    });
  }
  const parsed = parseGitWorktreeList(listResult.stdout);
  if (parsed.length === 0) {
    throw new CliSourceError({
      code: 'source_invalid',
      message: `Git reported no worktrees for ${root}.`,
    });
  }
  const worktrees = await Promise.all(
    parsed.map(async (record) => ({
      ...record,
      path: existsSync(record.path)
        ? await canonicalExistingPath(record.path)
        : resolve(record.path),
    })),
  );
  const mainRoot = worktrees[0]?.path;
  if (!mainRoot) {
    throw new CliSourceError({
      code: 'source_invalid',
      message: `Unable to identify the main worktree for ${root}.`,
    });
  }
  return { root, mainRoot, commonDir, worktrees };
}

async function tryResolveDevelopmentCheckout(
  path: string,
  deps: CliSourceManagerDeps,
): Promise<DevelopmentCheckout | undefined> {
  try {
    return await resolveDevelopmentCheckout(path, deps);
  } catch {
    return undefined;
  }
}

async function inspectWorktreeCandidate(
  record: GitWorktreeRecord,
  kind: 'main' | 'worktree',
  mainRoot: string,
  runtimeRoot: string,
  deps: CliSourceManagerDeps,
): Promise<CliSourceCandidate> {
  const path = record.path;
  const active = sameSourcePath(path, runtimeRoot);
  const bundlePresent = existsSync(join(path, committedCliBundlePath));
  const packageValid = isCthuToolPackage(path);
  const exists = existsSync(path);
  const available = exists && packageValid && bundlePresent && !record.prunable;
  let dirty: boolean | undefined;
  if (exists && packageValid) {
    const status = await deps.runGit(path, [
      'status',
      '--porcelain',
      '--untracked-files=normal',
    ]);
    if (status.code === 0) dirty = status.stdout.trim().length > 0;
  }
  return {
    id: kind === 'main' ? 'local' : createWorktreeSourceId(path),
    kind,
    mode: 'local',
    path,
    active,
    available,
    bundlePresent,
    branch: record.branch,
    commit: record.head,
    detached: record.detached,
    dirty,
    locked: record.locked,
    prunable: record.prunable,
    reason: available
      ? undefined
      : sourceUnavailableReason({
          exists,
          packageValid,
          bundlePresent,
          prunable: record.prunable,
          mainRoot,
        }),
  };
}

async function inspectManagedCandidate(
  path: string,
  runtimeRoot: string,
  deps: CliSourceManagerDeps,
): Promise<CliSourceCandidate> {
  const active = sameSourcePath(path, runtimeRoot);
  const bundlePresent = existsSync(join(path, committedCliBundlePath));
  if (!existsSync(path)) {
    return unavailableCandidate({
      id: 'remote',
      kind: 'managed',
      path,
      active,
      reason: 'The managed source checkout does not exist.',
      managedState: 'absent',
    });
  }
  const checkout = await tryResolveDevelopmentCheckout(path, deps);
  if (!checkout) {
    return unavailableCandidate({
      id: 'remote',
      kind: 'managed',
      path,
      active,
      bundlePresent,
      reason: 'The managed source path is not a valid CthuTool Git checkout.',
      managedState: 'invalid',
    });
  }
  const record = checkout.worktrees.find((item) =>
    sameSourcePath(item.path, checkout.root),
  );
  let dirty: boolean | undefined;
  const status = await deps.runGit(path, [
    'status',
    '--porcelain',
    '--untracked-files=normal',
  ]);
  if (status.code === 0) dirty = status.stdout.trim().length > 0;
  return {
    id: 'remote',
    kind: 'managed',
    mode: 'remote',
    path,
    active,
    available: bundlePresent,
    bundlePresent,
    branch: record?.branch,
    commit: record?.head,
    detached: record?.detached,
    dirty,
    locked: record?.locked,
    prunable: record?.prunable,
    [cliManagedSourceState]: bundlePresent ? 'ready' : 'invalid',
    reason: bundlePresent
      ? undefined
      : `Missing committed CLI bundle: ${join(path, committedCliBundlePath)}`,
  };
}

async function inspectFallbackRuntimeCandidate(
  path: string,
  deps: CliSourceManagerDeps,
): Promise<CliSourceCandidate> {
  const bundlePresent = existsSync(join(path, committedCliBundlePath));
  const status = await deps.runGit(path, [
    'status',
    '--porcelain',
    '--untracked-files=normal',
  ]);
  return {
    id: 'local',
    kind: 'main',
    mode: 'local',
    path,
    active: true,
    available: isCthuToolPackage(path) && bundlePresent,
    bundlePresent,
    dirty: status.code === 0 ? status.stdout.trim().length > 0 : undefined,
    reason: bundlePresent
      ? 'The running source is not part of a discoverable Git worktree topology.'
      : `Missing committed CLI bundle: ${join(path, committedCliBundlePath)}`,
  };
}

function unavailableCandidate(input: {
  readonly id: string;
  readonly kind: CliSourceKind;
  readonly path: string;
  readonly active: boolean;
  readonly reason: string;
  readonly bundlePresent?: boolean;
  readonly managedState?: CliManagedSourceState;
}): CliSourceCandidate {
  return {
    id: input.id,
    kind: input.kind,
    mode: input.kind === 'managed' ? 'remote' : 'local',
    path: input.path,
    active: input.active,
    available: false,
    bundlePresent: input.bundlePresent ?? false,
    reason: input.reason,
    [cliManagedSourceState]: input.managedState,
  };
}

export function getCliManagedSourceState(
  candidate: CliSourceCandidate,
): CliManagedSourceState | undefined {
  if (candidate.kind !== 'managed') return undefined;
  return (
    candidate[cliManagedSourceState] ??
    (candidate.available ? 'ready' : 'invalid')
  );
}

function sourceUnavailableReason(input: {
  readonly exists: boolean;
  readonly packageValid: boolean;
  readonly bundlePresent: boolean;
  readonly prunable: boolean;
  readonly mainRoot: string;
}): string {
  if (!input.exists || input.prunable)
    return 'The worktree path is unavailable.';
  if (!input.packageValid)
    return `The worktree does not contain the expected CthuTool root package from ${input.mainRoot}.`;
  if (!input.bundlePresent)
    return `Missing committed CLI bundle: ${committedCliBundlePath}`;
  return 'The source is unavailable.';
}

function requiredCandidate(
  candidate: CliSourceCandidate | undefined,
  selector: string,
): CliSourceCandidate {
  if (candidate) return candidate;
  throw new CliSourceError({
    code: 'source_unavailable',
    message: `Source selector is unavailable: ${selector}`,
    hint: 'Run `chc source list` or register a development checkout.',
  });
}

function assertAvailableSource(candidate: CliSourceCandidate): void {
  if (candidate.available) return;
  const hint =
    candidate.kind === 'managed'
      ? 'Repair or move the existing managed path, then retry; use `chc source update` only for a valid checkout.'
      : 'Refresh apps/cli/dist/index.js or select another checkout.';
  throw new CliSourceError({
    code: 'source_unavailable',
    message: `Source is unavailable: ${candidate.path}`,
    cause: candidate.reason,
    hint,
  });
}

async function rememberDevelopmentSource(
  candidate: CliSourceCandidate,
  deps: CliSourceManagerDeps,
): Promise<void> {
  if (candidate.kind === 'managed') return;
  await registerCliSource(candidate.path, deps);
}

async function assertGlobalTarget(
  target: string,
  deps: CliSourceManagerDeps,
): Promise<void> {
  const installed = await deps.resolveGlobalPackageTarget();
  if (installed && sameSourcePath(installed, target)) return;
  throw new CliSourceError({
    code: 'source_switch_failed',
    message:
      'The global cthutool package did not resolve to the selected source.',
    cause: `Expected ${target}; found ${installed ?? 'unavailable'}.`,
    hint: remoteInstallerRecoveryHint(),
  });
}

async function withSourceSwitchLock<T>(
  deps: CliSourceManagerDeps,
  run: () => Promise<T>,
): Promise<T> {
  const lockPath = getCliSourceSwitchLockPath(deps.home());
  await mkdir(dirname(lockPath), { mode: 0o700, recursive: true });
  const deadline = deps.now() + sourceSwitchWaitMs;
  while (true) {
    try {
      await mkdir(lockPath, { mode: 0o700 });
      break;
    } catch (error) {
      if (!isNodeError(error, 'EEXIST')) throw error;
      if (deps.now() >= deadline) {
        throw new CliSourceError({
          code: 'source_busy',
          message: 'Another chc source switch is in progress.',
          hint: `Wait for it to finish, then retry. Lock: ${lockPath}`,
        });
      }
      await deps.sleep(sourceSwitchPollMs);
    }
  }
  try {
    return await run();
  } finally {
    await rm(lockPath, { force: true, recursive: true });
  }
}

async function readSourceRegistry(home: string): Promise<RegistryReadResult> {
  const path = getCliSourceRegistryPath(home);
  if (!existsSync(path)) return {};
  try {
    const value = JSON.parse(await readFile(path, 'utf8')) as {
      version?: unknown;
      mainRoot?: unknown;
      commonDir?: unknown;
    };
    if (
      value.version !== sourceRegistryVersion ||
      typeof value.mainRoot !== 'string' ||
      !isAbsolute(value.mainRoot) ||
      typeof value.commonDir !== 'string' ||
      !isAbsolute(value.commonDir)
    ) {
      throw new Error('unsupported or invalid registry fields');
    }
    return {
      registry: {
        version: sourceRegistryVersion,
        mainRoot: value.mainRoot,
        commonDir: value.commonDir,
      },
    };
  } catch (error) {
    return {
      warning: `Unable to read ${path}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function writeSourceRegistry(
  registry: SourceRegistry,
  home: string,
): Promise<void> {
  const path = getCliSourceRegistryPath(home);
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await mkdir(dirname(path), { mode: 0o700, recursive: true });
  try {
    await writeFile(temporary, `${JSON.stringify(registry, null, 2)}\n`, {
      mode: 0o600,
    });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

function assertCthuToolPackage(path: string): void {
  if (isCthuToolPackage(path)) return;
  throw new CliSourceError({
    code: 'source_invalid',
    message: `The selected checkout is not a CthuTool root package: ${path}`,
  });
}

function isCthuToolPackage(path: string): boolean {
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

async function canonicalExistingPath(path: string): Promise<string> {
  return realpath(resolve(path));
}

async function canonicalPath(path: string): Promise<string> {
  return existsSync(path) ? canonicalExistingPath(path) : resolve(path);
}

function deduplicateCandidates(
  candidates: readonly CliSourceCandidate[],
): CliSourceCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.kind}:${candidate.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isNodeError(error: unknown, code: string): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === code
  );
}

function toSwitchError(error: unknown, message: string): CliSourceError {
  if (error instanceof CliSourceError) return error;
  return new CliSourceError({
    code: 'source_switch_failed',
    message,
    cause: error instanceof Error ? error.message : String(error),
    hint: remoteInstallerRecoveryHint(),
  });
}

function boundedCommandDetail(value: string): string {
  const normalized = value.replaceAll(/\s+/g, ' ').trim();
  return normalized.length <= maxCommandDetailLength
    ? normalized
    : `${normalized.slice(0, maxCommandDetailLength - 1)}…`;
}

function remoteInstallerRecoveryHint(): string {
  return 'Use the public Bash or PowerShell remote installer to restore chc if the global command is unavailable.';
}

function runProcess(
  command: string,
  args: readonly string[],
): Promise<CliSourceCommandResult> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, [...args], {
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
    child.on('error', reject);
    child.on('close', (code) => {
      resolvePromise({ code: code ?? 1, stdout, stderr });
    });
  });
}
