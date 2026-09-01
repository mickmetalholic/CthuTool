import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { assertPathInside } from '../infra/codex-config-paths';

export type SkillTracking =
  | { readonly type: 'branch'; readonly ref: string }
  | { readonly type: 'pin'; readonly ref: string };

export type ManagedGitHubSkill = {
  readonly name: string;
  readonly source: 'github';
  readonly repository: string;
  readonly selector: string;
  readonly tracking: SkillTracking;
  readonly enabled: boolean;
};

export type ManagedCodexSkill = ManagedGitHubSkill;

export type CodexSkillsManifest = {
  readonly version: 2;
  readonly skills: ManagedCodexSkill[];
};

export type ReadCodexSkillsManifestResult = {
  readonly manifest: CodexSkillsManifest;
  readonly legacyEntries: string[];
};

export const emptyCodexSkillsManifest = (): CodexSkillsManifest => ({
  version: 2,
  skills: [],
});

export async function readCodexSkillsManifest(
  repoCodexRoot: string,
): Promise<ReadCodexSkillsManifestResult> {
  const path = getManifestPath(repoCodexRoot);
  let value: unknown;
  try {
    value = JSON.parse(await readFile(path, 'utf8')) as unknown;
  } catch (error) {
    if (isMissingFileError(error)) {
      return { manifest: emptyCodexSkillsManifest(), legacyEntries: [] };
    }
    throw new Error(`Invalid Codex skills manifest JSON: ${path}`, {
      cause: error,
    });
  }

  if (isRecord(value) && value.version === 1) {
    const legacyEntries = Array.isArray(value.skills)
      ? value.skills
          .map((entry) =>
            isRecord(entry) && typeof entry.name === 'string'
              ? entry.name
              : undefined,
          )
          .filter((name): name is string => name !== undefined)
          .sort()
      : [];
    return { manifest: emptyCodexSkillsManifest(), legacyEntries };
  }

  return {
    manifest: validateCodexSkillsManifest(value),
    legacyEntries: [],
  };
}

export function validateCodexSkillsManifest(
  value: unknown,
): CodexSkillsManifest {
  if (!isRecord(value) || value.version !== 2 || !Array.isArray(value.skills)) {
    throw new Error(
      'Codex skills manifest must have version 2 and a skills array.',
    );
  }

  const names = new Set<string>();
  const skills = value.skills.map((entry, index) => {
    const skill = validateManagedSkill(entry, index);
    if (names.has(skill.name)) {
      throw new Error(`Duplicate Codex skill manifest entry: ${skill.name}`);
    }
    names.add(skill.name);
    return skill;
  });

  return {
    version: 2,
    skills: skills.sort((left, right) => left.name.localeCompare(right.name)),
  };
}

export async function writeCodexSkillsManifest(
  repoCodexRoot: string,
  manifest: CodexSkillsManifest,
): Promise<void> {
  const validated = validateCodexSkillsManifest(manifest);
  const path = getManifestPath(repoCodexRoot);
  const temporaryPath = join(
    dirname(path),
    `.skills.manifest.${process.pid}.${Date.now()}.tmp`,
  );
  assertPathInside(repoCodexRoot, path);
  assertPathInside(repoCodexRoot, temporaryPath);
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(
      temporaryPath,
      `${JSON.stringify(validated, null, 2)}\n`,
      'utf8',
    );
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export function upsertManagedSkill(
  manifest: CodexSkillsManifest,
  skill: ManagedCodexSkill,
): CodexSkillsManifest {
  return validateCodexSkillsManifest({
    version: 2,
    skills: [
      ...manifest.skills.filter((entry) => entry.name !== skill.name),
      skill,
    ],
  });
}

export function removeManagedSkill(
  manifest: CodexSkillsManifest,
  name: string,
): CodexSkillsManifest {
  return {
    version: 2,
    skills: manifest.skills.filter((skill) => skill.name !== name),
  };
}

export function isManagedGitHubSkill(
  skill: ManagedCodexSkill,
): skill is ManagedGitHubSkill {
  return skill.source === 'github';
}

function getManifestPath(repoCodexRoot: string): string {
  const path = resolve(repoCodexRoot, 'skills.manifest.json');
  assertPathInside(repoCodexRoot, path);
  return path;
}

function validateManagedSkill(
  value: unknown,
  index: number,
): ManagedCodexSkill {
  if (!isRecord(value)) {
    throw new Error(`Codex skill entry ${index} must be an object.`);
  }
  const name = readNonEmptyString(value.name, `skills[${index}].name`);
  if (!/^[a-z0-9][a-z0-9-]*$/u.test(name)) {
    throw new Error(`Invalid Codex skill name: ${name}`);
  }
  const selector = readNonEmptyString(
    value.selector,
    `skills[${index}].selector`,
  );
  if (selector.includes('\\') || selector.split('/').includes('..')) {
    throw new Error(`Invalid skill selector for ${name}: ${selector}`);
  }
  if (typeof value.enabled !== 'boolean') {
    throw new Error(`Codex skill ${name} must declare enabled as a boolean.`);
  }

  if (value.source === 'github') {
    const repository = readNonEmptyString(
      value.repository,
      `skills[${index}].repository`,
    );
    if (!/^[^/\s]+\/[^/\s]+$/u.test(repository) || repository.includes('..')) {
      throw new Error(`Invalid GitHub repository for ${name}: ${repository}`);
    }
    if (!isRecord(value.tracking)) {
      throw new Error(`Codex skill ${name} must declare tracking.`);
    }
    if (value.tracking.type !== 'branch' && value.tracking.type !== 'pin') {
      throw new Error(`Invalid tracking type for ${name}.`);
    }
    const ref = readNonEmptyString(
      value.tracking.ref,
      `skills[${index}].tracking.ref`,
    );
    return {
      name,
      source: 'github',
      repository,
      selector,
      tracking: { type: value.tracking.type, ref },
      enabled: value.enabled,
    };
  }

  throw new Error(`Codex skill ${name} must use source "github".`);
}

function readNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
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
