import { mkdir, rename, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { InstalledSkill, SkillsBackend } from './codex-skills-backend';
import {
  type CodexSkillsManifest,
  type ManagedCodexSkill,
  removeManagedSkill,
  upsertManagedSkill,
  writeCodexSkillsManifest,
} from './codex-skills-manifest';

export type ManagedSkillState =
  | 'missing'
  | 'installed'
  | 'update_available'
  | 'unmanaged_collision'
  | 'disabled'
  | 'legacy';

export type ManagedSkillAction =
  | 'none'
  | 'install'
  | 'replace'
  | 'update'
  | 'enable'
  | 'remove'
  | 'add';

export type ManagedSkillInventoryRow = {
  readonly name: string;
  readonly source: string;
  readonly state: ManagedSkillState;
  readonly installedPath?: string;
  readonly installedManaged?: boolean;
  readonly availableActions: ManagedSkillAction[];
  readonly skill?: ManagedCodexSkill;
};

export type SkillPlanItem = {
  readonly action: ManagedSkillAction;
  readonly name: string;
  readonly skill?: ManagedCodexSkill;
  readonly installedPath?: string;
  readonly installedManaged?: boolean;
};

export type ExecuteSkillPlanResult = {
  readonly manifest: CodexSkillsManifest;
  readonly completed: SkillPlanItem[];
  readonly failed: Array<{
    readonly item: SkillPlanItem;
    readonly error: string;
  }>;
};

export async function buildManagedSkillInventory(input: {
  readonly manifest: CodexSkillsManifest;
  readonly legacyEntries: readonly string[];
  readonly backend: SkillsBackend;
}): Promise<ManagedSkillInventoryRow[]> {
  if (input.manifest.skills.length === 0) {
    return input.legacyEntries.map((name) => ({
      name,
      source: 'legacy manifest entry',
      state: 'legacy' as const,
      availableActions: ['none'] as ManagedSkillAction[],
    }));
  }
  const installed = await input.backend.listInstalled();
  const installedByName = new Map(
    installed.map((skill) => [skill.name, skill]),
  );
  const trackedSkills = input.manifest.skills.filter((skill) => {
    const local = installedByName.get(skill.name);
    return (
      skill.enabled &&
      skill.tracking.type === 'branch' &&
      local?.managed === true &&
      local.repository === skill.repository
    );
  });
  const updates = await input.backend.checkUpdates(trackedSkills);

  const rows = input.manifest.skills.map((skill) =>
    classifyManagedSkill(skill, installedByName.get(skill.name), updates),
  );
  for (const name of input.legacyEntries) {
    rows.push({
      name,
      source: 'legacy manifest entry',
      state: 'legacy',
      availableActions: ['none'],
    });
  }
  return rows.sort((left, right) => left.name.localeCompare(right.name));
}

export function classifyManagedSkill(
  skill: ManagedCodexSkill,
  installed: InstalledSkill | undefined,
  updates: ReadonlySet<string>,
): ManagedSkillInventoryRow {
  const source = `${skill.repository}:${skill.selector}@${skill.tracking.ref}`;
  if (!skill.enabled) {
    return {
      name: skill.name,
      source,
      state: 'disabled',
      installedPath: installed?.path,
      installedManaged:
        installed?.managed === true &&
        installed.repository === skill.repository,
      availableActions: ['none', 'enable', 'remove'],
      skill,
    };
  }
  if (!installed) {
    return {
      name: skill.name,
      source,
      state: 'missing',
      availableActions: ['none', 'install', 'remove'],
      skill,
    };
  }
  if (!installed.managed || installed.repository !== skill.repository) {
    return {
      name: skill.name,
      source,
      state: 'unmanaged_collision',
      installedPath: installed.path,
      installedManaged: false,
      availableActions: ['none', 'replace', 'remove'],
      skill,
    };
  }
  if (skill.tracking.type === 'branch' && updates.has(skill.name)) {
    return {
      name: skill.name,
      source,
      state: 'update_available',
      installedPath: installed.path,
      installedManaged: true,
      availableActions: ['none', 'update', 'remove'],
      skill,
    };
  }
  return {
    name: skill.name,
    source,
    state: 'installed',
    installedPath: installed.path,
    installedManaged: true,
    availableActions: ['none', 'remove'],
    skill,
  };
}

export async function executeSkillPlan(input: {
  readonly repoCodexRoot: string;
  readonly manifest: CodexSkillsManifest;
  readonly items: readonly SkillPlanItem[];
  readonly backend: SkillsBackend;
}): Promise<ExecuteSkillPlanResult> {
  let manifest = input.manifest;
  const completed: SkillPlanItem[] = [];
  const failed: Array<{ item: SkillPlanItem; error: string }> = [];

  for (const item of input.items) {
    if (item.action === 'none') {
      continue;
    }
    try {
      if (item.action === 'install' || item.action === 'add') {
        if (!item.skill) {
          throw new Error(`Missing install metadata for ${item.name}.`);
        }
        await input.backend.install(item.skill);
        manifest = upsertManagedSkill(manifest, item.skill);
      } else if (item.action === 'replace') {
        if (!item.skill || !item.installedPath) {
          throw new Error(`Missing replacement metadata for ${item.name}.`);
        }
        await replaceSkillWithRollback(item, input.backend);
        manifest = upsertManagedSkill(manifest, item.skill);
      } else if (item.action === 'update') {
        if (!item.skill) {
          throw new Error(`Missing update metadata for ${item.name}.`);
        }
        await input.backend.update(item.skill);
      } else if (item.action === 'enable') {
        if (!item.skill) {
          throw new Error(`Missing enable metadata for ${item.name}.`);
        }
        manifest = upsertManagedSkill(manifest, {
          ...item.skill,
          enabled: true,
        });
      } else if (item.action === 'remove') {
        if (item.installedPath && item.installedManaged === true) {
          await input.backend.remove(item.name);
        }
        manifest = removeManagedSkill(manifest, item.name);
      }
      await writeCodexSkillsManifest(input.repoCodexRoot, manifest);
      completed.push(item);
    } catch (error) {
      failed.push({
        item,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { manifest, completed, failed };
}

async function replaceSkillWithRollback(
  item: SkillPlanItem & {
    readonly skill?: ManagedCodexSkill;
    readonly installedPath?: string;
  },
  backend: SkillsBackend,
): Promise<void> {
  const skill = item.skill;
  const installedPath = item.installedPath;
  if (!skill || !installedPath) {
    throw new Error(`Missing replacement metadata for ${item.name}.`);
  }
  const backupPath = join(
    dirname(installedPath),
    `.${item.name}.cthutool-backup-${process.pid}-${Date.now()}`,
  );
  await mkdir(dirname(backupPath), { recursive: true });
  await rename(installedPath, backupPath);
  try {
    await backend.install(skill);
    await rm(backupPath, { recursive: true, force: true });
  } catch (error) {
    await rm(installedPath, { recursive: true, force: true });
    await rename(backupPath, installedPath);
    throw error;
  }
}
