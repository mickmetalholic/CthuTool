import { describe, expect, test } from 'bun:test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  assertPathInside,
  createCodexConfigPaths,
} from '../../src/infra/codex-config-paths';

describe('codex config paths', () => {
  test('resolves repository and local Codex paths from explicit roots', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));

    const paths = createCodexConfigPaths({ repoRoot, homeRoot });

    expect(paths.repoRoot).toBe(resolve(repoRoot));
    expect(paths.repoCodexRoot).toBe(resolve(repoRoot, '.codex'));
    expect(paths.homeRoot).toBe(resolve(homeRoot));
    expect(paths.localCodexRoot).toBe(resolve(homeRoot, '.codex'));
    expect(paths.marketplacePath).toBe(
      resolve(homeRoot, '.agents', 'plugins', 'marketplace.json'),
    );
    expect(paths.pluginsRoot).toBe(
      resolve(repoRoot, 'packages', 'codex-plugins', 'plugins'),
    );
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
