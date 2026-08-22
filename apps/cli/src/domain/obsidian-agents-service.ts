import { mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ObsidianAgentsDataPaths } from '../infra/obsidian-agents-paths';
import {
  createEmptyObsidianAgentsConfig,
  normalizeObsidianAgentsProfile,
  type ObsidianAgentsProfile,
  type ObsidianAgentsProfileInput,
  readObsidianAgentsConfig,
  selectObsidianAgentsProfile,
  upsertObsidianAgentsProfile,
  writeObsidianAgentsConfig,
} from './obsidian-agents-config';
import {
  cloneGitRepository,
  commitAll,
  configureGitRemote,
  fetchGitRemote,
  type GitSnapshot,
  initializeGitRepository,
  mergeFastForward,
  ObsidianAgentsGitError,
  pushGitBranch,
  readGitSnapshot,
  remoteBranchExists,
} from './obsidian-agents-git';
import {
  ObsidianAgentsLockError,
  withObsidianAgentsLock,
} from './obsidian-agents-lock';

export type ObsidianAgentsErrorCode =
  | 'not_configured'
  | 'invalid_configuration'
  | 'setup_required'
  | 'conflict'
  | 'sync_failed';

export class ObsidianAgentsServiceError extends Error {
  readonly code: ObsidianAgentsErrorCode;
  readonly exitCode = 1;

  constructor(
    code: ObsidianAgentsErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ObsidianAgentsServiceError';
    this.code = code;
  }
}

export type ObsidianAgentsSetupInput = ObsidianAgentsProfileInput & {
  readonly remote?: string;
  readonly branch?: string;
};

export type ObsidianAgentsSetupPlan = {
  readonly profile: ObsidianAgentsProfile;
  readonly remote: string;
  readonly branch: string;
  readonly agentsExists: boolean;
  readonly agentsEmpty: boolean;
  readonly initialFiles: readonly string[];
  readonly snapshot: GitSnapshot;
  readonly actions: readonly string[];
};

export type ObsidianAgentsSetupResult = {
  readonly profile: ObsidianAgentsProfile;
  readonly remote: string;
  readonly branch: string;
  readonly actions: readonly string[];
  readonly initialCommit?: string;
};

export type ObsidianAgentsPhase = 'before' | 'after';

export type ObsidianAgentsSyncResult = {
  readonly phase: ObsidianAgentsPhase;
  readonly changed: boolean;
  readonly committed: boolean;
  readonly pushed: boolean;
  readonly branch: string;
  readonly commit?: string;
  readonly ahead?: number;
  readonly behind?: number;
};

export type ObsidianAgentsHookReadiness = {
  readonly source: boolean;
  readonly installed: boolean;
  readonly ready: boolean;
};

export type ObsidianAgentsStatus = {
  readonly configured: boolean;
  readonly healthy: boolean;
  readonly profile?: ObsidianAgentsProfile;
  readonly paths: {
    readonly vaultExists: boolean;
    readonly agentsExists: boolean;
  };
  readonly git: {
    readonly isRepository: boolean;
    readonly branch?: string;
    readonly head?: string;
    readonly remote?: string;
    readonly worktreeChanges: readonly string[];
    readonly ahead?: number;
    readonly behind?: number;
    readonly comparisonAvailable: boolean;
  };
  readonly sync: {
    readonly state:
      | 'not_configured'
      | 'missing_path'
      | 'not_repository'
      | 'no_remote'
      | 'dirty'
      | 'ahead'
      | 'behind'
      | 'diverged'
      | 'up_to_date'
      | 'unavailable';
    readonly refreshed: boolean;
    readonly refreshError?: string;
  };
  readonly hook: ObsidianAgentsHookReadiness;
};

