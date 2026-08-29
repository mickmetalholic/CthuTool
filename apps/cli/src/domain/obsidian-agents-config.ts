import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import type { ObsidianAgentsDataPaths } from '../infra/obsidian-agents-paths';

export const OBSIDIAN_AGENTS_CONFIG_VERSION = 2 as const;

export type ObsidianAgentsProfile = {
  readonly id: string;
  readonly vaultPath: string;
  readonly sourcePath: string;
  readonly agentsPath: string;
};

export type ObsidianAgentsConfig = {
  readonly version: typeof OBSIDIAN_AGENTS_CONFIG_VERSION;
  readonly defaultProfile?: string;
  readonly profiles: Readonly<Record<string, ObsidianAgentsProfile>>;
};

export type ObsidianAgentsProfileInput = {
  readonly id: string;
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
    profiles: {},
  };
}

export function normalizeObsidianAgentsProfile(
  input: ObsidianAgentsProfileInput,
): ObsidianAgentsProfile {
  const id = input.id.trim();
  if (!/^[a-z0-9][a-z0-9_-]*$/u.test(id)) {
    throw new ObsidianAgentsConfigError(
      'Profile id must start with a lowercase letter or number and contain only lowercase letters, numbers, hyphens, or underscores.',
    );
  }

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

  return { id, vaultPath, sourcePath, agentsPath };
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
    return parseObsidianAgentsConfig(JSON.parse(raw) as unknown);
  } catch (error) {
    if (error instanceof ObsidianAgentsConfigError) throw error;
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
  const normalized = parseObsidianAgentsConfig(config);
  const persisted = {
    version: normalized.version,
    ...(normalized.defaultProfile
      ? { defaultProfile: normalized.defaultProfile }
      : {}),
    profiles: Object.fromEntries(
      Object.entries(normalized.profiles).map(([id, profile]) => [
        id,
        {
          id: profile.id,
          vaultPath: profile.vaultPath,
          sourcePath: profile.sourcePath,
        },
      ]),
    ),
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

export function parseObsidianAgentsConfig(
  value: unknown,
): ObsidianAgentsConfig {
  if (!isRecord(value) || (value.version !== 1 && value.version !== 2)) {
    throw new ObsidianAgentsConfigError(
      'Obsidian agents configuration must use version 1 or 2.',
    );
  }
  if (!isRecord(value.profiles)) {
    throw new ObsidianAgentsConfigError(
      'Obsidian agents configuration must contain a profiles object.',
    );
  }

  const profiles: Record<string, ObsidianAgentsProfile> = {};
  for (const [id, rawProfile] of Object.entries(value.profiles)) {
    if (!isRecord(rawProfile)) {
      throw new ObsidianAgentsConfigError(`Profile "${id}" is invalid.`);
    }
    profiles[id] = normalizeObsidianAgentsProfile({
      id,
      vaultPath: readString(rawProfile.vaultPath, `Profile "${id}" vaultPath`),
      sourcePath:
        value.version === 2
          ? readString(rawProfile.sourcePath, `Profile "${id}" sourcePath`)
          : undefined,
    });
  }

  const defaultProfile =
    value.defaultProfile === undefined
      ? undefined
      : readString(value.defaultProfile, 'defaultProfile');
  if (defaultProfile && !profiles[defaultProfile]) {
    throw new ObsidianAgentsConfigError(
      `Default profile "${defaultProfile}" does not exist.`,
    );
  }
  return {
    version: OBSIDIAN_AGENTS_CONFIG_VERSION,
    ...(defaultProfile ? { defaultProfile } : {}),
    profiles,
  };
}

export function selectObsidianAgentsProfile(
  config: ObsidianAgentsConfig,
  profileId?: string,
): ObsidianAgentsProfile | undefined {
  const selectedId = profileId?.trim() || config.defaultProfile;
  if (selectedId) return config.profiles[selectedId];
  return Object.values(config.profiles)[0];
}

export function upsertObsidianAgentsProfile(
  config: ObsidianAgentsConfig,
  profile: ObsidianAgentsProfile,
): ObsidianAgentsConfig {
  return {
    ...config,
    defaultProfile: profile.id,
    profiles: { ...config.profiles, [profile.id]: profile },
  };
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
