import type { Dirent } from 'node:fs';
import {
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, join, posix, relative, resolve } from 'node:path';
import {
  assertPathInside,
  type CodexConfigPaths,
} from '../infra/codex-config-paths';
import {
  discoverCodexPlugins,
  type InstallCodexPluginResult,
  installCodexPlugins,
  readEnabledCodexPluginIds,
  type SyncCodexPluginCacheResult,
  syncCodexPluginCache,
} from './codex-plugin-manager';

type ManagedArea = 'prompts' | 'rules';

type FileState = 'added' | 'removed' | 'modified' | 'unchanged';

export type RepoPluginStatus = {
  readonly name: string;
  readonly path: string;
  readonly status: 'applied' | 'not_applied' | 'disabled';
};

export type CodexConfigComparison = {
  readonly areas: Record<
    ManagedArea,
    {
      readonly counts: Record<FileState, number>;
      readonly files: Record<FileState, string[]>;
    }
  >;
  readonly unmanagedSkills: string[];
  readonly unmanagedPlugins: string[];
  readonly repoPlugins: RepoPluginStatus[];
  readonly missingRepoSkills: string[];
  readonly missingRepoPlugins: string[];
  readonly unsupportedSkills: string[];
  readonly unsupportedPlugins: string[];
  readonly unsafeRepoPaths: string[];
};

export type SkillManifest = {
  readonly version: 1;
  readonly skills: SkillManifestEntry[];
};

export type SkillManifestEntry = {
  readonly name: string;
  readonly source: string;
  readonly path: string;
  readonly enabled?: boolean;
};

export type PluginManifest = {
  readonly version: 1;
  readonly plugins: PluginManifestEntry[];
};

export type PluginManifestEntry = {
  readonly name: string;
  readonly source: string;
  readonly path: string;
  readonly enabled: boolean;
};

export type ExportCodexConfigResult = {
  readonly exportedAreas: ManagedArea[];
  readonly skillsManifest: SkillManifest;
  readonly pluginsManifest: PluginManifest;
  readonly unmanagedSkills: string[];
  readonly unmanagedPlugins: string[];
};

export type ApplyCodexConfigResult = {
  readonly appliedAreas: ManagedArea[];
  readonly installedPlugins: InstallCodexPluginResult[];
  readonly syncedPluginCaches: SyncCodexPluginCacheResult[];
  readonly installedSkills: string[];
  readonly unsupportedSkills: string[];
  readonly unsupportedPlugins: string[];
};

export type InstallCodexAssetsResult = {
  readonly installedPlugins: InstallCodexPluginResult[];
  readonly syncedPluginCaches: SyncCodexPluginCacheResult[];
  readonly installedSkills: string[];
  readonly unsupportedSkills: string[];
  readonly unsupportedPlugins: string[];
};

const managedAreas = ['prompts', 'rules'] as const;

type RelativePathFilter = (path: string) => boolean;

const officialSkillsRepository = {
  owner: 'openai',
  repo: 'skills',
  ref: 'main',
} as const;

const officialSkillCollections = ['skills/.curated', 'skills/.experimental'];

function getManagedAreaExclude(
  area: ManagedArea,
): RelativePathFilter | undefined {
  return area === 'prompts' ? isGeneratedPromptAdapter : undefined;
}

function isGeneratedPromptAdapter(relativePath: string): boolean {
  return /^opsx-[a-z0-9-]+\.md$/i.test(relativePath);
}

export async function compareCodexConfig(
  paths: CodexConfigPaths,
): Promise<CodexConfigComparison> {
  return {
    areas: {
      prompts: await compareManagedArea(paths, 'prompts'),
      rules: await compareManagedArea(paths, 'rules'),
    },
    unmanagedSkills: await findUnmanagedSkills(paths),
    unmanagedPlugins: await findUnmanagedPlugins(paths),
    repoPlugins: await findRepoPluginStatuses(paths),
    missingRepoSkills: await findMissingRepoSkills(paths),
    missingRepoPlugins: await findMissingRepoPlugins(paths),
    unsupportedSkills: await findUnsupportedSkills(paths),
    unsupportedPlugins: await findUnsupportedPlugins(paths),
    unsafeRepoPaths: await findUnsafeRepoPaths(paths),
  };
}