export async function createObsidianAgentsSetupPlan(
  _paths: ObsidianAgentsDataPaths,
  input: ObsidianAgentsSetupInput,
): Promise<ObsidianAgentsSetupPlan> {
  const profile = normalizeObsidianAgentsProfile(input);
  if (!(await isDirectory(profile.vaultPath))) {
    throw new ObsidianAgentsServiceError(
      'invalid_configuration',
      `Obsidian vault does not exist or is not a directory: ${profile.vaultPath}`,
    );
  }

  const agentsPathExists = await pathExists(profile.agentsPath);
  if (agentsPathExists && !(await isDirectory(profile.agentsPath))) {
    throw new ObsidianAgentsServiceError(
      'invalid_configuration',
      `The configured agents path is not a directory: ${profile.agentsPath}`,
    );
  }
  const agentsExists = agentsPathExists;
  const agentsEmpty = agentsExists
    ? (await readdir(profile.agentsPath)).length === 0
    : true;
  const initialFiles =
    agentsExists && agentsEmpty === false
      ? await listRelativeFiles(profile.agentsPath)
      : [];
  const snapshot = agentsExists
    ? await readGitSnapshot(profile.agentsPath)
    : emptyGitSnapshot();
  const remote = input.remote?.trim() || snapshot.remote;
  if (!remote) {
    throw new ObsidianAgentsServiceError(
      'setup_required',
      'A private Git remote is required. Re-run setup with a remote URL or configure origin in the .agents repository.',
    );
  }
  const branch = snapshot.branch || input.branch?.trim() || 'main';
  assertBranchName(branch);

  const actions: string[] = [];
  const shouldClone = !snapshot.isRepository && agentsEmpty;
  if (shouldClone) {
    actions.push(`clone ${redactRemote(remote)} into ${profile.agentsPath}`);
  } else if (!snapshot.isRepository) {
    actions.push(`initialize Git in ${profile.agentsPath}`);
  }
  if (snapshot.isRepository && snapshot.remote !== remote) {
    actions.push(`set origin to ${redactRemote(remote)}`);
  }
  if (!snapshot.hasHead && !shouldClone && !agentsEmpty) {
    actions.push('create the initial commit and push it to origin');
  }
  if (actions.length === 0) actions.push('validate the existing repository');

  return {
    profile,
    remote,
    branch,
    agentsExists,
    agentsEmpty,
    initialFiles,
    snapshot,
    actions,
  };
}

export async function applyObsidianAgentsSetup(
  paths: ObsidianAgentsDataPaths,
  plan: ObsidianAgentsSetupPlan,
): Promise<ObsidianAgentsSetupResult> {
  let initialCommit: string | undefined;
  const shouldClone = !plan.snapshot.isRepository && plan.agentsEmpty;
  if (shouldClone) {
    await mkdir(dirname(plan.profile.agentsPath), { recursive: true });
    await cloneGitRepository(
      plan.remote,
      plan.profile.agentsPath,
      dirname(plan.profile.agentsPath),
    );
  } else {
    await mkdir(plan.profile.agentsPath, { recursive: true });
    if (!plan.snapshot.isRepository) {
      await initializeGitRepository(plan.profile.agentsPath, plan.branch);
    }
    await configureGitRemote(plan.profile.agentsPath, plan.remote);

    if (!plan.snapshot.hasHead && !plan.agentsEmpty) {
      const commit = await commitAll(
        plan.profile.agentsPath,
        'chc: initialize Obsidian agents',
      );
      if (commit.commit) {
        initialCommit = commit.commit;
        await pushGitBranch(plan.profile.agentsPath, plan.branch);
      }
    }
  }

  const existing =
    (await readObsidianAgentsConfig(paths)) ??
    createEmptyObsidianAgentsConfig();
  const next = upsertObsidianAgentsProfile(existing, plan.profile);
  await writeObsidianAgentsConfig(paths, next);

  const snapshot = await readGitSnapshot(plan.profile.agentsPath);
  return {
    profile: plan.profile,
    remote: snapshot.remote ?? plan.remote,
    branch: snapshot.branch ?? plan.branch,
    actions: plan.actions,
    initialCommit,
  };
}

export async function getObsidianAgentsProfile(
  paths: ObsidianAgentsDataPaths,
  profileId?: string,
): Promise<ObsidianAgentsProfile> {
  const config = await readObsidianAgentsConfig(paths);
  if (!config) {
    throw new ObsidianAgentsServiceError(
      'not_configured',
      'Obsidian agents is not configured. Run `chc obsidian agents setup` first.',
    );
  }
  const profile = selectObsidianAgentsProfile(config, profileId);
  if (!profile) {
    throw new ObsidianAgentsServiceError(
      'not_configured',
      'No Obsidian agents profile is configured. Run `chc obsidian agents setup` first.',
    );
  }
  return profile;
}

export async function synchronizeObsidianAgents(options: {
  readonly paths: ObsidianAgentsDataPaths;
  readonly profile: ObsidianAgentsProfile;
  readonly phase: ObsidianAgentsPhase;
}): Promise<ObsidianAgentsSyncResult> {
  return withObsidianAgentsLock(options.paths, options.profile.id, async () => {
    const initial = await readGitSnapshot(options.profile.agentsPath);
    assertSyncRepository(initial, options.profile);

    if (options.phase === 'after') {
      return finalizeAfterPhase(options.profile, initial);
    }
    return prepareBeforePhase(options.profile, initial);
  }).catch((error) => {
    if (error instanceof ObsidianAgentsLockError) throw error;
    if (error instanceof ObsidianAgentsServiceError) throw error;
    throw new ObsidianAgentsServiceError(
      classifySyncError(error),
      `Obsidian agents before/after synchronization failed for ${options.profile.agentsPath}: ${safeErrorMessage(error)}`,
      { cause: error },
    );
  });
}

