import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type CodexConfigPaths = {
  readonly repoRoot: string;
  readonly repoCodexRoot: string;
  readonly homeRoot: string;
  readonly localCodexRoot: string;
  readonly marketplacePath: string;
  readonly pluginsRoot: string;
  readonly cacheRoot: string;
};

export type CodexConfigPathOptions = {
  readonly repoRoot?: string;
  readonly homeRoot?: string;
  readonly codexHome?: string;
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

  return {
    repoRoot,
    repoCodexRoot: resolve(repoRoot, '.codex'),
    homeRoot,
    localCodexRoot,
    marketplacePath: resolve(
      options.marketplace ??
        join(homeRoot, '.agents', 'plugins', 'marketplace.json'),
    ),
    pluginsRoot: resolve(
      options.pluginsRoot ??
        join(repoRoot, 'packages', 'codex-plugins', 'plugins'),
    ),
    cacheRoot: resolve(
      options.cacheRoot ??
        join(homeRoot, '.codex', 'plugins', 'cache', 'personal'),
    ),
  };
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
  return resolve(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    '..',
  );
}
