import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { assertPathInside } from '../infra/codex-config-paths';
import type { CodexPlugin } from './codex-plugin-manager';

export type OpenCodeConfig = Record<string, unknown>;

export type OpenCodeSkillPathResult = {
  readonly configPath: string;
  readonly paths: string[];
  readonly plugins: Array<{
    readonly name: string;
    readonly paths: string[];
  }>;
  readonly changed: boolean;
};

export type OpenCodeMcpResult = {
  readonly configPath: string;
  readonly servers: Array<{
    readonly name: string;
    readonly plugin: string;
  }>;
  readonly changed: boolean;
};

type RecordValue = Record<string, unknown>;

export async function syncOpenCodeSkillPaths(input: {
  readonly configPath: string;
  readonly plugins: readonly CodexPlugin[];
}): Promise<OpenCodeSkillPathResult> {
  const plugins: OpenCodeSkillPathResult['plugins'] = [];
  const paths: string[] = [];

  for (const plugin of input.plugins) {
    const pluginPaths = await readPluginSkillPaths(plugin);
    if (pluginPaths.length === 0) {
      continue;
    }
    plugins.push({ name: plugin.name, paths: pluginPaths });
    paths.push(...pluginPaths);
  }

  const config = await readOpenCodeConfig(input.configPath);
  const currentSkills = readOptionalRecord(config.skills, 'skills');
  const currentPaths = readOptionalStringArray(
    currentSkills?.paths,
    'skills.paths',
  );
  const nextPaths = uniqueStrings([...currentPaths, ...paths]);
  const changed = !sameStringArray(currentPaths, nextPaths);

  if (changed) {
    config.skills = { ...(currentSkills ?? {}), paths: nextPaths };
    await writeOpenCodeConfig(input.configPath, config);
  }

  return {
    configPath: input.configPath,
    paths: nextPaths,
    plugins,
    changed,
  };
}

export async function syncOpenCodeMcpServers(input: {
  readonly configPath: string;
  readonly plugins: readonly CodexPlugin[];
}): Promise<OpenCodeMcpResult> {
  const servers = new Map<
    string,
    { readonly plugin: string; readonly value: RecordValue }
  >();

  for (const plugin of input.plugins) {
    const pluginServers = await readPluginMcpServers(plugin);
    for (const [name, value] of Object.entries(pluginServers)) {
      const previous = servers.get(name);
      if (
        previous &&
        JSON.stringify(previous.value) !== JSON.stringify(value)
      ) {
        throw new Error(
          `MCP server name collision for "${name}" between ${previous.plugin} and ${plugin.name}.`,
        );
      }
      servers.set(name, { plugin: plugin.name, value });
    }
  }

  const config = await readOpenCodeConfig(input.configPath);
  const currentMcp = readOptionalRecord(config.mcp, 'mcp');
  const nextMcp = { ...(currentMcp ?? {}) };
  let changed = false;
  const resultServers: OpenCodeMcpResult['servers'] = [];

  for (const [name, entry] of servers) {
    resultServers.push({ name, plugin: entry.plugin });
    if (JSON.stringify(nextMcp[name]) !== JSON.stringify(entry.value)) {
      nextMcp[name] = entry.value;
      changed = true;
    }
  }

  if (changed) {
    config.mcp = nextMcp;
    await writeOpenCodeConfig(input.configPath, config);
  }

  return {
    configPath: input.configPath,
    servers: resultServers,
    changed,
  };
}

export async function readOpenCodeConfig(
  configPath: string,
): Promise<OpenCodeConfig> {
  let raw: string;
  try {
    raw = await readFile(configPath, 'utf8');
  } catch (error) {
    if (isMissingFileError(error)) {
      return {};
    }
    throw error;
  }

  try {
    const value = JSON.parse(parseJsonc(raw)) as unknown;
    if (!isRecord(value)) {
      throw new Error('expected a JSON object');
    }
    return value;
  } catch (error) {
    throw new Error(`Invalid OpenCode config JSON: ${configPath}`, {
      cause: error,
    });
  }
}

export async function writeOpenCodeConfig(
  configPath: string,
  config: OpenCodeConfig,
): Promise<void> {
  const path = resolve(configPath);
  const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(
      temporaryPath,
      `${JSON.stringify(config, null, 2)}\n`,
      'utf8',
    );
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

async function readPluginSkillPaths(plugin: CodexPlugin): Promise<string[]> {
  const manifest = await readPluginJson(plugin);
  const declared = manifest.skills;
  const candidates =
    typeof declared === 'string'
      ? [declared]
      : Array.isArray(declared)
        ? declared.filter((value): value is string => typeof value === 'string')
        : [];

  return candidates.map((candidate) => {
    const path = resolve(plugin.root, candidate);
    assertPathInside(plugin.root, path);
    return path;
  });
}

async function readPluginMcpServers(
  plugin: CodexPlugin,
): Promise<Record<string, RecordValue>> {
  const path = resolve(plugin.root, '.mcp.json');
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(path, 'utf8')) as unknown;
  } catch (error) {
    if (isMissingFileError(error)) {
      return {};
    }
    throw new Error(`Invalid plugin MCP config JSON: ${path}`, {
      cause: error,
    });
  }

  if (!isRecord(parsed) || parsed.mcpServers === undefined) {
    return {};
  }
  const sourceServers = readRecord(parsed.mcpServers, 'mcpServers');
  return Object.fromEntries(
    Object.entries(sourceServers).map(([name, value]) => [
      name,
      renderOpenCodeMcpServer(
        plugin,
        name,
        readRecord(value, `mcpServers.${name}`),
      ),
    ]),
  );
}

