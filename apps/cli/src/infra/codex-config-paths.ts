import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

export type CodexConfigPaths = {
  readonly repoRoot: string;
  readonly repoCodexRoot: string;
  readonly homeRoot: string;
  readonly localCodexRoot: string;
  readonly localOpenCodeRoot: string;
  readonly openCodeConfigPath: string;
  readonly marketplacePath: string;
  readonly pluginsRoot: string;
  readonly cacheRoot: string;
};

export type CodexConfigPathOptions = {
  readonly repoRoot?: string;
  readonly homeRoot?: string;
  readonly codexHome?: string;
  readonly openCodeHome?: string;
  readonly openCodeConfig?: string;
  readonly marketplace?: string;
  readonly pluginsRoot?: string;
  readonly cacheRoot?: string;
};

export function createCodexConfigPaths(
  options: CodexConfigPathOptions = {},
): CodexConfigPaths {
  const repoRoot = resolve(options.repoRoot ?? getDefaultRepoRoot());
  const homeRoot = resolve(options.homeRoot ?? homedir());
  const localCodexRoot = resolve(options.codexHome ?? join(homeRoot, '.codex'));
  const localOpenCodeRoot = resolve(
    options.openCodeHome ?? join(homeRoot, '.config', 'opencode'),
  );
  const openCodeConfigPath = resolve(
    options.openCodeConfig ?? getDefaultOpenCodeConfigPath(localOpenCodeRoot),
  );
  return {
    repoRoot,
    repoCodexRoot: resolve(repoRoot, 'codex'),
    homeRoot,
    localCodexRoot,
    localOpenCodeRoot,
    openCodeConfigPath,
    marketplacePath: resolve(
      options.marketplace ??
        join(homeRoot, '.agents', 'plugins', 'marketplace.json'),
    ),
    pluginsRoot: resolve(
      options.pluginsRoot ?? join(repoRoot, 'codex', 'plugins'),
    ),
    cacheRoot: resolve(
      options.cacheRoot ??
        join(homeRoot, '.codex', 'plugins', 'cache', 'personal'),
    ),
  };
}

function getDefaultOpenCodeConfigPath(openCodeRoot: string): string {
  const jsoncPath = join(openCodeRoot, 'opencode.jsonc');
  return existsSync(jsoncPath)
    ? jsoncPath
    : join(openCodeRoot, 'opencode.json');
}

export function assertPathInside(parent: string, child: string): void {
  const parentPath = resolve(parent);
  const childPath = resolve(child);
  const childRelative = relative(parentPath, childPath);

  if (childRelative.startsWith('..') || isAbsolute(childRelative)) {
    throw new Error(`Refusing to write outside ${parentPath}: ${childPath}`);
  }
}

function getDefaultRepoRoot(): string {
  const start = resolve(process.cwd());
  let current = start;

  while (true) {
    if (isWorkspaceRoot(current)) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return start;
    }
    current = parent;
  }
}

function isWorkspaceRoot(path: string): boolean {
  if (existsSync(join(path, 'pnpm-workspace.yaml'))) {
    return true;
  }

  try {
    const pkg = JSON.parse(
      readFileSync(join(path, 'package.json'), 'utf8'),
    ) as {
      name?: unknown;
    };
    return pkg.name === 'cthutool';
  } catch {
    return false;
  }
}
