import { execFile as execFileCallback } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { ManagedCodexSkill } from './codex-skills-manifest';

const execFile = promisify(execFileCallback);

export const pinnedSkillsCliVersion = '1.5.19';

export type SkillsBackendErrorCode =
  | 'contract_mismatch'
  | 'process_failed'
  | 'network_failed';

export class SkillsBackendError extends Error {
  readonly code: SkillsBackendErrorCode;

  constructor(
    code: SkillsBackendErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'SkillsBackendError';
    this.code = code;
  }
}

export type InstalledSkill = {
  readonly name: string;
  readonly path: string;
  readonly managed: boolean;
  readonly repository?: string;
  readonly localGitHubCandidate?: LocalGitHubSkillCandidate;
};

export type LocalGitHubSkillCandidate = {
  readonly repository: string;
  readonly selector: string;
  readonly skillPath: string;
  readonly ref?: string;
};

export type DiscoveredSkill = {
  readonly name: string;
};

export type SkillsBackend = {
  readonly listInstalled: (options?: {
    readonly trackableOnly?: boolean;
  }) => Promise<InstalledSkill[]>;
  readonly discover: (repository: string) => Promise<DiscoveredSkill[]>;
  readonly validate: (skill: ManagedCodexSkill) => Promise<void>;
  readonly checkUpdates: (
    skills: readonly ManagedCodexSkill[],
  ) => Promise<Set<string>>;
  readonly install: (skill: ManagedCodexSkill) => Promise<void>;
  readonly update: (skill: ManagedCodexSkill) => Promise<void>;
  readonly remove: (name: string) => Promise<void>;
};

export type SkillsProcessResult = {
  readonly stdout: string;
  readonly stderr: string;
};

export type SkillsProcessRunner = (
  args: readonly string[],
  env: NodeJS.ProcessEnv,
) => Promise<SkillsProcessResult>;

export type NpxSkillsBackendOptions = {
  readonly homeRoot: string;
  readonly localCodexRoot: string;
  readonly run?: SkillsProcessRunner;
  readonly fetchRemoteTree?: RemoteTreeFetcher;
};

export type RemoteTreeFetcher = (
  url: string,
  init?: RequestInit,
) => Promise<Response>;

export function createNpxSkillsBackend(
  options: NpxSkillsBackendOptions,
): SkillsBackend {
  const run = options.run ?? runSkillsProcess;
  const fetchRemoteTree = options.fetchRemoteTree ?? fetch;
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    CODEX_HOME: options.localCodexRoot,
    FORCE_COLOR: '0',
    HOME: options.homeRoot,
    NO_COLOR: '1',
    USERPROFILE: options.homeRoot,
  };

  return {
    async listInstalled(listOptions) {
      const lockEntries = await readSkillLock(options.homeRoot);
      if (
        listOptions?.trackableOnly &&
        ![...lockEntries].some(([name, lock]) => {
          const repository = readGitHubRepository(lock);
          return (
            repository !== undefined &&
            readLocalGitHubCandidate(name, lock, repository) !== undefined
          );
        })
      ) {
        return [];
      }
      const result = await run(
        ['list', '--global', '--agent', 'codex', '--json'],
        env,
      );
      const installed = parseInstalledSkills(result.stdout);
      return installed.map((skill) => {
        const lock = lockEntries.get(skill.name);
        const repository = lock ? readGitHubRepository(lock) : undefined;
        const localGitHubCandidate =
          lock && repository
            ? readLocalGitHubCandidate(skill.name, lock, repository)
            : undefined;
        return {
          ...skill,
          managed: repository !== undefined,
          repository,
          localGitHubCandidate,
        };
      });
    },
    async discover(repository) {
      const result = await run(['add', repository, '--list'], env);
      return parseDiscoveredSkills(result.stdout);
    },
    async validate(skill) {
      const result = await run(
        ['add', resolveSkillSource(skill), '--list'],
        env,
      );
      const discovered = parseDiscoveredSkills(result.stdout);
      if (
        !discovered.some(
          (candidate) =>
            candidate.name === skill.selector || candidate.name === skill.name,
        )
      ) {
        throw new SkillsBackendError(
          'contract_mismatch',
          `Skill ${skill.selector} was not found in ${skill.repository}@${skill.tracking.ref}.`,
        );
      }
    },
    async checkUpdates(skills) {
      if (skills.length === 0) {
        return new Set();
      }
      const lock = await readSkillLock(options.homeRoot);
      return checkGitHubUpdates(skills, lock, fetchRemoteTree, env);
    },
    async install(skill) {
      await run(
        [
          'add',
          resolveSkillSource(skill),
          '--skill',
          skill.selector,
          '--global',
          '--agent',
          'codex',
          '--yes',
        ],
        env,
      );
    },
    async update(skill) {
      await run(
        [
          'add',
          resolveSkillSource(skill),
          '--skill',
          skill.selector,
          '--global',
          '--agent',
          'codex',
          '--yes',
        ],
        env,
      );
    },
    async remove(name) {
      await run(['remove', name, '--global', '--agent', 'codex', '--yes'], env);
    },
  };
}

