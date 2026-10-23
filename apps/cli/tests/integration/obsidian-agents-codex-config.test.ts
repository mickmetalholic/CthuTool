import { afterEach, describe, expect, test } from 'bun:test';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'smol-toml';
import {
  applyObsidianAgentsSetup,
  createObsidianAgentsDirectoryLink,
  createObsidianAgentsSetupPlan,
  inspectObsidianAgentsStatus,
} from '../../src/domain/obsidian-agents-service';
import { createObsidianAgentsDataPaths } from '../../src/infra/obsidian-agents-paths';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'cthutool-obsidian-codex-'));
  roots.push(root);
  const vaultPath = join(root, 'Notes');
  await mkdir(vaultPath);
  return {
    root,
    vaultPath,
    codexPath: join(vaultPath, '.codex'),
    configPath: join(vaultPath, '.codex', 'config.toml'),
    paths: createObsidianAgentsDataPaths({ dataRoot: join(root, 'data') }),
  };
}

describe('Obsidian agents local Codex config', () => {
  test('previews without mutation and creates a local config with hooks disabled', async () => {
    const f = await fixture();
    const plan = await createObsidianAgentsSetupPlan(f.paths, f);
    expect(await readdir(f.vaultPath)).toEqual([]);
    expect(plan.actions.join('\n')).toContain('features.hooks = false');
    expect(plan.requiresConfirmation).toBe(true);
    const result = await applyObsidianAgentsSetup(f.paths, plan);
    expect(result.codexConfig).toEqual({
      path: plan.topology.codexConfig.path,
      created: true,
    });
    expect(parse(await readFile(f.configPath, 'utf8'))).toEqual({
      features: { hooks: false },
    });
    expect((await readdir(join(f.vaultPath, 'Agents'))).sort()).toEqual([
      'skills',
      'state',
    ]);
    const status = (await inspectObsidianAgentsStatus({ paths: f.paths }))
      .vaults[0];
    expect(status).toMatchObject({
      healthy: true,
      codexConfigPath: plan.topology.codexConfig.path,
      paths: { codexConfigExists: true },
    });
  });

  test('preserves existing config and other .codex files byte for byte', async () => {
    const f = await fixture();
    const original =
      '# My preferences\nmodel = "custom"\n[features]\nhooks = true\n';
    await mkdir(f.codexPath);
    await writeFile(f.configPath, original);
    await writeFile(join(f.codexPath, 'AGENTS.md'), '# Keep me\n');
    const first = await applyObsidianAgentsSetup(
      f.paths,
      await createObsidianAgentsSetupPlan(f.paths, f),
    );
    expect(first.codexConfig.created).toBe(false);
    expect(await readFile(f.configPath, 'utf8')).toBe(original);
    expect(await readFile(join(f.codexPath, 'AGENTS.md'), 'utf8')).toBe(
      '# Keep me\n',
    );
    const repeated = await createObsidianAgentsSetupPlan(f.paths, f);
    expect(repeated.transition).toBe('reuse');
    expect(repeated.requiresConfirmation).toBe(false);
    expect(
      (await applyObsidianAgentsSetup(f.paths, repeated)).codexConfig.created,
    ).toBe(false);
    expect(await readFile(f.configPath, 'utf8')).toBe(original);
    expect(
      (await inspectObsidianAgentsStatus({ paths: f.paths })).summary.healthy,
    ).toBe(1);
  });

  test('reports missing config read-only and adds it to an existing linked vault', async () => {
    const f = await fixture();
    await applyObsidianAgentsSetup(
      f.paths,
      await createObsidianAgentsSetupPlan(f.paths, f),
    );
    await unlink(f.configPath);
    const status = (await inspectObsidianAgentsStatus({ paths: f.paths }))
      .vaults[0];
    expect(status).toMatchObject({
      healthy: false,
      link: { status: 'correct' },
      claudeLink: { status: 'correct' },
      paths: { codexConfigExists: false },
    });
    expect(status?.issues.join('\n')).toContain(
      'Local Codex config is missing',
    );
    expect(await Bun.file(f.configPath).exists()).toBe(false);
    const plan = await createObsidianAgentsSetupPlan(f.paths, f);
    expect(plan.transition).toBe('reuse');
    expect(plan.requiresConfirmation).toBe(true);
    await applyObsidianAgentsSetup(f.paths, plan);
    expect(parse(await readFile(f.configPath, 'utf8'))).toEqual({
      features: { hooks: false },
    });
  });

  test('rejects occupied or redirected paths before creating links or touching targets', async () => {
    for (const kind of [
      'parent-file',
      'parent-link',
      'config-directory',
      'config-link',
    ]) {
      const f = await fixture();
      const outside = join(f.root, 'outside');
      await mkdir(outside);
      const outsideConfig = join(outside, 'config.toml');
      await writeFile(outsideConfig, 'keep\n');
      if (kind === 'parent-file') await writeFile(f.codexPath, 'keep\n');
      else if (kind === 'parent-link')
        await createObsidianAgentsDirectoryLink(f.codexPath, outside);
      else {
        await mkdir(f.codexPath);
        if (kind === 'config-directory') await mkdir(f.configPath);
        else await createObsidianAgentsDirectoryLink(f.configPath, outside);
      }
      const before = await readdir(f.vaultPath);
      await expect(createObsidianAgentsSetupPlan(f.paths, f)).rejects.toThrow(
        /Relocate it manually/,
      );
      expect(await readdir(f.vaultPath)).toEqual(before);
      expect(await readFile(outsideConfig, 'utf8')).toBe('keep\n');
      expect(await Bun.file(f.paths.configPath).exists()).toBe(false);
    }
  });

  test('stops if another config appears after preview without overwriting it', async () => {
    const f = await fixture();
    await mkdir(f.codexPath);
    const plan = await createObsidianAgentsSetupPlan(f.paths, f);
    await writeFile(f.configPath, '# Created elsewhere\n');
    await expect(applyObsidianAgentsSetup(f.paths, plan)).rejects.toThrow(
      /changed after preview/,
    );
    expect(await readdir(f.vaultPath)).toEqual(['.codex']);
    expect(await readFile(f.configPath, 'utf8')).toBe('# Created elsewhere\n');
  });
});
