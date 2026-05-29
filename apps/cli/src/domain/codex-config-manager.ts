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
import { basename, dirname, join, relative, resolve } from 'node:path';
import {
  assertPathInside,
  type CodexConfigPaths,
} from '../infra/codex-config-paths';
import {
  discoverCodexPlugins,
  type InstallCodexPluginResult,
  installCodexPlugins,
} from './codex-plugin-manager';

type ManagedArea = 'prompts' | 'rules';

type FileState = 'added' | 'removed' | 'modified' | 'unchanged';

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
  readonly configTomlReadOnly: boolean;
};

export type SkillManifest = {
  readonly version: 1;
  readonly skills: SkillManifestEntry[];
};

export type SkillManifestEntry = {
  readonly name: string;
  readonly source: string;
  readonly path: string;
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
};

export type ApplyCodexConfigResult = {
  readonly appliedAreas: ManagedArea[];
  readonly installedPlugins: InstallCodexPluginResult[];
  readonly installedSkills: string[];
  readonly unsupportedSkills: string[];
};

export type DoctorCodexRepoResult = {
  readonly ok: boolean;
  readonly unsafePaths: string[];
};

const managedAreas = ['prompts', 'rules'] as const;

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
    configTomlReadOnly:
      (await exists(join(paths.localCodexRoot, 'config.toml'))) ||
      (await exists(join(paths.repoCodexRoot, 'config.toml'))),
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
    });
    exportedAreas.push(area);
  }

  const skillsManifest = await generateSkillsManifest(paths);
  const pluginsManifest = await generatePluginsManifest(paths);
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

  return { exportedAreas, skillsManifest, pluginsManifest };
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
    });
    appliedAreas.push(area);
  }

  const skillsManifest = await readSkillsManifest(paths);
  const skillResult = await applySkillsManifest(paths, skillsManifest);
  const pluginsManifest = await readPluginsManifest(paths);
  const installedPlugins = await applyPluginsManifest(paths, pluginsManifest);

  return {
    appliedAreas,
    installedPlugins,
    installedSkills: skillResult.installed,
    unsupportedSkills: skillResult.unsupported,
  };
}

export async function doctorCodexRepo(
  paths: CodexConfigPaths,
): Promise<DoctorCodexRepoResult> {
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

  const unsafePaths = [...unsafe].sort();
  return {
    ok: unsafePaths.length === 0,
    unsafePaths,
  };
}

async function compareManagedArea(
  paths: CodexConfigPaths,
  area: ManagedArea,
): Promise<CodexConfigComparison['areas'][ManagedArea]> {
  const localFiles = await readFileTree(join(paths.localCodexRoot, area));
  const repoFiles = await readFileTree(join(paths.repoCodexRoot, area));
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

async function readFileTree(root: string): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  await walkFiles(root, async (path) => {
    files.set(toSlash(relative(root, path)), await readFile(path, 'utf8'));
  });
  return files;
}

async function generateSkillsManifest(
  paths: CodexConfigPaths,
): Promise<SkillManifest> {
  const skillsRoot = join(paths.localCodexRoot, 'skills');
  const skills: SkillManifestEntry[] = [];
  for (const entry of await readDirectorySafe(skillsRoot)) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) {
      continue;
    }
    skills.push({
      name: entry.name,
      source: 'local',
      path: `.codex/skills/${entry.name}`,
    });
  }
  return {
    version: 1,
    skills: skills.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

async function generatePluginsManifest(
  paths: CodexConfigPaths,
): Promise<PluginManifest> {
  const plugins = await discoverCodexPlugins(paths.pluginsRoot);
  return {
    version: 1,
    plugins: plugins.map((plugin) => ({
      name: plugin.name,
      source: 'local',
      path: toSlash(relative(paths.repoRoot, plugin.root)),
      enabled: true,
    })),
  };
}

async function findUnmanagedSkills(paths: CodexConfigPaths): Promise<string[]> {
  const manifest = await readSkillsManifest(paths);
  const managed = new Set(manifest.skills.map((skill) => skill.name));
  const names: string[] = [];
  for (const entry of await readDirectorySafe(
    join(paths.localCodexRoot, 'skills'),
  )) {
    if (
      entry.isDirectory() &&
      !entry.name.startsWith('.') &&
      !managed.has(entry.name)
    ) {
      names.push(entry.name);
    }
  }
  return names.sort();
}

async function findUnmanagedPlugins(
  paths: CodexConfigPaths,
): Promise<string[]> {
  const manifest = await readPluginsManifest(paths);
  const managed = new Set(manifest.plugins.map((plugin) => plugin.name));
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

async function readSkillsManifest(
  paths: CodexConfigPaths,
): Promise<SkillManifest> {
  try {
    const parsed = JSON.parse(
      await readFile(join(paths.repoCodexRoot, 'skills.manifest.json'), 'utf8'),
    ) as SkillManifest;
    return {
      version: 1,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
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
    if (skill.source !== 'local') {
      unsupported.push(skill.name);
      continue;
    }
    const sourceRoot = resolve(paths.repoRoot, skill.path);
    const targetRoot = resolve(paths.localCodexRoot, 'skills', skill.name);
    assertPathInside(paths.repoRoot, sourceRoot);
    await mirrorDirectory({
      sourceRoot,
      targetRoot,
      writeRoot: paths.localCodexRoot,
    });
    installed.push(skill.name);
  }
  return { installed, unsupported };
}

async function applyPluginsManifest(
  paths: CodexConfigPaths,
  manifest: PluginManifest,
): Promise<InstallCodexPluginResult[]> {
  const enabled = manifest.plugins.filter(
    (plugin) => plugin.enabled && plugin.source === 'local',
  );
  const plugins = await Promise.all(
    enabled.map(async (plugin) => {
      const root = resolve(paths.repoRoot, plugin.path);
      assertPathInside(paths.repoRoot, root);
      const metadata = await readPluginMetadata(root);
      return {
        name: plugin.name,
        displayName: metadata.displayName,
        root,
        marketplacePath: '',
      };
    }),
  );

  return installCodexPlugins({
    homeRoot: paths.homeRoot,
    marketplacePath: paths.marketplacePath,
    plugins,
    selectedNames: enabled.map((plugin) => plugin.name),
  });
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
}): Promise<void> {
  const targetRoot = resolve(input.targetRoot);
  assertPathInside(input.writeRoot, targetRoot);
  await rm(targetRoot, { recursive: true, force: true });
  if (!(await exists(input.sourceRoot))) {
    return;
  }
  await mkdir(dirname(targetRoot), { recursive: true });
  await cp(input.sourceRoot, targetRoot, { recursive: true, force: true });
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
  ].includes(relativePath);
}

function toSlash(path: string): string {
  return path.replaceAll('\\', '/');
}