export function parseInstalledSkills(value: string): InstalledSkill[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value) as unknown;
  } catch (error) {
    throw new SkillsBackendError(
      'contract_mismatch',
      'Unsupported skills CLI list output: expected JSON.',
      {
        cause: error,
      },
    );
  }
  if (!Array.isArray(parsed)) {
    throw new SkillsBackendError(
      'contract_mismatch',
      'Unsupported skills CLI list output: expected an array.',
    );
  }
  return parsed.map((entry, index) => {
    if (
      !isRecord(entry) ||
      typeof entry.name !== 'string' ||
      typeof entry.path !== 'string'
    ) {
      throw new SkillsBackendError(
        'contract_mismatch',
        `Unsupported skills CLI list entry at index ${index}.`,
      );
    }
    return {
      name: entry.name,
      path: entry.path,
      managed: false,
    };
  });
}

export function parseDiscoveredSkills(value: string): DiscoveredSkill[] {
  const plain = stripTerminalSequences(value);
  const names = new Set<string>();
  for (const line of plain.split(/\r?\n/u)) {
    const match = line.match(/^\s*│\s{4}([a-z0-9][a-z0-9-]*)\s*$/u);
    if (match?.[1]) {
      names.add(match[1]);
    }
  }
  if (names.size === 0 && !plain.includes('Found 0 skills')) {
    throw new SkillsBackendError(
      'contract_mismatch',
      'Unsupported skills CLI discovery output; the pinned contract may have changed.',
    );
  }
  return [...names].sort().map((name) => ({ name }));
}

