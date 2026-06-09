import type { Dirent } from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

export type CodexPlugin = {
  readonly name: string;
  readonly displayName: string;
  readonly root: string;
  readonly marketplacePath: string;
};

export type CodexMarketplaceEntry = {
  name: string;
  source: {
    source: 'local';
    path: string;
  };
  policy: {
    installation: 'AVAILABLE' | 'NOT_AVAILABLE' | 'INSTALLED_BY_DEFAULT';
    authentication: 'ON_INSTALL' | 'ON_USE';
  };
  category: string;
};

export type CodexMarketplace = {
  name: string;
  interface?: {
    displayName?: string;
  };
  plugins: CodexMarketplaceEntry[];
};

export type CodexPluginRow = {
  readonly name: string;
  readonly displayName: string;
  readonly status: 'installed' | 'installed_elsewhere' | 'not_installed';
  readonly installedPath?: string;
  readonly targetPath: string;
};

export type InstallCodexPluginsOptions = {
  readonly homeRoot: string;
  readonly configPath: string;
  readonly marketplacePath: string;
  readonly plugins: ReadonlyArray<CodexPlugin>;
  readonly selectedNames: ReadonlyArray<string>;
};

export type InstallCodexPluginResult = {
  readonly name: string;
  readonly action: 'installed' | 'updated';
};

export type SyncCodexPluginCacheOptions = {
  readonly cacheRoot: string;
  readonly plugin: CodexPlugin;
  readonly bumpPatch?: boolean;
};

export type SyncCodexPluginCacheResult = {
  readonly name: string;
  readonly version: string;
  readonly action: 'synced';
};

