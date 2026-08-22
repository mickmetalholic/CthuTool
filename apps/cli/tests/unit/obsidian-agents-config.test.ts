import { describe, expect, test } from 'bun:test';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  createEmptyObsidianAgentsConfig,
  normalizeObsidianAgentsProfile,
  readObsidianAgentsConfig,
  selectObsidianAgentsProfile,
  upsertObsidianAgentsProfile,
  writeObsidianAgentsConfig,
} from '../../src/domain/obsidian-agents-config';
import { createObsidianAgentsDataPaths } from '../../src/infra/obsidian-agents-paths';

describe('Obsidian agents configuration', () => {
  test('resolves the Windows data root outside the shared agents repository', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const paths = createObsidianAgentsDataPaths({
      homeRoot,
      platform: 'win32',
      env: {},
    });

    expect(paths.dataRoot).toBe(
      resolve(homeRoot, 'AppData', 'Roaming', 'CthuTool', 'chc'),
    );
    expect(paths.configPath).toBe(join(paths.dataRoot, 'obsidian-agents.json'));
    expect(paths.locksRoot).toBe(join(paths.dataRoot, 'locks'));
  });

  test('normalizes the default .agents boundary and rejects unsafe profiles', () => {
    const profile = normalizeObsidianAgentsProfile({
      id: 'obsidian-main',
      vaultPath: resolve('vault'),
    });

    expect(profile.agentsPath).toBe(resolve(profile.vaultPath, '.agents'));
    expect(() =>
      normalizeObsidianAgentsProfile({
        id: 'Obsidian',
        vaultPath: profile.vaultPath,
      }),
    ).toThrow(/Profile id/);
    expect(() =>
      normalizeObsidianAgentsProfile({
        id: 'obsidian-main',
        vaultPath: 'relative-vault',
      }),
    ).toThrow(/absolute path/);
    expect(() =>
      normalizeObsidianAgentsProfile({
        id: 'obsidian-main',
        vaultPath: profile.vaultPath,
        agentsPath: profile.vaultPath,
      }),
    ).toThrow(/different/);
  });

  test('atomically persists profiles, selects the default, and excludes remotes', async () => {
    const dataRoot = await mkdtemp(join(tmpdir(), 'cthutool-chc-'));
    const paths = createObsidianAgentsDataPaths({ dataRoot });
    const first = normalizeObsidianAgentsProfile({
      id: 'obsidian-main',
      vaultPath: resolve(dataRoot, 'vault'),
    });
    const second = normalizeObsidianAgentsProfile({
      id: 'secondary',
      vaultPath: resolve(dataRoot, 'secondary-vault'),
    });

    let config = createEmptyObsidianAgentsConfig();
    config = upsertObsidianAgentsProfile(config, first);
    await writeObsidianAgentsConfig(paths, config);
    config = upsertObsidianAgentsProfile(config, second);
    await writeObsidianAgentsConfig(paths, config);

    const loaded = await readObsidianAgentsConfig(paths);
    expect(loaded).toBeDefined();
    expect(selectObsidianAgentsProfile(loaded as typeof config)?.id).toBe(
      'secondary',
    );
    expect(
      selectObsidianAgentsProfile(loaded as typeof config, 'obsidian-main')?.id,
    ).toBe('obsidian-main');
    const raw = await readFile(paths.configPath, 'utf8');
    expect(raw).toContain('obsidian-main');
    expect(raw).not.toContain('remote');
    expect(raw).not.toContain('password');
  });
});
