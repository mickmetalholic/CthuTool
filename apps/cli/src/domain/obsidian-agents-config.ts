import { randomUUID } from 'node:crypto';
import { mkdir, readFile, realpath, rename, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import type { ObsidianAgentsDataPaths } from '../infra/obsidian-agents-paths';

export const OBSIDIAN_AGENTS_CONFIG_VERSION = 3 as const;

export type ObsidianAgentsProfile = {
  readonly vaultPath: string;
  readonly sourcePath: string;
  readonly agentsPath: string;
};

export type ObsidianAgentsConfig = {
  readonly version: typeof OBSIDIAN_AGENTS_CONFIG_VERSION;
  readonly vaults: readonly ObsidianAgentsProfile[];
};

export type ObsidianAgentsProfileInput = {
  readonly vaultPath: string;
  readonly sourcePath?: string;
};

export class ObsidianAgentsConfigError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ObsidianAgentsConfigError';
  }
}

export function createEmptyObsidianAgentsConfig(): ObsidianAgentsConfig {
  return {
    version: OBSIDIAN_AGENTS_CONFIG_VERSION,
    vaults: [],
  };
}

export function normalizeObsidianAgentsProfile(
  input: ObsidianAgentsProfileInput,
): ObsidianAgentsProfile {
  const vaultPath = normalizeAbsolutePath(input.vaultPath, 'vault path');
  const sourcePath = normalizeAbsolutePath(
    input.sourcePath?.trim() || join(vaultPath, 'Agents'),
    'visible source path',
  );
  const agentsPath = join(vaultPath, '.agents');
  const sourceRelative = relative(vaultPath, sourcePath);
  if (
    sourceRelative.length === 0 ||
    sourceRelative === '..' ||
    sourceRelative.startsWith(`..${sep}`) ||
    isAbsolute(sourceRelative)
  ) {
    throw new ObsidianAgentsConfigError(
      'The visible source path must be a directory inside the Obsidian vault.',
    );
  }
  if (sourceRelative.split(/[\\/]/u).some((part) => part.startsWith('.'))) {
    throw new ObsidianAgentsConfigError(
      'The visible source path must not contain hidden dot-prefixed directories.',
    );
  }
  if (sourcePath === agentsPath) {
    throw new ObsidianAgentsConfigError(
      'The visible source path must be different from the vault .agents compatibility path.',
    );
  }

  return { vaultPath, sourcePath, agentsPath };
}

export async function readObsidianAgentsConfig(
  paths: ObsidianAgentsDataPaths,
): Promise<ObsidianAgentsConfig | undefined> {
  let raw: string;
  try {
    raw = await readFile(paths.configPath, 'utf8');
  } catch (error) {
    if (isMissingFileError(error)) return undefined;
    throw new ObsidianAgentsConfigError(
      `Unable to read Obsidian agents configuration: ${paths.configPath}`,
      { cause: error },
    );
  }

  try {
    return await parseObsidianAgentsConfig(JSON.parse(raw) as unknown);
  } catch (error) {
    if (error instanceof ObsidianAgentsConfigError) {
      throw new ObsidianAgentsConfigError(
        `${error.message} Configuration: ${paths.configPath}`,
        { cause: error },
      );
    }
    throw new ObsidianAgentsConfigError(
      `Invalid Obsidian agents configuration: ${paths.configPath}`,
      { cause: error },
    );
  }
}

export async function writeObsidianAgentsConfig(
  paths: ObsidianAgentsDataPaths,
  config: ObsidianAgentsConfig,
): Promise<void> {
  const normalized = await parseObsidianAgentsConfig(config);
  const persisted = {
    version: normalized.version,
    vaults: normalized.vaults.map(({ vaultPath, sourcePath }) => ({
      vaultPath,
      sourcePath,
    })),
  };
  await mkdir(paths.dataRoot, { recursive: true });
  const temporaryPath = `${paths.configPath}.tmp-${randomUUID()}`;
  await writeFile(
    temporaryPath,
    `${JSON.stringify(persisted, null, 2)}\n`,
    'utf8',
  );
  await rename(temporaryPath, paths.configPath);
}

