import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

export type CodexPluginSource = {
  readonly repoRoot: string;
};

export function pluginSourceConfigPath(homeRoot: string): string {
  return join(homeRoot, '.cthutool', 'codex', 'plugin-source.json');
}

export async function readCodexPluginSource(
  homeRoot: string,
): Promise<CodexPluginSource | undefined> {
  const path = pluginSourceConfigPath(homeRoot);
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (error) {
    if (isMissingFile(error)) return undefined;
    throw new Error(`Could not read saved Codex plugin source at ${path}.`, {
      cause: error,
    });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid saved Codex plugin source at ${path}.`);
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('version' in parsed) ||
    parsed.version !== 1 ||
    !('repoRoot' in parsed) ||
    typeof parsed.repoRoot !== 'string' ||
    !parsed.repoRoot.trim()
  ) {
    throw new Error(`Invalid saved Codex plugin source at ${path}.`);
  }
  return { repoRoot: resolve(parsed.repoRoot) };
}

export async function writeCodexPluginSource(
  homeRoot: string,
  repoRoot: string,
): Promise<void> {
  const path = pluginSourceConfigPath(homeRoot);
  const temporaryPath = `${path}.${randomUUID()}.tmp`;
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(
      temporaryPath,
      `${JSON.stringify({ version: 1, repoRoot: resolve(repoRoot) }, null, 2)}\n`,
      'utf8',
    );
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export function findCthuToolRoot(start: string): string | undefined {
  let current = resolve(start);
  while (true) {
    try {
      const pkg = JSON.parse(
        readFileSync(join(current, 'package.json'), 'utf8'),
      ) as {
        name?: unknown;
      };
      if (pkg.name === 'cthutool') return current;
    } catch {
      // Continue toward the filesystem root.
    }
    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

export function pluginSourceValidationError(
  repoRoot: string,
  pluginsRoot?: string,
): string | undefined {
  const root = resolve(repoRoot);
  if (!isDirectory(root)) return `Repository path is not a directory: ${root}`;
  const sourceRoot = resolve(pluginsRoot ?? join(root, 'codex', 'plugins'));
  const manifest = join(root, 'codex', 'plugins.manifest.json');
  if (!isDirectory(sourceRoot) && !existsSync(manifest)) {
    return `No Codex plugin source found at ${sourceRoot} (or ${manifest}).`;
  }
  return undefined;
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function isMissingFile(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