export async function exportCodexConfig(
  paths: CodexConfigPaths,
): Promise<ExportCodexConfigResult> {
  const exportedAreas: ManagedArea[] = [];
  for (const area of managedAreas) {
    await mirrorDirectory({
      sourceRoot: join(paths.localCodexRoot, area),
      targetRoot: join(paths.repoCodexRoot, area),
      writeRoot: paths.repoCodexRoot,
      excludeRelativePath: getManagedAreaExclude(area),
    });
    exportedAreas.push(area);
  }

  const skillsManifest = await generateSkillsManifest(paths);
  const pluginsManifest = await generatePluginsManifest(paths);
  const unmanagedSkills = await findUnmanagedSkills(paths, skillsManifest);
  const unmanagedPlugins = await findUnmanagedPlugins(paths, pluginsManifest);
  await writeJsonFile(
    join(paths.repoCodexRoot, 'skills.manifest.json'),
    skillsManifest,
    paths.repoCodexRoot,
  );
  await writeJsonFile(
    join(paths.repoCodexRoot, 'plugins.manifest.json'),
    pluginsManifest,
    paths.repoCodexRoot,
  );

  return {
    exportedAreas,
    skillsManifest,
    pluginsManifest,
    unmanagedSkills,
    unmanagedPlugins,
  };
}

export async function applyCodexConfig(
  paths: CodexConfigPaths,
): Promise<ApplyCodexConfigResult> {
  const appliedAreas: ManagedArea[] = [];
  for (const area of managedAreas) {
    await mirrorDirectory({
      sourceRoot: join(paths.repoCodexRoot, area),
      targetRoot: join(paths.localCodexRoot, area),
      writeRoot: paths.localCodexRoot,
      excludeRelativePath: getManagedAreaExclude(area),
    });
    appliedAreas.push(area);
  }

  const skillsManifest = await readSkillsManifest(paths);
  const skillResult = await applySkillsManifest(paths, {
    version: 1,
    skills: skillsManifest.skills.filter((skill) => skill.source !== 'repo'),
  });
  const pluginsManifest = await readPluginsManifest(paths);
  const pluginResult = await applyPluginsManifest(paths, {
    version: 1,
    plugins: pluginsManifest.plugins.filter(
      (plugin) => plugin.source !== 'repo',
    ),
  });

  return {
    appliedAreas,
    installedPlugins: pluginResult.installed,
    syncedPluginCaches: pluginResult.synced,
    installedSkills: skillResult.installed,
    unsupportedSkills: skillResult.unsupported,
    unsupportedPlugins: pluginResult.unsupported,
  };
}

export async function installCodexAssets(
  paths: CodexConfigPaths,
): Promise<InstallCodexAssetsResult> {
  const repoSkillsManifest = await withRepositorySkills(paths, {
    version: 1,
    skills: (await readSkillsManifest(paths)).skills.filter(
      (skill) => skill.source === 'repo',
    ),
  });
  const skillResult = await applySkillsManifest(paths, repoSkillsManifest);
  const repoPluginsManifest = await withRepositoryPlugins(paths, {
    version: 1,
    plugins: (await readPluginsManifest(paths)).plugins.filter(
      (plugin) => plugin.source === 'repo',
    ),
  });
  const pluginResult = await applyPluginsManifest(paths, repoPluginsManifest);

  return {
    installedPlugins: pluginResult.installed,
    syncedPluginCaches: pluginResult.synced,
    installedSkills: skillResult.installed,
    unsupportedSkills: skillResult.unsupported,
    unsupportedPlugins: pluginResult.unsupported,
  };
}

async function findUnsafeRepoPaths(paths: CodexConfigPaths): Promise<string[]> {
  const unsafe = new Set<string>();
  await walkRepoCodex(paths.repoCodexRoot, async (absolutePath, entry) => {
    const relativePath = toSlash(relative(paths.repoCodexRoot, absolutePath));
    if (entry.isDirectory()) {
      if (isUnsafeDirectory(relativePath)) {
        unsafe.add(relativePath);
      }
      return;
    }

    if (isUnsafeFile(relativePath)) {
      unsafe.add(relativePath);
    }
  });

  return [...unsafe].sort();
}