export async function discoverCodexPlugins(
  pluginsRoot: string,
): Promise<CodexPlugin[]> {
  let entries: Dirent[];
  try {
    entries = await readdir(pluginsRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const plugins: CodexPlugin[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const root = resolve(pluginsRoot, entry.name);
    const manifest = await readPluginManifest(root);
    if (!manifest?.name) {
      continue;
    }

    plugins.push({
      name: manifest.name,
      displayName: manifest.displayName ?? manifest.name,
      root,
      marketplacePath: '',
    });
  }

  return plugins.sort((a, b) => a.name.localeCompare(b.name));
}

export async function readMarketplace(
  marketplacePath: string,
): Promise<CodexMarketplace> {
  try {
    const raw = await readFile(marketplacePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<CodexMarketplace>;
    return {
      name: typeof parsed.name === 'string' ? parsed.name : 'personal',
      interface:
        parsed.interface && typeof parsed.interface === 'object'
          ? parsed.interface
          : { displayName: 'Personal' },
      plugins: Array.isArray(parsed.plugins) ? parsed.plugins : [],
    };
  } catch {
    return {
      name: 'personal',
      interface: { displayName: 'Personal' },
      plugins: [],
    };
  }
}

export function buildPluginRows(
  plugins: ReadonlyArray<CodexPlugin>,
  marketplace: CodexMarketplace,
): CodexPluginRow[] {
  return plugins.map((plugin) => {
    const installed = marketplace.plugins.find((p) => p.name === plugin.name);
    const installedPath = installed?.source?.path;
    const targetPath = plugin.marketplacePath;
    if (!installedPath) {
      return {
        name: plugin.name,
        displayName: plugin.displayName,
        status: 'not_installed',
        targetPath,
      };
    }

    return {
      name: plugin.name,
      displayName: plugin.displayName,
      status:
        installedPath === targetPath ? 'installed' : 'installed_elsewhere',
      installedPath,
      targetPath,
    };
  });
}

export async function installCodexPlugins(
  options: InstallCodexPluginsOptions,
): Promise<InstallCodexPluginResult[]> {
  const plugins = options.plugins.map((plugin) => ({
    ...plugin,
    marketplacePath:
      plugin.marketplacePath ||
      toHomeRelativeMarketplacePath(plugin.root, options.homeRoot),
  }));
  const marketplace = await readMarketplace(options.marketplacePath);
  const results: InstallCodexPluginResult[] = [];

  for (const plugin of plugins) {
    if (!options.selectedNames.includes(plugin.name)) {
      continue;
    }

    const existing = marketplace.plugins.find((p) => p.name === plugin.name);
    const entry = createMarketplaceEntry(plugin);
    if (existing) {
      existing.source = entry.source;
      existing.policy = entry.policy;
      existing.category = entry.category;
      results.push({ name: plugin.name, action: 'updated' });
    } else {
      marketplace.plugins.push(entry);
      results.push({ name: plugin.name, action: 'installed' });
    }
  }

  await mkdir(dirname(options.marketplacePath), { recursive: true });
  await writeFile(
    options.marketplacePath,
    `${JSON.stringify(marketplace, null, 2)}\n`,
    'utf8',
  );
  await enableCodexPlugins(
    options.configPath,
    results.map((result) => `${result.name}@personal`),
  );
  return results;
}

export async function readEnabledCodexPluginIds(
  configPath: string,
): Promise<Set<string>> {
  let raw: string;
  try {
    raw = await readFile(configPath, 'utf8');
  } catch {
    return new Set();
  }

  const enabled = new Set<string>();
  let currentPlugin: string | undefined;
  for (const line of raw.split(/\r?\n/)) {
    const section = /^\s*\[plugins\."([^"]+)"\]\s*$/.exec(line);
    if (section) {
      currentPlugin = section[1];
      continue;
    }
    if (/^\s*\[/.test(line)) {
      currentPlugin = undefined;
      continue;
    }
    if (currentPlugin && /^\s*enabled\s*=\s*true\s*$/.test(line)) {
      enabled.add(currentPlugin);
    }
  }
  return enabled;
}

export function withMarketplacePaths(
  plugins: ReadonlyArray<CodexPlugin>,
  homeRoot: string,
): CodexPlugin[] {
  return plugins.map((plugin) => ({
    ...plugin,
    marketplacePath: toHomeRelativeMarketplacePath(plugin.root, homeRoot),
  }));
}

export async function syncCodexPluginCache(
  options: SyncCodexPluginCacheOptions,
): Promise<SyncCodexPluginCacheResult> {
  const version = options.bumpPatch
    ? await bumpPluginPatchVersion(options.plugin.root)
    : await readPluginVersion(options.plugin.root);
  const cacheRoot = resolve(options.cacheRoot);
  const pluginCacheRoot = resolve(cacheRoot, options.plugin.name);
  const versionCacheRoot = resolve(pluginCacheRoot, version);

  assertPathInside(cacheRoot, pluginCacheRoot);
  assertPathInside(pluginCacheRoot, versionCacheRoot);

  await mkdir(cacheRoot, { recursive: true });
  await rm(pluginCacheRoot, { recursive: true, force: true });
  await mkdir(pluginCacheRoot, { recursive: true });
  await cp(options.plugin.root, versionCacheRoot, {
    recursive: true,
    force: true,
  });
  await normalizePluginHookCommands(versionCacheRoot, options.plugin.root);
  await normalizePluginMcpServers(versionCacheRoot);

  return {
    name: options.plugin.name,
    version,
    action: 'synced',
  };
}

function createMarketplaceEntry(plugin: CodexPlugin): CodexMarketplaceEntry {
  return {
    name: plugin.name,
    source: {
      source: 'local',
      path: plugin.marketplacePath,
    },
    policy: {
      installation: 'AVAILABLE',
      authentication: 'ON_INSTALL',
    },
    category: 'Productivity',
  };
}

function toHomeRelativeMarketplacePath(
  pluginRoot: string,
  homeRoot: string,
): string {
  const absolutePluginRoot = resolve(pluginRoot);
  const absoluteHomeRoot = resolve(homeRoot);
  const homeRelative = relative(absoluteHomeRoot, absolutePluginRoot);

  if (!homeRelative.startsWith('..') && !isAbsolute(homeRelative)) {
    return `./${homeRelative.replaceAll('\\', '/')}`;
  }

  return absolutePluginRoot.replaceAll('\\', '/');
}

async function bumpPluginPatchVersion(pluginRoot: string): Promise<string> {
  const manifestPath = resolve(pluginRoot, '.codex-plugin', 'plugin.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
    version?: unknown;
  };
  const nextVersion = incrementPatchVersion(
    typeof manifest.version === 'string' ? manifest.version : '0.0.0',
  );
  manifest.version = nextVersion;
  await writeJsonFile(manifestPath, manifest);

  const packageJsonPath = resolve(pluginRoot, 'package.json');
  try {
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
      version?: unknown;
    };
    packageJson.version = nextVersion;
    await writeJsonFile(packageJsonPath, packageJson);
  } catch {
    // Plugin package.json is optional for Codex; the manifest version is source of truth.
  }

  return nextVersion;
}

function incrementPatchVersion(version: string): string {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Unsupported plugin version: ${version}`);
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]) + 1;
  return `${major}.${minor}.${patch}`;
}

async function readPluginVersion(pluginRoot: string): Promise<string> {
  const raw = await readFile(
    resolve(pluginRoot, '.codex-plugin', 'plugin.json'),
    'utf8',
  );
  const parsed = JSON.parse(raw) as { version?: unknown };
  if (typeof parsed.version !== 'string' || parsed.version.trim() === '') {
    throw new Error(`Plugin manifest is missing a version: ${pluginRoot}`);
  }
  return parsed.version;
}

async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function enableCodexPlugins(
  configPath: string,
  pluginIds: ReadonlyArray<string>,
): Promise<void> {
  if (pluginIds.length === 0) {
    return;
  }

  let raw: string;
  try {
    raw = await readFile(configPath, 'utf8');
  } catch {
    raw = '';
  }

  let lines = raw.length > 0 ? raw.split(/\r?\n/) : [];
  if (lines.length > 0 && lines.at(-1) === '') {
    lines = lines.slice(0, -1);
  }

  for (const pluginId of pluginIds) {
    lines = upsertEnabledPluginSection(lines, pluginId);
  }

  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${lines.join('\n')}\n`, 'utf8');
}

function upsertEnabledPluginSection(
  lines: string[],
  pluginId: string,
): string[] {
  const heading = `[plugins."${escapeTomlString(pluginId)}"]`;
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return [
      ...lines,
      ...(lines.length > 0 ? [''] : []),
      heading,
      'enabled = true',
    ];
  }

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^\s*\[/.test(lines[index] ?? '')) {
      end = index;
      break;
    }
  }

  const enabledIndex = lines.findIndex(
    (line, index) =>
      index > start && index < end && /^\s*enabled\s*=/.test(line),
  );
  const next = [...lines];
  if (enabledIndex === -1) {
    next.splice(start + 1, 0, 'enabled = true');
  } else {
    next[enabledIndex] = 'enabled = true';
  }
  return next;
}

