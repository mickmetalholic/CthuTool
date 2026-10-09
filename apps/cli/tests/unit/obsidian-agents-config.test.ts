import { afterEach, describe, expect, test } from 'bun:test';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  canonicalizeObsidianAgentsProfile,
  createEmptyObsidianAgentsConfig,
  normalizeObsidianAgentsProfile,
  readObsidianAgentsConfig,
  selectObsidianAgentsProfile,
  upsertObsidianAgentsProfile,
  writeObsidianAgentsConfig,
} from '../../src/domain/obsidian-agents-config';
import { createObsidianAgentsDataPaths } from '../../src/infra/obsidian-agents-paths';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'cthutool-config-'));
  roots.push(root);
  return { root, paths: createObsidianAgentsDataPaths({ dataRoot: root }) };
}

describe('Obsidian path configuration', () => {
  test('resolves the Windows local data root', () => {
    const homeRoot = resolve('home');
    expect(
      createObsidianAgentsDataPaths({ homeRoot, platform: 'win32', env: {} })
        .dataRoot,
    ).toBe(resolve(homeRoot, 'AppData', 'Roaming', 'CthuTool', 'chc'));
  });
  test('derives paths and rejects unsafe sources', () => {
    const vaultPath = resolve('vault');
    expect(normalizeObsidianAgentsProfile({ vaultPath })).toEqual({
      vaultPath,
      sourcePath: join(vaultPath, 'Agents'),
      agentsPath: join(vaultPath, '.agents'),
    });
    expect(() =>
      normalizeObsidianAgentsProfile({ vaultPath: 'relative' }),
    ).toThrow(/absolute/);
    for (const sourcePath of [
      vaultPath,
      resolve(vaultPath, '..', 'outside'),
      join(vaultPath, '.agents'),
      join(vaultPath, '.hidden', 'Agents'),
    ]) {
      expect(() =>
        normalizeObsidianAgentsProfile({ vaultPath, sourcePath }),
      ).toThrow();
    }
  });
  test('canonicalizes symlink aliases, upserts one vault, and keeps same-name vaults distinct', async () => {
    const { root, paths } = await fixture();
    const firstPath = join(root, 'first', 'Notes');
    const secondPath = join(root, 'second', 'Notes');
    await mkdir(firstPath, { recursive: true });
    await mkdir(secondPath, { recursive: true });
    const alias = join(root, 'alias');
    await symlink(
      firstPath,
      alias,
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    const first = await canonicalizeObsidianAgentsProfile({
      vaultPath: firstPath,
    });
    const repeated = await canonicalizeObsidianAgentsProfile({
      vaultPath: alias,
    });
    expect(repeated).toEqual(first);
    let config = upsertObsidianAgentsProfile(
      createEmptyObsidianAgentsConfig(),
      first,
    );
    config = upsertObsidianAgentsProfile(config, repeated);
    config = upsertObsidianAgentsProfile(
      config,
      await canonicalizeObsidianAgentsProfile({ vaultPath: secondPath }),
    );
    await writeObsidianAgentsConfig(paths, config);
    const loaded = await readObsidianAgentsConfig(paths);
    if (!loaded) throw new Error('Expected configuration');
    expect(loaded.vaults).toHaveLength(2);
    expect(selectObsidianAgentsProfile(loaded, first.vaultPath)).toEqual(first);
    const persisted = JSON.parse(await readFile(paths.configPath, 'utf8'));
    expect(persisted).toEqual({
      version: 3,
      vaults: loaded.vaults.map(({ vaultPath, sourcePath }) => ({
        vaultPath,
        sourcePath,
      })),
    });
    expect(
      (await readdir(root)).filter((name) => name.includes('.tmp-')),
    ).toEqual([]);
  });
  test('converts version 2 aliases read-only and saves version 3 atomically', async () => {
    const { root, paths } = await fixture();
    const vaultPath = join(root, 'vault');
    await mkdir(vaultPath);
    const alias = join(root, 'alias');
    await symlink(
      vaultPath,
      alias,
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    const old = JSON.stringify({
      version: 2,
      defaultProfile: 'unused',
      profiles: {
        first: { vaultPath, sourcePath: join(vaultPath, 'Agents') },
        second: { vaultPath: alias, sourcePath: join(alias, 'Agents') },
      },
    });
    await writeFile(paths.configPath, old);
    const config = await readObsidianAgentsConfig(paths);
    if (!config) throw new Error('Expected configuration');
    expect(config.vaults).toHaveLength(1);
    expect(await readFile(paths.configPath, 'utf8')).toBe(old);
    await writeObsidianAgentsConfig(paths, config);
    expect(JSON.parse(await readFile(paths.configPath, 'utf8'))).toEqual({
      version: 3,
      vaults: [
        {
          vaultPath: await realpath(vaultPath),
          sourcePath: join(await realpath(vaultPath), 'Agents'),
        },
      ],
    });
  });
  test('rejects conflicting version 2 sources without rewriting', async () => {
    const { root, paths } = await fixture();
    const vaultPath = join(root, 'missing');
    const raw = JSON.stringify({
      version: 2,
      profiles: {
        a: { vaultPath, sourcePath: join(vaultPath, 'Agents') },
        b: { vaultPath, sourcePath: join(vaultPath, 'Other') },
      },
    });
    await writeFile(paths.configPath, raw);
    await expect(readObsidianAgentsConfig(paths)).rejects.toThrow(
      /Conflicting sources.*Agents.*Other/,
    );
    expect(await readFile(paths.configPath, 'utf8')).toBe(raw);
  });
  test('rejects version 1 with the config path and preserves missing entries', async () => {
    const { root, paths } = await fixture();
    await writeFile(
      paths.configPath,
      JSON.stringify({ version: 1, profiles: {} }),
    );
    await expect(readObsidianAgentsConfig(paths)).rejects.toThrow(
      /Back up.*setup.*Configuration:/,
    );
    const vaultPath = join(root, 'unavailable');
    await writeObsidianAgentsConfig(
      paths,
      upsertObsidianAgentsProfile(
        createEmptyObsidianAgentsConfig(),
        normalizeObsidianAgentsProfile({ vaultPath }),
      ),
    );
    expect((await readObsidianAgentsConfig(paths))?.vaults[0]?.vaultPath).toBe(
      vaultPath,
    );
  });
});