function renderOpenCodeMcpServer(
  plugin: CodexPlugin,
  name: string,
  source: RecordValue,
): RecordValue {
  if (typeof source.url === 'string' && source.url.trim().length > 0) {
    return {
      type: 'remote',
      url: source.url,
      ...(isRecord(source.headers) ? { headers: source.headers } : {}),
      enabled: source.enabled !== false,
    };
  }

  const command = readCommand(source.command, name).map((entry) =>
    entry.replaceAll('<PLUGIN_ROOT>', plugin.root),
  );
  const args = (
    source.args === undefined
      ? []
      : readStringArray(source.args, `mcpServers.${name}.args`)
  ).map((entry) => entry.replaceAll('<PLUGIN_ROOT>', plugin.root));
  const environment = readEnvironment(source.env, name);
  const cwd = resolveMcpCwd(plugin, source.cwd);
  const timeout = readTimeout(source.tool_timeout_sec, name);

  return {
    type: 'local',
    command: [...command, ...args],
    ...(environment ? { environment } : {}),
    ...(cwd ? { cwd } : {}),
    ...(timeout ? { timeout } : {}),
    enabled: source.enabled !== false,
  };
}

function readCommand(value: unknown, name: string): string[] {
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value];
  }
  if (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === 'string')
  ) {
    if (value.length > 0) {
      return value as string[];
    }
  }
  throw new Error(`MCP server ${name} must declare a command or URL.`);
}

function readEnvironment(
  value: unknown,
  name: string,
): Record<string, string> | undefined {
  if (value === undefined) {
    return undefined;
  }
  const source = readRecord(value, `mcpServers.${name}.env`);
  return Object.fromEntries(
    Object.entries(source).map(([key, entry]) => {
      if (
        typeof entry !== 'string' &&
        typeof entry !== 'number' &&
        typeof entry !== 'boolean'
      ) {
        throw new Error(
          `MCP environment value must be scalar: mcpServers.${name}.env.${key}`,
        );
      }
      return [key, String(entry)];
    }),
  );
}

function readTimeout(value: unknown, name: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid MCP timeout for ${name}.`);
  }
  return Math.round(value * 1000);
}

function resolveMcpCwd(
  plugin: CodexPlugin,
  value: unknown,
): string | undefined {
  if (value === undefined) {
    return plugin.root;
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid MCP cwd for ${plugin.name}.`);
  }
  const replaced = value.replaceAll('<PLUGIN_ROOT>', plugin.root);
  return isAbsolute(replaced)
    ? resolve(replaced)
    : resolve(plugin.root, replaced);
}

async function readPluginJson(plugin: CodexPlugin): Promise<RecordValue> {
  const path = resolve(plugin.root, '.codex-plugin', 'plugin.json');
  try {
    const value = JSON.parse(await readFile(path, 'utf8')) as unknown;
    if (!isRecord(value)) {
      throw new Error('expected a JSON object');
    }
    return value;
  } catch (error) {
    throw new Error(`Invalid plugin manifest JSON: ${path}`, { cause: error });
  }
}

function readOptionalRecord(
  value: unknown,
  label: string,
): RecordValue | undefined {
  if (value === undefined) {
    return undefined;
  }
  return readRecord(value, label);
}

function readRecord(value: unknown, label: string): RecordValue {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value;
}

function readOptionalStringArray(value: unknown, label: string): string[] {
  if (value === undefined) {
    return [];
  }
  return readStringArray(value, label);
}

function readStringArray(value: unknown, label: string): string[] {
  if (
    !Array.isArray(value) ||
    !value.every((entry) => typeof entry === 'string')
  ) {
    throw new Error(`${label} must be an array of strings.`);
  }
  return [...(value as string[])];
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function sameStringArray(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function parseJsonc(value: string): string {
  const withoutComments = stripJsonComments(value);
  return stripTrailingCommas(withoutComments);
}

function stripJsonComments(value: string): string {
  let output = '';
  let inString = false;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < value.length; index += 1) {
    const current = value[index] ?? '';
    const next = value[index + 1] ?? '';

    if (lineComment) {
      if (current === '\n' || current === '\r') {
        lineComment = false;
        output += current;
      } else {
        output += ' ';
      }
      continue;
    }
    if (blockComment) {
      if (current === '*' && next === '/') {
        blockComment = false;
        output += '  ';
        index += 1;
      } else {
        output += current === '\n' || current === '\r' ? current : ' ';
      }
      continue;
    }
    if (inString) {
      output += current;
      if (escaped) {
        escaped = false;
      } else if (current === '\\') {
        escaped = true;
      } else if (current === '"') {
        inString = false;
      }
      continue;
    }
    if (current === '"') {
      inString = true;
      output += current;
    } else if (current === '/' && next === '/') {
      lineComment = true;
      output += '  ';
      index += 1;
    } else if (current === '/' && next === '*') {
      blockComment = true;
      output += '  ';
      index += 1;
    } else {
      output += current;
    }
  }

  return output;
}

function stripTrailingCommas(value: string): string {
  let output = '';
  let inString = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const current = value[index] ?? '';
    if (inString) {
      output += current;
      if (escaped) {
        escaped = false;
      } else if (current === '\\') {
        escaped = true;
      } else if (current === '"') {
        inString = false;
      }
      continue;
    }
    if (current === '"') {
      inString = true;
      output += current;
      continue;
    }
    if (current === ',') {
      let lookahead = index + 1;
      while (/\s/u.test(value[lookahead] ?? '')) {
        lookahead += 1;
      }
      if (value[lookahead] === '}' || value[lookahead] === ']') {
        continue;
      }
    }
    output += current;
  }
  return output;
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}
