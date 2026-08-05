import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  assertPathInside,
  createCodexConfigPaths,
} from '../../src/infra/codex-config-paths';

describe('codex config paths', () => {
  test('defaults repository root to the nearest CthuTool workspace from cwd', async () => {
    const previousCwd = process.cwd();
    const parent = await mkdtemp(join(tmpdir(), 'cthutool-parent-'));
    const repoRoot = join(parent, 'CthuTool');
    const nested = join(repoRoot, 'apps', 'cli');
    await mkdir(nested, { recursive: true });
    await writeFile(
      join(repoRoot, 'package.json'),
      JSON.stringify({ name: 'cthutool' }),
      'utf8',
    );

    try {
      process.chdir(nested);
      const paths = createCodexConfigPaths({ homeRoot: parent });
      const realRepoRoot = await realpath(repoRoot);

      expect(paths.repoRoot).toBe(realRepoRoot);
      expect(paths.repoCodexRoot).toBe(resolve(realRepoRoot, 'codex'));
    } finally {
      process.chdir(previousCwd);
    }
  });

  test('resolves repository and local Codex paths from explicit roots', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));

    const paths = createCodexConfigPaths({ repoRoot, homeRoot });

    expect(paths.repoRoot).toBe(resolve(repoRoot));
    expect(paths.repoCodexRoot).toBe(resolve(repoRoot, 'codex'));
    expect(paths.homeRoot).toBe(resolve(homeRoot));
    expect(paths.localCodexRoot).toBe(resolve(homeRoot, '.codex'));
    expect(paths.localOpenCodeRoot).toBe(
      resolve(homeRoot, '.config', 'opencode'),
    );
    expect(paths.openCodeConfigPath).toBe(
      resolve(homeRoot, '.config', 'opencode', 'opencode.json'),
    );
    expect(paths.marketplacePath).toBe(
      resolve(homeRoot, '.agents', 'plugins', 'marketplace.json'),
    );
    expect(paths.pluginsRoot).toBe(resolve(repoRoot, 'codex', 'plugins'));
  });

  test('honors explicit local Codex and marketplace overrides', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const codexHome = join(homeRoot, 'custom-codex');
    const marketplace = join(homeRoot, 'marketplace.json');

    const paths = createCodexConfigPaths({
      repoRoot,
      homeRoot,
      codexHome,
      marketplace,
    });

    expect(paths.localCodexRoot).toBe(resolve(codexHome));
    expect(paths.marketplacePath).toBe(resolve(marketplace));
  });

  test('uses an existing JSONC OpenCode config by default', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const openCodeRoot = join(homeRoot, '.config', 'opencode');
    await mkdir(openCodeRoot, { recursive: true });
    await writeFile(join(openCodeRoot, 'opencode.jsonc'), '{}', 'utf8');

    const paths = createCodexConfigPaths({ repoRoot, homeRoot });

    expect(paths.openCodeConfigPath).toBe(
      resolve(openCodeRoot, 'opencode.jsonc'),
    );
  });

  test('refuses child paths outside the intended root', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'cthutool-parent-'));
    const sibling = await mkdtemp(join(tmpdir(), 'cthutool-sibling-'));

    expect(() =>
      assertPathInside(parent, join(parent, 'ok.txt')),
    ).not.toThrow();
    expect(() => assertPathInside(parent, sibling)).toThrow(
      /Refusing to write outside/,
    );
  });
});