function escapeTomlString(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

async function normalizePluginHookCommands(
  runtimePluginRoot: string,
  sourcePluginRoot: string,
): Promise<void> {
  const hooksPath = resolve(runtimePluginRoot, 'hooks', 'hooks.json');
  let raw: string;
  try {
    raw = await readFile(hooksPath, 'utf8');
  } catch {
    return;
  }

  const normalizedRoot = resolve(sourcePluginRoot).replaceAll('\\', '/');
  await writeFile(
    hooksPath,
    raw.replaceAll('<PLUGIN_ROOT>', normalizedRoot),
    'utf8',
  );
}

async function normalizePluginMcpServers(
  runtimePluginRoot: string,
): Promise<void> {
  const mcpPath = resolve(runtimePluginRoot, '.mcp.json');
  let raw: string;
  try {
    raw = await readFile(mcpPath, 'utf8');
  } catch {
    return;
  }

  const parsed = JSON.parse(raw) as {
    mcpServers?: Record<string, unknown>;
  };
  if (!parsed.mcpServers || typeof parsed.mcpServers !== 'object') {
    return;
  }

  const normalizedRoot = resolve(runtimePluginRoot).replaceAll('\\', '/');
  let changed = false;
  for (const [name, server] of Object.entries(parsed.mcpServers)) {
    if (!server || typeof server !== 'object' || Array.isArray(server)) {
      continue;
    }

    const normalizedServer = server as Record<string, unknown>;
    if (typeof normalizedServer.cwd !== 'string') {
      normalizedServer.cwd = normalizedRoot;
      changed = true;
    } else if (normalizedServer.cwd.includes('<PLUGIN_ROOT>')) {
      normalizedServer.cwd = normalizedServer.cwd.replaceAll(
        '<PLUGIN_ROOT>',
        normalizedRoot,
      );
      changed = true;
    }

    parsed.mcpServers[name] = normalizedServer;
  }

  if (changed) {
    await writeJsonFile(mcpPath, parsed);
  }
}

function assertPathInside(parent: string, child: string): void {
  const parentPath = resolve(parent);
  const childPath = resolve(child);
  const childRelative = relative(parentPath, childPath);

  if (childRelative.startsWith('..') || isAbsolute(childRelative)) {
    throw new Error(`Refusing to write outside ${parentPath}: ${childPath}`);
  }
}

async function readPluginManifest(
  pluginRoot: string,
): Promise<{ name: string; displayName?: string } | undefined> {
  try {
    const raw = await readFile(
      resolve(pluginRoot, '.codex-plugin', 'plugin.json'),
      'utf8',
    );
    const parsed = JSON.parse(raw) as {
      name?: unknown;
      interface?: { displayName?: unknown };
    };
    if (typeof parsed.name !== 'string' || parsed.name.trim().length === 0) {
      return undefined;
    }

    const displayName = parsed.interface?.displayName;
    return {
      name: parsed.name,
      displayName: typeof displayName === 'string' ? displayName : undefined,
    };
  } catch {
    return undefined;
  }
}
