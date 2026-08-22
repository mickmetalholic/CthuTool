import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import type { ObsidianAgentsDataPaths } from '../infra/obsidian-agents-paths';

export const OBSIDIAN_AGENTS_CONFIG_VERSION = 1 as const;

export type ObsidianAgentsProfile = {
  readonly id: string;
  readonly vaultPath: string;
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
  readonly agentsPath?: string;
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
  const agentsPath = normalizeAbsolutePath(
    input.agentsPath?.trim() || join(vaultPath, '.agents'),
    'agents path',
  );
  if (vaultPath === agentsPath) {
    throw new ObsidianAgentsConfigError(
      'The agents path must be different from the Obsidian vault path.',
    );
  }

  return { id, vaultPath, agentsPath };
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
  await mkdir(paths.dataRoot, { recursive: true });
  const temporaryPath = `${paths.configPath}.tmp-${randomUUID()}`;
  await writeFile(
    temporaryPath,
    `${JSON.stringify(normalized, null, 2)}\n`,
    'utf8',
  );
  await rename(temporaryPath, paths.configPath);
}

export function parseObsidianAgentsConfig(
  value: unknown,
): ObsidianAgentsConfig {
  if (!isRecord(value) || value.version !== OBSIDIAN_AGENTS_CONFIG_VERSION) {
    throw new ObsidianAgentsConfigError(
      `Obsidian agents configuration must use version ${OBSIDIAN_AGENTS_CONFIG_VERSION}.`,
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
    const profile = normalizeObsidianAgentsProfile({
      id,
      vaultPath: readString(rawProfile.vaultPath, `Profile "${id}" vaultPath`),
      agentsPath: readString(
        rawProfile.agentsPath,
        `Profile "${id}" agentsPath`,
      ),
    });
    profiles[id] = profile;
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
  const first = Object.values(config.profiles)[0];
  return first;
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