export async function inspectObsidianAgentsStatus(options: {
  readonly paths: ObsidianAgentsDataPaths;
  readonly profileId?: string;
  readonly refresh?: boolean;
  readonly hook?: ObsidianAgentsHookReadiness;
}): Promise<ObsidianAgentsStatus> {
  const hook = options.hook ?? {
    source: false,
    installed: false,
    ready: false,
  };
  const config = await readObsidianAgentsConfig(options.paths);
  if (!config) {
    return {
      configured: false,
      healthy: false,
      paths: { vaultExists: false, agentsExists: false },
      git: {
        isRepository: false,
        worktreeChanges: [],
        comparisonAvailable: false,
      },
      sync: { state: 'not_configured', refreshed: false },
      hook,
    };
  }

  const profile = selectObsidianAgentsProfile(config, options.profileId);
  if (!profile) {
    return {
      configured: false,
      healthy: false,
      paths: { vaultExists: false, agentsExists: false },
      git: {
        isRepository: false,
        worktreeChanges: [],
        comparisonAvailable: false,
      },
      sync: { state: 'not_configured', refreshed: false },
      hook,
    };
  }

  const vaultExists = await isDirectory(profile.vaultPath);
  const agentsExists = await isDirectory(profile.agentsPath);
  if (!agentsExists) {
    return {
      configured: true,
      healthy: false,
      profile,
      paths: { vaultExists, agentsExists },
      git: {
        isRepository: false,
        worktreeChanges: [],
        comparisonAvailable: false,
      },
      sync: { state: 'missing_path', refreshed: false },
      hook,
    };
  }

  let refreshed = false;
  let refreshError: string | undefined;
  if (options.refresh) {
    try {
      await withObsidianAgentsLock(options.paths, profile.id, async () => {
        const snapshot = await readGitSnapshot(profile.agentsPath);
        if (snapshot.isRepository && snapshot.remote) {
          await fetchGitRemote(profile.agentsPath);
        }
      });
      refreshed = true;
    } catch (error) {
      refreshError = safeErrorMessage(error);
    }
  }

  const snapshot = await readGitSnapshot(profile.agentsPath);
  const syncState = resolveSyncState(snapshot);
  const healthy =
    vaultExists &&
    agentsExists &&
    snapshot.isRepository &&
    snapshot.remote !== undefined &&
    snapshot.worktree.length === 0 &&
    syncState === 'up_to_date' &&
    hook.ready;
  return {
    configured: true,
    healthy,
    profile,
    paths: { vaultExists, agentsExists },
    git: {
      isRepository: snapshot.isRepository,
      branch: snapshot.branch,
      head: snapshot.head,
      remote: redactRemote(snapshot.remote),
      worktreeChanges: snapshot.worktree,
      ahead: snapshot.ahead,
      behind: snapshot.behind,
      comparisonAvailable: snapshot.comparisonAvailable,
    },
    sync: {
      state: refreshError ? 'unavailable' : syncState,
      refreshed,
      ...(refreshError ? { refreshError } : {}),
    },
    hook,
  };
}

export async function inspectObsidianAgentsHookReadiness(options: {
  readonly sourcePath: string;
  readonly cacheRoot: string;
}): Promise<ObsidianAgentsHookReadiness> {
  const source = await pathExists(options.sourcePath);
  let installed = false;
  const pluginCacheRoot = join(options.cacheRoot, 'cthu-codex');
  if (await isDirectory(pluginCacheRoot)) {
    const versions = await readdir(pluginCacheRoot, { withFileTypes: true });
    installed = await hasCachedHook(pluginCacheRoot, versions);
  }
  return { source, installed, ready: source && installed };
}

async function prepareBeforePhase(
  profile: ObsidianAgentsProfile,
  initial: GitSnapshot,
): Promise<ObsidianAgentsSyncResult> {
  let changed = false;
  let committed = false;
  let commit: string | undefined;
  if (initial.worktree.length > 0) {
    const result = await commitAll(
      profile.agentsPath,
      'chc: sync Obsidian agents',
    );
    changed = result.changed;
    committed = result.changed;
    commit = result.commit;
  }

  await fetchGitRemote(profile.agentsPath);
  let snapshot = await readGitSnapshot(profile.agentsPath);
  assertSyncRepository(snapshot, profile);
  const branch = snapshot.branch;
  if (await remoteBranchExists(profile.agentsPath, branch)) {
    const ahead = snapshot.ahead ?? 0;
    const behind = snapshot.behind ?? 0;
    if (ahead > 0 && behind > 0) {
      throw new ObsidianAgentsServiceError(
        'conflict',
        `Obsidian agents history diverged: local is ahead ${ahead} and behind ${behind}. Reconcile ${profile.agentsPath} manually before invoking a Skill.`,
      );
    }
    if (behind > 0) {
      await mergeFastForward(profile.agentsPath, branch);
      snapshot = await readGitSnapshot(profile.agentsPath);
    }
    if (ahead > 0) {
      await pushGitBranch(profile.agentsPath, branch);
      return {
        phase: 'before',
        changed,
        committed,
        pushed: true,
        branch,
        commit,
        ahead: 0,
        behind: 0,
      };
    }
  } else if (snapshot.hasHead) {
    await pushGitBranch(profile.agentsPath, branch);
    return {
      phase: 'before',
      changed,
      committed,
      pushed: true,
      branch,
      commit,
    };
  }

  return {
    phase: 'before',
    changed,
    committed,
    pushed: false,
    branch,
    commit,
    ahead: snapshot.ahead,
    behind: snapshot.behind,
  };
}

