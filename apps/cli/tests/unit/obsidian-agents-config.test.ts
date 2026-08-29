import { describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
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
  test('resolves the Windows data root outside the shared Agents source', async () => {
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
    expect(Object.keys(paths)).toEqual(['dataRoot', 'configPath']);
  });

  test('derives .agents, defaults to Agents, and rejects unsafe sources', () => {
    const vaultPath = resolve('vault');
    const profile = normalizeObsidianAgentsProfile({
      id: 'obsidian-main',
      vaultPath,
    });

    expect(profile.sourcePath).toBe(resolve(vaultPath, 'Agents'));
    expect(profile.agentsPath).toBe(resolve(vaultPath, '.agents'));
    expect(() =>
      normalizeObsidianAgentsProfile({ id: 'Obsidian', vaultPath }),
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
        vaultPath,
        sourcePath: resolve(vaultPath, '..', 'outside'),
      }),
    ).toThrow(/inside the Obsidian vault/);
    expect(() =>
      normalizeObsidianAgentsProfile({
        id: 'obsidian-main',
        vaultPath,
        sourcePath: resolve(vaultPath, '.hidden', 'Agents'),
      }),
    ).toThrow(/hidden/);
    expect(() =>
      normalizeObsidianAgentsProfile({
        id: 'obsidian-main',
        vaultPath,
        sourcePath: resolve(vaultPath, '.agents'),
      }),
    ).toThrow(/hidden|different/);
  });

  test('reads a version 1 profile and persists version 2 without agentsPath', async () => {
    const dataRoot = await mkdtemp(join(tmpdir(), 'cthutool-chc-'));
    const paths = createObsidianAgentsDataPaths({ dataRoot });
    const vaultPath = resolve(dataRoot, 'vault');
    await writeFile(
      paths.configPath,
      JSON.stringify({
        version: 1,
        defaultProfile: 'obsidian-main',
        profiles: {
          'obsidian-main': {
            id: 'obsidian-main',
            vaultPath,
            agentsPath: resolve(vaultPath, '.agents'),
          },
        },
      }),
      'utf8',
    );

    const migrated = await readObsidianAgentsConfig(paths);
    if (!migrated) throw new Error('Expected the legacy config to load.');
    expect(migrated?.version).toBe(2);
    expect(migrated?.profiles['obsidian-main']).toMatchObject({
      sourcePath: resolve(vaultPath, 'Agents'),
      agentsPath: resolve(vaultPath, '.agents'),
    });
    await writeObsidianAgentsConfig(paths, migrated);
    const raw = await readFile(paths.configPath, 'utf8');
    expect(JSON.parse(raw)).toMatchObject({
      version: 2,
      profiles: {
        'obsidian-main': {
          vaultPath,
          sourcePath: resolve(vaultPath, 'Agents'),
        },
      },
    });
    expect(raw).not.toContain('agentsPath');
  });

  test('atomically persists profiles and selects the configured default', async () => {
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
    if (!loaded) throw new Error('Expected the persisted config to load.');
    expect(selectObsidianAgentsProfile(loaded)?.id).toBe('secondary');
    expect(selectObsidianAgentsProfile(loaded, 'obsidian-main')?.id).toBe(
      'obsidian-main',
    );
    const raw = await readFile(paths.configPath, 'utf8');
    expect(raw).not.toContain('remote');
    expect(raw).not.toContain('password');
  });
});