async function runSkillsProcess(
  args: readonly string[],
  env: NodeJS.ProcessEnv,
): Promise<SkillsProcessResult> {
  const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  try {
    const result = await execFile(
      executable,
      ['--yes', `skills@${pinnedSkillsCliVersion}`, ...args],
      {
        encoding: 'utf8',
        env,
        maxBuffer: 10 * 1024 * 1024,
      },
    );
    return { stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const message =
      error instanceof Error && 'stderr' in error
        ? String((error as { stderr?: unknown }).stderr ?? error.message)
        : String(error);
    throw new SkillsBackendError(
      'process_failed',
      `skills@${pinnedSkillsCliVersion} failed: ${message.trim() || 'unknown error'}`,
      { cause: error },
    );
  }
}

async function readSkillLock(
  homeRoot: string,
): Promise<Map<string, Record<string, unknown>>> {
  try {
    const parsed = JSON.parse(
      await readFile(join(homeRoot, '.agents', '.skill-lock.json'), 'utf8'),
    ) as unknown;
    if (!isRecord(parsed) || parsed.version !== 3 || !isRecord(parsed.skills)) {
      throw new Error('expected lock version 3 with a skills object');
    }
    return new Map(
      Object.entries(parsed.skills).filter(
        (entry): entry is [string, Record<string, unknown>] =>
          isRecord(entry[1]),
      ),
    );
  } catch (error) {
    if (isMissingFileError(error)) {
      return new Map();
    }
    throw new SkillsBackendError(
      'contract_mismatch',
      'Unsupported skills CLI lock metadata.',
      { cause: error },
    );
  }
}

function readGitHubRepository(
  lock: Record<string, unknown>,
): string | undefined {
  if (lock.sourceType !== 'github') {
    return undefined;
  }
  if (
    typeof lock.source === 'string' &&
    /^[^/\s]+\/[^/\s]+$/u.test(lock.source)
  ) {
    return lock.source.replace(/\.git$/u, '');
  }
  if (typeof lock.sourceUrl !== 'string') {
    return undefined;
  }
  const match = lock.sourceUrl.match(
    /^https:\/\/github\.com\/([^/]+\/[^/#]+?)(?:\.git)?(?:[/#]|$)/u,
  );
  return match?.[1];
}

function readLocalGitHubCandidate(
  name: string,
  lock: Record<string, unknown>,
  repository: string,
): LocalGitHubSkillCandidate | undefined {
  if (typeof lock.skillPath !== 'string') {
    return undefined;
  }
  const skillPath = lock.skillPath.trim().replaceAll('\\', '/');
  const segments = skillPath.split('/');
  if (
    skillPath.length === 0 ||
    skillPath.startsWith('/') ||
    segments.includes('..') ||
    segments.at(-1)?.toLowerCase() !== 'skill.md'
  ) {
    return undefined;
  }
  const directoryName = segments.at(-2);
  if (directoryName !== name) {
    return undefined;
  }
  const ref =
    typeof lock.ref === 'string' && lock.ref.trim().length > 0
      ? lock.ref.trim()
      : undefined;
  return {
    repository,
    selector: name,
    skillPath,
    ...(ref ? { ref } : {}),
  };
}

function resolveSkillSource(skill: ManagedCodexSkill): string {
  return `${skill.repository}#${encodeURIComponent(skill.tracking.ref)}`;
}

type GitHubTreeEntry = {
  readonly path: string;
  readonly type: 'blob' | 'tree';
  readonly sha: string;
};

async function checkGitHubUpdates(
  skills: readonly ManagedCodexSkill[],
  lock: ReadonlyMap<string, Record<string, unknown>>,
  fetchRemoteTree: RemoteTreeFetcher,
  env: NodeJS.ProcessEnv,
): Promise<Set<string>> {
  const updates = new Set<string>();
  const trees = new Map<string, Promise<GitHubTreeEntry[]>>();
  for (const skill of skills) {
    const entry = lock.get(skill.name);
    const repository = entry ? readGitHubRepository(entry) : undefined;
    const skillPath = entry?.skillPath;
    const installedHash = entry?.skillFolderHash;
    if (
      !entry ||
      !repository ||
      typeof skillPath !== 'string' ||
      typeof installedHash !== 'string' ||
      installedHash.length === 0
    ) {
      throw new SkillsBackendError(
        'contract_mismatch',
        `Unsupported skills@${pinnedSkillsCliVersion} lock metadata for ${skill.name}; reinstall it before checking updates.`,
      );
    }
    if (repository !== skill.repository) {
      throw new SkillsBackendError(
        'contract_mismatch',
        `Installed source mismatch for ${skill.name}: expected ${skill.repository}, found ${repository}.`,
      );
    }
    const treeKey = `${repository}@${skill.tracking.ref}`;
    let tree = trees.get(treeKey);
    if (!tree) {
      tree = fetchGitHubTree(
        repository,
        skill.tracking.ref,
        fetchRemoteTree,
        env,
      );
      trees.set(treeKey, tree);
    }
    const remoteHash = findSkillTreeHash(await tree, skillPath);
    if (!remoteHash) {
      throw new SkillsBackendError(
        'contract_mismatch',
        `The tracked path for ${skill.name} is absent from ${repository}@${skill.tracking.ref}.`,
      );
    }
    if (remoteHash !== installedHash) {
      updates.add(skill.name);
    }
  }
  return updates;
}

async function fetchGitHubTree(
  repository: string,
  ref: string,
  fetchRemoteTree: RemoteTreeFetcher,
  env: NodeJS.ProcessEnv,
): Promise<GitHubTreeEntry[]> {
  const encodedRef = encodeURIComponent(ref);
  const token = env.GITHUB_TOKEN ?? env.GH_TOKEN;
  const response = await fetchRemoteTree(
    `https://api.github.com/repos/${repository}/git/trees/${encodedRef}?recursive=1`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'User-Agent': 'CthuTool Codex skills manager',
      },
    },
  );
  if (!response.ok) {
    throw new SkillsBackendError(
      'network_failed',
      `GitHub update check failed for ${repository}@${ref}: HTTP ${response.status}.`,
    );
  }
  const value = (await response.json()) as unknown;
  if (!isRecord(value) || !Array.isArray(value.tree)) {
    throw new SkillsBackendError(
      'contract_mismatch',
      `Unsupported GitHub tree response for ${repository}@${ref}.`,
    );
  }
  if (value.truncated === true) {
    throw new SkillsBackendError(
      'contract_mismatch',
      `GitHub tree response was truncated for ${repository}@${ref}; update state is unknown.`,
    );
  }
  return value.tree.map((entry, index) => {
    if (
      !isRecord(entry) ||
      typeof entry.path !== 'string' ||
      (entry.type !== 'blob' && entry.type !== 'tree') ||
      typeof entry.sha !== 'string'
    ) {
      throw new SkillsBackendError(
        'contract_mismatch',
        `Unsupported GitHub tree entry at index ${index}.`,
      );
    }
    return { path: entry.path, type: entry.type, sha: entry.sha };
  });
}

function findSkillTreeHash(
  tree: readonly GitHubTreeEntry[],
  skillPath: string,
): string | undefined {
  let folder = skillPath.replaceAll('\\', '/');
  if (folder.toLowerCase().endsWith('/skill.md')) {
    folder = folder.slice(0, -9);
  } else if (folder.toLowerCase().endsWith('skill.md')) {
    folder = folder.slice(0, -8);
  }
  folder = folder.replace(/\/$/u, '');
  return tree.find((entry) => entry.type === 'tree' && entry.path === folder)
    ?.sha;
}

function stripTerminalSequences(value: string): string {
  const escapeCharacter = String.fromCharCode(27);
  const bell = String.fromCharCode(7);
  return value
    .replace(new RegExp(`${escapeCharacter}\\[[0-9;?]*[ -/]*[@-~]`, 'gu'), '')
    .replace(
      new RegExp(
        `${escapeCharacter}\\][^${bell}]*(?:${bell}|${escapeCharacter}\\\\)`,
        'gu',
      ),
      '',
    )
    .replace(/\r[^\n]*/gu, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}