async function finalizeAfterPhase(
  profile: ObsidianAgentsProfile,
  initial: GitSnapshot,
): Promise<ObsidianAgentsSyncResult> {
  assertSyncRepository(initial, profile);
  const branch = initial.branch;
  const result = await commitAll(
    profile.agentsPath,
    'chc: sync Obsidian agents',
  );
  if (!result.changed) {
    return {
      phase: 'after',
      changed: false,
      committed: false,
      pushed: false,
      branch,
      ahead: initial.ahead,
      behind: initial.behind,
    };
  }
  await pushGitBranch(profile.agentsPath, branch);
  return {
    phase: 'after',
    changed: true,
    committed: true,
    pushed: true,
    branch,
    commit: result.commit,
  };
}

function assertSyncRepository(
  snapshot: GitSnapshot,
  profile: ObsidianAgentsProfile,
): asserts snapshot is GitSnapshot & {
  readonly isRepository: true;
  readonly branch: string;
  readonly remote: string;
} {
  if (!snapshot.isRepository || !snapshot.branch || !snapshot.remote) {
    throw new ObsidianAgentsServiceError(
      'setup_required',
      `The configured agents path is not a complete Git repository: ${profile.agentsPath}. Run "chc obsidian agents setup" first.`,
    );
  }
}

function resolveSyncState(
  snapshot: GitSnapshot,
): ObsidianAgentsStatus['sync']['state'] {
  if (!snapshot.isRepository) return 'not_repository';
  if (!snapshot.remote) return 'no_remote';
  if (snapshot.worktree.length > 0) return 'dirty';
  if (!snapshot.comparisonAvailable) return 'unavailable';
  if ((snapshot.ahead ?? 0) > 0 && (snapshot.behind ?? 0) > 0) {
    return 'diverged';
  }
  if ((snapshot.ahead ?? 0) > 0) return 'ahead';
  if ((snapshot.behind ?? 0) > 0) return 'behind';
  return 'up_to_date';
}

function classifySyncError(error: unknown): ObsidianAgentsErrorCode {
  if (error instanceof ObsidianAgentsGitError) {
    if (error.kind === 'conflict' || error.kind === 'non_fast_forward') {
      return 'conflict';
    }
  }
  return 'sync_failed';
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function redactRemote(value: string | undefined): string | undefined {
  return value?.replace(/:\/\/[^/\s]+@/gu, '://***@');
}

function emptyGitSnapshot(): GitSnapshot {
  return {
    isRepository: false,
    hasHead: false,
    worktree: [],
    comparisonAvailable: false,
  };
}

async function hasCachedHook(
  root: string,
  entries: readonly import('node:fs').Dirent[],
): Promise<boolean> {
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (await pathExists(join(root, entry.name, 'hooks', 'hooks.json'))) {
      return true;
    }
  }
  return false;
}

async function listRelativeFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  await collectRelativeFiles(root, root, files);
  return files.sort((left, right) => left.localeCompare(right));
}

async function collectRelativeFiles(
  root: string,
  current: string,
  files: string[],
): Promise<void> {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (entry.name === '.git' && current === root) continue;
    const absolute = join(current, entry.name);
    if (entry.isDirectory()) {
      await collectRelativeFiles(root, absolute, files);
      continue;
    }
    files.push(absolute.slice(root.length + 1));
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (isMissingFileError(error)) return false;
    throw error;
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch (error) {
    if (isMissingFileError(error)) return false;
    throw error;
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}

function assertBranchName(branch: string): void {
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u.test(branch) ||
    branch.includes('..') ||
    branch.includes('//') ||
    branch.endsWith('/') ||
    branch.endsWith('.')
  ) {
    throw new ObsidianAgentsServiceError(
      'invalid_configuration',
      `Invalid Git branch name: ${branch}`,
    );
  }
}