async function compareManagedArea(
  paths: CodexConfigPaths,
  area: ManagedArea,
): Promise<CodexConfigComparison['areas'][ManagedArea]> {
  const excludeRelativePath = getManagedAreaExclude(area);
  const localFiles = await readFileTree(
    join(paths.localCodexRoot, area),
    excludeRelativePath,
  );
  const repoFiles = await readFileTree(
    join(paths.repoCodexRoot, area),
    excludeRelativePath,
  );
  const names = new Set([...localFiles.keys(), ...repoFiles.keys()]);
  const files: Record<FileState, string[]> = {
    added: [],
    removed: [],
    modified: [],
    unchanged: [],
  };

  for (const name of [...names].sort()) {
    const local = localFiles.get(name);
    const repo = repoFiles.get(name);
    if (local !== undefined && repo === undefined) {
      files.added.push(name);
    } else if (local === undefined && repo !== undefined) {
      files.removed.push(name);
    } else if (local !== repo) {
      files.modified.push(name);
    } else {
      files.unchanged.push(name);
    }
  }

  return {
    counts: {
      added: files.added.length,
      removed: files.removed.length,
      modified: files.modified.length,
      unchanged: files.unchanged.length,
    },
    files,
  };
}

async function readFileTree(
  root: string,
  excludeRelativePath?: RelativePathFilter,
): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  await walkFiles(root, async (path) => {
    const relativePath = toSlash(relative(root, path));
    if (excludeRelativePath?.(relativePath)) {
      return;
    }
    files.set(relativePath, await readFile(path, 'utf8'));
  });
  return files;
}

async function generateSkillsManifest(
  paths: CodexConfigPaths,
): Promise<SkillManifest> {
  const existing = await readSkillsManifest(paths);
  const skills: SkillManifestEntry[] = existing.skills.filter(
    (skill) => skill.source !== 'repo' || skill.enabled === false,
  );
  const existingNames = new Set(skills.map((skill) => skill.name));
  for (const skill of await discoverLocalExternalSkills(paths)) {
    if (!existingNames.has(skill.name)) {
      skills.push(skill);
      existingNames.add(skill.name);
    }
  }
  return {
    version: 1,
    skills: skills.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

async function discoverRepositorySkills(
  paths: CodexConfigPaths,
): Promise<SkillManifestEntry[]> {
  const skillsRoot = join(paths.repoCodexRoot, 'skills');
  const skills: SkillManifestEntry[] = [];
  for (const entry of await readDirectorySafe(skillsRoot)) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) {
      continue;
    }
    skills.push({
      name: entry.name,
      source: 'repo',
      path: `codex/skills/${entry.name}`,
      enabled: true,
    });
  }
  return skills;
}

