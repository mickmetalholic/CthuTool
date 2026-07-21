import { readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import type { CodexConfigPaths } from '../infra/codex-config-paths';
import { assertPathInside } from '../infra/codex-config-paths';
import {
  discoverCodexPlugins,
  type InstallCodexPluginResult,
  installCodexPlugins,
  type SyncCodexPluginCacheResult,
  syncCodexPluginCache,
} from './codex-plugin-manager';

export type PluginManifestEntry = {
  readonly name: string;
  readonly source: string;
  readonly path: string;
  readonly enabled: boolean;
};

export type PluginManifest = {
  readonly version: 1;
  readonly plugins: PluginManifestEntry[];
};

export type InstallRepositoryCodexPluginsResult = {
  readonly installedPlugins: InstallCodexPluginResult[];
  readonly syncedPluginCaches: SyncCodexPluginCacheResult[];
};

export async function installRepositoryCodexPlugins(
  paths: CodexConfigPaths,
): Promise<InstallRepositoryCodexPluginsResult> {
  const manifest = await readPluginManifest(paths.repoCodexRoot);
  const discovered = await discoverCodexPlugins(paths.pluginsRoot);
  const disabledNames = new Set(
    manifest.plugins
      .filter((plugin) => plugin.enabled === false)
      .map((plugin) => plugin.name),
  );
  const configured = manifest.plugins.filter(
    (plugin) => plugin.enabled && plugin.source === 'repo',
  );
  const configuredNames = new Set(configured.map((plugin) => plugin.name));

  const plugins = await Promise.all([
    ...configured.map(async (entry) => {
      const root = resolve(paths.repoRoot, entry.path);
      assertPathInside(paths.repoCodexRoot, root);
      return {
        name: entry.name,
        displayName: await readPluginDisplayName(root),
        root,
        marketplacePath: '',
      };
    }),
    ...discovered.filter(
      (plugin) =>
        !configuredNames.has(plugin.name) && !disabledNames.has(plugin.name),
    ),
  ]);
  const selectedNames = plugins.map((plugin) => plugin.name);
  const installedPlugins = await installCodexPlugins({
    homeRoot: paths.homeRoot,
    configPath: join(paths.localCodexRoot, 'config.toml'),
    marketplacePath: paths.marketplacePath,
    plugins,
    selectedNames,
  });
  const syncedPluginCaches = await Promise.all(
    plugins.map((plugin) =>
      syncCodexPluginCache({ cacheRoot: paths.cacheRoot, plugin }),
    ),
  );
  return { installedPlugins, syncedPluginCaches };
}

export async function readPluginManifest(
  repoCodexRoot: string,
): Promise<PluginManifest> {
  const path = join(repoCodexRoot, 'plugins.manifest.json');
  try {
    const value = JSON.parse(await readFile(path, 'utf8')) as unknown;
    if (
      !isRecord(value) ||
      value.version !== 1 ||
      !Array.isArray(value.plugins)
    ) {
      throw new Error('expected version 1 and a plugins array');
    }
    return {
      version: 1,
      plugins: value.plugins.map((entry, index) =>
        validatePluginManifestEntry(entry, index),
      ),
    };
  } catch (error) {
    if (isMissingFileError(error)) {
      return { version: 1, plugins: [] };
    }
    throw new Error(`Invalid Codex plugins manifest: ${path}`, {
      cause: error,
    });
  }
}

function validatePluginManifestEntry(
  value: unknown,
  index: number,
): PluginManifestEntry {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    typeof value.source !== 'string' ||
    typeof value.path !== 'string' ||
    typeof value.enabled !== 'boolean'
  ) {
    throw new Error(`Invalid Codex plugin manifest entry at index ${index}.`);
  }
  return {
    name: value.name,
    source: value.source,
    path: value.path,
    enabled: value.enabled,
  };
}

async function readPluginDisplayName(root: string): Promise<string> {
  try {
    const value = JSON.parse(
      await readFile(join(root, '.codex-plugin', 'plugin.json'), 'utf8'),
    ) as { interface?: { displayName?: unknown } };
    return typeof value.interface?.displayName === 'string'
      ? value.interface.displayName
      : basename(root);
  } catch {
    return basename(root);
  }
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