export async function canonicalVaultPath(value: string): Promise<string> {
  const path = normalizeAbsolutePath(value, 'vault path');
  try {
    return await realpath(path);
  } catch (error) {
    if (isMissingFileError(error)) return path;
    throw error;
  }
}

export async function canonicalizeObsidianAgentsProfile(
  input: ObsidianAgentsProfileInput,
): Promise<ObsidianAgentsProfile> {
  const originalPath = normalizeAbsolutePath(input.vaultPath, 'vault path');
  const vaultPath = await canonicalVaultPath(originalPath);
  const sourcePath = normalizeAbsolutePath(
    input.sourcePath ?? join(originalPath, 'Agents'),
    'visible source path',
  );
  const sourceRelative = relative(originalPath, sourcePath);
  const throughOriginalPath =
    sourceRelative.length > 0 &&
    sourceRelative !== '..' &&
    !sourceRelative.startsWith(`..${sep}`) &&
    !isAbsolute(sourceRelative);
  return normalizeObsidianAgentsProfile({
    vaultPath,
    sourcePath: throughOriginalPath
      ? join(vaultPath, sourceRelative)
      : sourcePath,
  });
}

export async function parseObsidianAgentsConfig(
  value: unknown,
): Promise<ObsidianAgentsConfig> {
  if (!isRecord(value) || (value.version !== 2 && value.version !== 3)) {
    throw new ObsidianAgentsConfigError(
      'Unsupported Obsidian agents configuration. Back up and move the local configuration file aside, then rerun chc obsidian agents setup --vault <path>. Supported versions: 2 and 3.',
    );
  }
  let entries: unknown[];
  if (value.version === 2 && isRecord(value.profiles)) {
    entries = Object.values(value.profiles);
  } else if (value.version === 3 && Array.isArray(value.vaults)) {
    entries = value.vaults;
  } else {
    throw new ObsidianAgentsConfigError(
      'Obsidian agents configuration must contain vault entries.',
    );
  }
  const vaults: ObsidianAgentsProfile[] = [];
  for (const entry of entries) {
    if (!isRecord(entry))
      throw new ObsidianAgentsConfigError('Invalid vault configuration.');
    const profile = await canonicalizeObsidianAgentsProfile({
      vaultPath: readString(entry.vaultPath, 'vaultPath'),
      sourcePath: readString(entry.sourcePath, 'sourcePath'),
    });
    const existing = selectObsidianAgentsProfile(
      { version: 3, vaults },
      profile.vaultPath,
    );
    if (existing) {
      if (pathKey(existing.sourcePath) !== pathKey(profile.sourcePath)) {
        throw new ObsidianAgentsConfigError(
          `Conflicting sources for ${profile.vaultPath}: ${existing.sourcePath} and ${profile.sourcePath}. Reconcile the local configuration entries before retrying.`,
        );
      }
    } else {
      vaults.push(profile);
    }
  }
  vaults.sort((left, right) =>
    left.vaultPath < right.vaultPath
      ? -1
      : left.vaultPath > right.vaultPath
        ? 1
        : 0,
  );
  return { version: OBSIDIAN_AGENTS_CONFIG_VERSION, vaults };
}

export function selectObsidianAgentsProfile(
  config: ObsidianAgentsConfig,
  vaultPath: string,
): ObsidianAgentsProfile | undefined {
  return config.vaults.find(
    (entry) => pathKey(entry.vaultPath) === pathKey(vaultPath),
  );
}

export function upsertObsidianAgentsProfile(
  config: ObsidianAgentsConfig,
  profile: ObsidianAgentsProfile,
): ObsidianAgentsConfig {
  return {
    version: OBSIDIAN_AGENTS_CONFIG_VERSION,
    vaults: [
      ...config.vaults.filter(
        (entry) => pathKey(entry.vaultPath) !== pathKey(profile.vaultPath),
      ),
      profile,
    ],
  };
}

function pathKey(path: string): string {
  return process.platform === 'win32' ? path.toLowerCase() : path;
}

function normalizeAbsolutePath(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed || !isAbsolute(trimmed)) {
    throw new ObsidianAgentsConfigError(`${label} must be an absolute path.`);
  }
  return resolve(trimmed);
}

function readString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ObsidianAgentsConfigError(`${label} must be a non-empty string.`);
  }
  return value;
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