async function discoverLocalExternalSkills(
  paths: CodexConfigPaths,
): Promise<SkillManifestEntry[]> {
  const skillsRoot = join(paths.localCodexRoot, 'skills');
  const skills: SkillManifestEntry[] = [];
  const repoSkills = new Set(
    (await discoverRepositorySkills(paths)).map((skill) => skill.name),
  );
  for (const entry of await readDirectorySafe(skillsRoot)) {
    if (
      !entry.isDirectory() ||
      entry.name.startsWith('.') ||
      repoSkills.has(entry.name) ||
      !(await isLocalSkillDirectory(paths, entry.name))
    ) {
      continue;
    }
    skills.push({
      name: entry.name,
      source: 'external',
      path: `skill:${entry.name}`,
      enabled: true,
    });
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

async function withRepositorySkills(
  paths: CodexConfigPaths,
  manifest: SkillManifest,
): Promise<SkillManifest> {
  const skills = [...manifest.skills];
  const existingNames = new Set(skills.map((skill) => skill.name));
  for (const skill of await discoverRepositorySkills(paths)) {
    if (!existingNames.has(skill.name)) {
      skills.push(skill);
    }
  }
  return {
    version: 1,
    skills: skills.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

async function generatePluginsManifest(
  paths: CodexConfigPaths,
): Promise<PluginManifest> {
  const existing = await readPluginsManifest(paths);
  const plugins = existing.plugins.filter(
    (plugin) => plugin.source !== 'repo' || plugin.enabled === false,
  );
  const existingNames = new Set(plugins.map((plugin) => plugin.name));
  for (const plugin of await discoverLocalMarketplacePlugins(paths)) {
    if (!existingNames.has(plugin.name)) {
      plugins.push(plugin);
      existingNames.add(plugin.name);
    }
  }
  return {
    version: 1,
    plugins: plugins.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

async function discoverRepositoryPlugins(
  paths: CodexConfigPaths,
): Promise<PluginManifestEntry[]> {
  return (await discoverCodexPlugins(paths.pluginsRoot)).map((plugin) => ({
    name: plugin.name,
    source: 'repo',
    path: toSlash(relative(paths.repoRoot, plugin.root)),
    enabled: true,
  }));
}

async function discoverLocalMarketplacePlugins(
  paths: CodexConfigPaths,
): Promise<PluginManifestEntry[]> {
  const repoPlugins = new Set(
    (await discoverRepositoryPlugins(paths)).map((plugin) => plugin.name),
  );
  return (await readMarketplaceEntries(paths))
    .map((plugin) => plugin.name)
    .filter((name): name is string => typeof name === 'string')
    .filter((name) => !repoPlugins.has(name))
    .map((name) => ({
      name,
      source: 'marketplace',
      path: `marketplace:${name}`,
      enabled: true,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function withRepositoryPlugins(
  paths: CodexConfigPaths,
  manifest: PluginManifest,
): Promise<PluginManifest> {
  const plugins = [...manifest.plugins];
  const existingNames = new Set(plugins.map((plugin) => plugin.name));
  for (const plugin of await discoverRepositoryPlugins(paths)) {
    if (!existingNames.has(plugin.name)) {
      plugins.push(plugin);
    }
  }
  return {
    version: 1,
    plugins: plugins.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

async function findUnmanagedSkills(
  paths: CodexConfigPaths,
  manifest?: SkillManifest,
): Promise<string[]> {
  const resolvedManifest = manifest ?? (await readSkillsManifest(paths));
  const managed = new Set([
    ...resolvedManifest.skills.map((skill) => skill.name),
    ...(await discoverRepositorySkills(paths)).map((skill) => skill.name),
  ]);
  const names: string[] = [];
  for (const entry of await readDirectorySafe(
    join(paths.localCodexRoot, 'skills'),
  )) {
    if (
      entry.isDirectory() &&
      !entry.name.startsWith('.') &&
      !managed.has(entry.name) &&
      (await isLocalSkillDirectory(paths, entry.name))
    ) {
      names.push(entry.name);
    }
  }
  return names.sort();
}

async function findUnmanagedPlugins(
  paths: CodexConfigPaths,
  manifest?: PluginManifest,
): Promise<string[]> {
  const resolvedManifest = manifest ?? (await readPluginsManifest(paths));
  const managed = new Set([
    ...resolvedManifest.plugins.map((plugin) => plugin.name),
    ...(await discoverRepositoryPlugins(paths)).map((plugin) => plugin.name),
  ]);
  try {
    const raw = await readFile(paths.marketplacePath, 'utf8');
    const parsed = JSON.parse(raw) as {
      plugins?: Array<{ name?: unknown }>;
    };
    return (parsed.plugins ?? [])
      .map((plugin) => plugin.name)
      .filter((name): name is string => typeof name === 'string')
      .filter((name) => !managed.has(name))
      .sort();
  } catch {
    return [];
  }
}

async function findMissingRepoSkills(
  paths: CodexConfigPaths,
): Promise<string[]> {
  const manifest = await withRepositorySkills(
    paths,
    await readSkillsManifest(paths),
  );
  const missing: string[] = [];
  for (const skill of manifest.skills) {
    if (
      skill.enabled === false ||
      skill.source !== 'repo' ||
      !isRepoManagedPath(paths, skill.path, 'skills')
    ) {
      continue;
    }

    if (!(await exists(join(paths.localCodexRoot, 'skills', skill.name)))) {
      missing.push(skill.name);
    }
  }
  return missing.sort();
}

async function findMissingRepoPlugins(
  paths: CodexConfigPaths,
): Promise<string[]> {
  const manifest = await withRepositoryPlugins(
    paths,
    await readPluginsManifest(paths),
  );
  const marketplace = await readMarketplaceEntries(paths);
  const enabledPluginIds = await readEnabledCodexPluginIds(
    join(paths.localCodexRoot, 'config.toml'),
  );
  const missing: string[] = [];
  for (const plugin of manifest.plugins) {
    if (
      !plugin.enabled ||
      plugin.source !== 'repo' ||
      !isRepoManagedPath(paths, plugin.path, 'plugins')
    ) {
      continue;
    }

    const expectedRoot = resolve(paths.repoRoot, plugin.path);
    const installed = marketplace.find((entry) => entry.name === plugin.name);
    if (
      !installed?.source?.path ||
      !enabledPluginIds.has(`${plugin.name}@personal`) ||
      !sameResolvedPath(
        resolveMarketplacePath(paths.homeRoot, installed.source.path),
        expectedRoot,
      )
    ) {
      missing.push(plugin.name);
    }
  }
  return missing.sort();
}

async function findRepoPluginStatuses(
  paths: CodexConfigPaths,
): Promise<RepoPluginStatus[]> {
  const manifest = await readPluginsManifest(paths);
  const marketplace = await readMarketplaceEntries(paths);
  const enabledPluginIds = await readEnabledCodexPluginIds(
    join(paths.localCodexRoot, 'config.toml'),
  );
  const entriesByName = new Map(
    manifest.plugins.map((plugin) => [plugin.name, plugin]),
  );
  const statuses: RepoPluginStatus[] = [];

  for (const plugin of await discoverCodexPlugins(paths.pluginsRoot)) {
    const path = toSlash(relative(paths.repoRoot, plugin.root));
    const manifestEntry = entriesByName.get(plugin.name);
    if (manifestEntry?.enabled === false) {
      statuses.push({
        name: plugin.name,
        path,
        status: 'disabled',
      });
      continue;
    }

    const expectedRoot =
      manifestEntry?.source === 'repo' &&
      isRepoManagedPath(paths, manifestEntry.path, 'plugins')
        ? resolve(paths.repoRoot, manifestEntry.path)
        : plugin.root;
    const installed = marketplace.find((entry) => entry.name === plugin.name);
    statuses.push({
      name: plugin.name,
      path,
      status:
        installed?.source?.path &&
        enabledPluginIds.has(`${plugin.name}@personal`) &&
        sameResolvedPath(
          resolveMarketplacePath(paths.homeRoot, installed.source.path),
          expectedRoot,
        )
          ? 'applied'
          : 'not_applied',
    });
  }

  return statuses.sort((a, b) => a.name.localeCompare(b.name));
}

async function findUnsupportedSkills(
  paths: CodexConfigPaths,
): Promise<string[]> {
  const manifest = await readSkillsManifest(paths);
  const unsupported: string[] = [];
  for (const skill of manifest.skills) {
    if (skill.enabled === false || skill.source === 'repo') {
      continue;
    }
    if (
      skill.source === 'external' &&
      ((await isLocalSkillDirectory(paths, skill.name)) ||
        (await findOfficialSkillSource(paths, skill)))
    ) {
      continue;
    }
    unsupported.push(skill.name);
  }
  return unsupported.sort();
}

async function findUnsupportedPlugins(
  paths: CodexConfigPaths,
): Promise<string[]> {
  const manifest = await readPluginsManifest(paths);
  const marketplace = await readMarketplaceEntries(paths);
  const installedMarketplaceNames = new Set(
    marketplace
      .map((plugin) => plugin.name)
      .filter((name): name is string => typeof name === 'string'),
  );
  return manifest.plugins
    .filter(
      (plugin) =>
        plugin.enabled &&
        plugin.source !== 'repo' &&
        !installedMarketplaceNames.has(plugin.name),
    )
    .map((plugin) => plugin.name)
    .sort();
}

async function readMarketplaceEntries(paths: CodexConfigPaths): Promise<
  Array<{
    readonly name?: unknown;
    readonly source?: { readonly path?: unknown };
  }>
> {
  try {
    const raw = await readFile(paths.marketplacePath, 'utf8');
    const parsed = JSON.parse(raw) as {
      plugins?: Array<{
        name?: unknown;
        source?: { path?: unknown };
      }>;
    };
    return Array.isArray(parsed.plugins) ? parsed.plugins : [];
  } catch {
    return [];
  }
}

async function readSkillsManifest(
  paths: CodexConfigPaths,
): Promise<SkillManifest> {
  try {
    const parsed = JSON.parse(
      await readFile(join(paths.repoCodexRoot, 'skills.manifest.json'), 'utf8'),
    ) as SkillManifest;
    return {
      version: 1,
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.map((skill) => ({
            ...skill,
            enabled: skill.enabled !== false,
          }))
        : [],
    };
  } catch {
    return { version: 1, skills: [] };
  }
}

async function readPluginsManifest(
  paths: CodexConfigPaths,
): Promise<PluginManifest> {
  try {
    const parsed = JSON.parse(
      await readFile(
        join(paths.repoCodexRoot, 'plugins.manifest.json'),
        'utf8',
      ),
    ) as PluginManifest;
    return {
      version: 1,
      plugins: Array.isArray(parsed.plugins) ? parsed.plugins : [],
    };
  } catch {
    return { version: 1, plugins: [] };
  }
}

async function applySkillsManifest(
  paths: CodexConfigPaths,
  manifest: SkillManifest,
): Promise<{ installed: string[]; unsupported: string[] }> {
  const installed: string[] = [];
  const unsupported: string[] = [];
  for (const skill of manifest.skills) {
    if (skill.enabled === false) {
      continue;
    }
    if (skill.source === 'external') {
      if (await isLocalSkillDirectory(paths, skill.name)) {
        installed.push(skill.name);
        continue;
      }
      const sourceRoot = await findOfficialSkillSource(paths, skill);
      if (!sourceRoot) {
        if (!(await installOfficialSkill(paths, skill))) {
          unsupported.push(skill.name);
          continue;
        }
        installed.push(skill.name);
        continue;
      }
      const targetRoot = resolve(paths.localCodexRoot, 'skills', skill.name);
      await mirrorDirectory({
        sourceRoot,
        targetRoot,
        writeRoot: paths.localCodexRoot,
      });
      installed.push(skill.name);
      continue;
    }
    if (skill.source !== 'repo') {
      unsupported.push(skill.name);
      continue;
    }
    const sourceRoot = resolve(paths.repoRoot, skill.path);
    const targetRoot = resolve(paths.localCodexRoot, 'skills', skill.name);
    assertPathInside(paths.repoCodexRoot, sourceRoot);
    await mirrorDirectory({
      sourceRoot,
      targetRoot,
      writeRoot: paths.localCodexRoot,
    });
    installed.push(skill.name);
  }
  return { installed, unsupported };
}

async function installOfficialSkill(
  paths: CodexConfigPaths,
  skill: SkillManifestEntry,
): Promise<boolean> {
  const requestedName = getRequestedOfficialSkillName(skill);
  if (!requestedName) {
    return false;
  }

  for (const collection of officialSkillCollections) {
    const sourcePath = `${collection}/${requestedName}`;
    const tempRoot = resolve(
      paths.localCodexRoot,
      '.cthutool-install',
      `${requestedName}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,
    );
    const targetRoot = resolve(paths.localCodexRoot, 'skills', skill.name);
    assertPathInside(paths.localCodexRoot, tempRoot);
    assertPathInside(paths.localCodexRoot, targetRoot);
    try {
      await downloadGitHubDirectory({
        owner: officialSkillsRepository.owner,
        repo: officialSkillsRepository.repo,
        ref: officialSkillsRepository.ref,
        sourcePath,
        sourceRootPath: sourcePath,
        targetRoot: tempRoot,
      });
      if (!(await exists(join(tempRoot, 'SKILL.md')))) {
        await rm(tempRoot, { recursive: true, force: true });
        continue;
      }
      await mirrorDirectory({
        sourceRoot: tempRoot,
        targetRoot,
        writeRoot: paths.localCodexRoot,
      });
      await rm(tempRoot, { recursive: true, force: true });
      return true;
    } catch {
      await rm(tempRoot, { recursive: true, force: true });
    }
  }

  return false;
}

type GitHubContentEntry = {
  readonly type?: unknown;
  readonly path?: unknown;
  readonly download_url?: unknown;
};

async function downloadGitHubDirectory(input: {
  readonly owner: string;
  readonly repo: string;
  readonly ref: string;
  readonly sourcePath: string;
  readonly sourceRootPath: string;
  readonly targetRoot: string;
}): Promise<void> {
  const entries = await fetchGitHubContentEntries(input);
  for (const entry of entries) {
    if (entry.type === 'dir' && typeof entry.path === 'string') {
      await downloadGitHubDirectory({
        ...input,
        sourcePath: entry.path,
      });
      continue;
    }
    if (
      entry.type !== 'file' ||
      typeof entry.path !== 'string' ||
      typeof entry.download_url !== 'string'
    ) {
      continue;
    }

    const relativePath = posix.relative(input.sourceRootPath, entry.path);
    if (
      relativePath.length === 0 ||
      relativePath.startsWith('..') ||
      relativePath.includes('\\')
    ) {
      throw new Error(`Unsafe skill file path from GitHub: ${entry.path}`);
    }
    const outputPath = resolve(input.targetRoot, ...relativePath.split('/'));
    assertPathInside(input.targetRoot, outputPath);
    const response = await fetch(entry.download_url);
    if (!response.ok) {
      throw new Error(`Failed to download ${entry.download_url}`);
    }
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, new Uint8Array(await response.arrayBuffer()));
  }
}

async function fetchGitHubContentEntries(input: {
  readonly owner: string;
  readonly repo: string;
  readonly ref: string;
  readonly sourcePath: string;
}): Promise<GitHubContentEntry[]> {
  const encodedPath = input.sourcePath
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  const url = `https://api.github.com/repos/${input.owner}/${input.repo}/contents/${encodedPath}?ref=${encodeURIComponent(
    input.ref,
  )}`;
  const response = await fetch(url, {
    headers: {
      accept: 'application/vnd.github+json',
      'user-agent': 'cthutool-cli',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub content request failed: ${response.status}`);
  }
  const value = (await response.json()) as unknown;
  if (!Array.isArray(value)) {
    throw new Error(`GitHub content path is not a directory: ${input.sourcePath}`);
  }
  return value as GitHubContentEntry[];
}

async function findOfficialSkillSource(
  paths: CodexConfigPaths,
  skill: SkillManifestEntry,
): Promise<string | undefined> {
  const requestedName = getRequestedOfficialSkillName(skill);
  if (!requestedName) {
    return undefined;
  }

  const candidates = [
    join(
      paths.localCodexRoot,
      'vendor_imports',
      'skills',
      'skills',
      '.curated',
      requestedName,
    ),
    join(
      paths.localCodexRoot,
      'vendor_imports',
      'skills',
      'skills',
      '.experimental',
      requestedName,
    ),
  ];
  for (const candidate of candidates) {
    if (await exists(join(candidate, 'SKILL.md'))) {
      return candidate;
    }
  }
  return undefined;
}

function getRequestedOfficialSkillName(
  skill: SkillManifestEntry,
): string | undefined {
  const requestedName = skill.path.startsWith('skill:')
    ? skill.path.slice('skill:'.length)
    : skill.name;
  if (
    !requestedName ||
    requestedName.includes('/') ||
    requestedName.includes('\\')
  ) {
    return undefined;
  }
  return requestedName;
}

async function applyPluginsManifest(
  paths: CodexConfigPaths,
  manifest: PluginManifest,
): Promise<{
  installed: InstallCodexPluginResult[];
  synced: SyncCodexPluginCacheResult[];
  unsupported: string[];
}> {
  const marketplace = await readMarketplaceEntries(paths);
  const installedMarketplaceNames = new Set(
    marketplace
      .map((plugin) => plugin.name)
      .filter((name): name is string => typeof name === 'string'),
  );
  const unsupported = manifest.plugins
    .filter(
      (plugin) =>
        plugin.enabled &&
        plugin.source !== 'repo' &&
        !installedMarketplaceNames.has(plugin.name),
    )
    .map((plugin) => plugin.name);
  const enabled = manifest.plugins.filter(
    (plugin) => plugin.enabled && plugin.source === 'repo',
  );
  const plugins = await Promise.all(
    enabled.map(async (plugin) => {
      const root = resolve(paths.repoRoot, plugin.path);
      assertPathInside(paths.repoCodexRoot, root);
      const metadata = await readPluginMetadata(root);
      return {
        name: plugin.name,
        displayName: metadata.displayName,
        root,
        marketplacePath: '',
      };
    }),
  );

  const installed = await installCodexPlugins({
    homeRoot: paths.homeRoot,
    configPath: join(paths.localCodexRoot, 'config.toml'),
    marketplacePath: paths.marketplacePath,
    plugins,
    selectedNames: enabled.map((plugin) => plugin.name),
  });
  const synced = await Promise.all(
    plugins.map((plugin) =>
      syncCodexPluginCache({
        cacheRoot: paths.cacheRoot,
        plugin,
      }),
    ),
  );
  return { installed, synced, unsupported };
}

async function readPluginMetadata(
  pluginRoot: string,
): Promise<{ displayName: string }> {
  try {
    const raw = await readFile(
      join(pluginRoot, '.codex-plugin', 'plugin.json'),
      'utf8',
    );
    const parsed = JSON.parse(raw) as {
      interface?: { displayName?: unknown };
    };
    return {
      displayName:
        typeof parsed.interface?.displayName === 'string'
          ? parsed.interface.displayName
          : basename(pluginRoot),
    };
  } catch {
    return { displayName: basename(pluginRoot) };
  }
}

async function mirrorDirectory(input: {
  readonly sourceRoot: string;
  readonly targetRoot: string;
  readonly writeRoot: string;
  readonly excludeRelativePath?: RelativePathFilter;
}): Promise<void> {
  const targetRoot = resolve(input.targetRoot);
  assertPathInside(input.writeRoot, targetRoot);
  if (input.excludeRelativePath) {
    await mirrorDirectoryWithExcludes({
      ...input,
      targetRoot,
      excludeRelativePath: input.excludeRelativePath,
    });
    return;
  }

  await rm(targetRoot, { recursive: true, force: true });
  if (!(await exists(input.sourceRoot))) {
    return;
  }
  await mkdir(dirname(targetRoot), { recursive: true });
  await cp(input.sourceRoot, targetRoot, { recursive: true, force: true });
}

async function mirrorDirectoryWithExcludes(input: {
  readonly sourceRoot: string;
  readonly targetRoot: string;
  readonly writeRoot: string;
  readonly excludeRelativePath: RelativePathFilter;
}): Promise<void> {
  await walkFiles(input.targetRoot, async (path) => {
    const relativePath = toSlash(relative(input.targetRoot, path));
    if (input.excludeRelativePath(relativePath)) {
      return;
    }
    assertPathInside(input.writeRoot, path);
    await rm(path, { force: true });
  });

  if (!(await exists(input.sourceRoot))) {
    return;
  }

  await walkFiles(input.sourceRoot, async (sourcePath) => {
    const relativePath = toSlash(relative(input.sourceRoot, sourcePath));
    if (input.excludeRelativePath(relativePath)) {
      return;
    }

    const targetPath = resolve(input.targetRoot, relativePath);
    assertPathInside(input.writeRoot, targetPath);
    await mkdir(dirname(targetPath), { recursive: true });
    await rm(targetPath, { recursive: true, force: true });
    await cp(sourcePath, targetPath, { force: true });
  });
}

async function writeJsonFile(
  path: string,
  value: unknown,
  writeRoot: string,
): Promise<void> {
  assertPathInside(writeRoot, path);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function walkFiles(
  root: string,
  visit: (path: string) => Promise<void>,
): Promise<void> {
  for (const entry of await readDirectorySafe(root)) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(path, visit);
    } else if (entry.isFile()) {
      await visit(path);
    }
  }
}

async function walkRepoCodex(
  root: string,
  visit: (path: string, entry: Dirent) => Promise<void>,
): Promise<void> {
  for (const entry of await readDirectorySafe(root)) {
    const path = join(root, entry.name);
    await visit(path, entry);
    if (entry.isDirectory()) {
      await walkRepoCodex(path, visit);
    }
  }
}

async function readDirectorySafe(path: string): Promise<Dirent[]> {
  try {
    return await readdir(path, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function isLocalSkillDirectory(
  paths: CodexConfigPaths,
  name: string,
): Promise<boolean> {
  return exists(join(paths.localCodexRoot, 'skills', name, 'SKILL.md'));
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function isUnsafeFile(relativePath: string): boolean {
  const name = basename(relativePath);
  return (
    name === 'auth.json' ||
    name === 'cap_sid' ||
    name === 'config.toml' ||
    name.endsWith('.sqlite') ||
    name.endsWith('.sqlite-shm') ||
    name.endsWith('.sqlite-wal')
  );
}

function isUnsafeDirectory(relativePath: string): boolean {
  return [
    'cache',
    'plugins/cache',
    'logs',
    'log',
    'tmp',
    '.tmp',
    'sessions',
    'archived_sessions',
    'memories',
  ].includes(relativePath);
}

function isRepoManagedPath(
  paths: CodexConfigPaths,
  path: string,
  area: 'skills' | 'plugins',
): boolean {
  const sourceRoot = resolve(paths.repoRoot, path);
  try {
    assertPathInside(join(paths.repoCodexRoot, area), sourceRoot);
    return true;
  } catch {
    return false;
  }
}

function resolveMarketplacePath(homeRoot: string, path: unknown): string {
  if (typeof path !== 'string' || path.trim().length === 0) {
    return '';
  }

  if (path.startsWith('./')) {
    return resolve(homeRoot, path.slice(2));
  }

  return resolve(path);
}

function sameResolvedPath(left: string, right: string): boolean {
  return resolve(left).toLowerCase() === resolve(right).toLowerCase();
}

function toSlash(path: string): string {
  return path.replaceAll('\\', '/');
}
