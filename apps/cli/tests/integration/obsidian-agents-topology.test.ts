import { describe, expect, test } from 'bun:test';
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
import {
  applyObsidianAgentsSetup,
  createObsidianAgentsDirectoryLink,
  createObsidianAgentsSetupPlan,
  getObsidianAgentsLinkType,
  inspectObsidianAgentsStatus,
  inspectObsidianAgentsTopology,
} from '../../src/domain/obsidian-agents-service';
import { createObsidianAgentsDataPaths } from '../../src/infra/obsidian-agents-paths';

async function createFixture(name = 'cthutool-obsidian-topology-') {
  const root = await mkdtemp(join(tmpdir(), name));
  const vaultPath = join(root, 'vault');
  const sourcePath = join(vaultPath, 'Agent');
  const agentsPath = join(vaultPath, '.agents');
  const paths = createObsidianAgentsDataPaths({
    dataRoot: join(root, 'chc-data'),
  });
  await mkdir(vaultPath, { recursive: true });
  return { root, vaultPath, sourcePath, agentsPath, paths };
}

function input(fixture: Awaited<ReturnType<typeof createFixture>>) {
  return {
    id: 'obsidian-main',
    vaultPath: fixture.vaultPath,
    sourcePath: fixture.sourcePath,
  };
}

describe('Obsidian agents vault topology', () => {
  test('creates the visible source and an idempotent platform link', async () => {
    const fixture = await createFixture();
    const plan = await createObsidianAgentsSetupPlan(
      fixture.paths,
      input(fixture),
    );
    expect(plan.transition).toBe('create');
    expect(plan.requiresConfirmation).toBe(true);

    const setup = await applyObsidianAgentsSetup(fixture.paths, plan);
    expect(setup.link).toMatchObject({
      status: 'correct',
      type: getObsidianAgentsLinkType(),
    });
    await writeFile(
      join(fixture.sourcePath, 'skills', 'shared.md'),
      '# shared\n',
      'utf8',
    );
    expect(
      await readFile(join(fixture.agentsPath, 'skills', 'shared.md'), 'utf8'),
    ).toBe('# shared\n');

    const repeated = await createObsidianAgentsSetupPlan(
      fixture.paths,
      input(fixture),
    );
    expect(repeated.transition).toBe('reuse');
    expect(repeated.requiresConfirmation).toBe(false);
    await applyObsidianAgentsSetup(fixture.paths, repeated);
  });

  test('links an existing visible Agent source without changing its files', async () => {
    const fixture = await createFixture();
    await mkdir(join(fixture.sourcePath, 'skills'), { recursive: true });
    await writeFile(
      join(fixture.sourcePath, 'skills', 'existing.md'),
      'keep\n',
      'utf8',
    );

    const plan = await createObsidianAgentsSetupPlan(
      fixture.paths,
      input(fixture),
    );
    expect(plan.transition).toBe('link_existing_source');
    await applyObsidianAgentsSetup(fixture.paths, plan);
    expect(
      await readFile(join(fixture.agentsPath, 'skills', 'existing.md'), 'utf8'),
    ).toBe('keep\n');
  });

  test('adopts a real .agents directory and preserves hidden legacy metadata', async () => {
    const fixture = await createFixture();
    await mkdir(join(fixture.agentsPath, '.git'), { recursive: true });
    await mkdir(join(fixture.agentsPath, 'skills'), { recursive: true });
    await writeFile(
      join(fixture.agentsPath, '.git', 'config'),
      '[core]\n',
      'utf8',
    );
    await writeFile(
      join(fixture.agentsPath, 'skills', 'legacy.md'),
      'legacy\n',
      'utf8',
    );

    const plan = await createObsidianAgentsSetupPlan(
      fixture.paths,
      input(fixture),
    );
    expect(plan.transition).toBe('adopt_existing_agents');
    await applyObsidianAgentsSetup(fixture.paths, plan);
    expect(
      await readFile(join(fixture.sourcePath, '.git', 'config'), 'utf8'),
    ).toBe('[core]\n');
    expect(
      await readFile(join(fixture.agentsPath, 'skills', 'legacy.md'), 'utf8'),
    ).toBe('legacy\n');

    const status = await inspectObsidianAgentsStatus({ paths: fixture.paths });
    expect(status).toMatchObject({
      healthy: true,
      legacy: { gitMetadata: true },
      consistency: { provider: 'obsidian_sync', model: 'eventual' },
    });
  });

  test('repairs a mismatched link without touching its old target', async () => {
    const fixture = await createFixture();
    const oldTarget = join(fixture.vaultPath, 'OldAgent');
    await mkdir(join(fixture.sourcePath, 'skills'), { recursive: true });
    await mkdir(oldTarget, { recursive: true });
    await writeFile(join(oldTarget, 'keep.txt'), 'keep\n', 'utf8');
    await createObsidianAgentsDirectoryLink(fixture.agentsPath, oldTarget);

    const plan = await createObsidianAgentsSetupPlan(
      fixture.paths,
      input(fixture),
    );
    expect(plan.transition).toBe('repair_link');
    expect(plan.topology.linkStatus).toBe('mismatched');
    await applyObsidianAgentsSetup(fixture.paths, plan);

    expect(await readFile(join(oldTarget, 'keep.txt'), 'utf8')).toBe('keep\n');
    expect(
      (await inspectObsidianAgentsTopology(setupProfile(fixture))).linkStatus,
    ).toBe('correct');
  });

  test('reports a broken link without repairing or mutating the vault', async () => {
    const fixture = await createFixture();
    const oldTarget = join(fixture.vaultPath, 'RemovedAgent');
    await mkdir(oldTarget, { recursive: true });
    await createObsidianAgentsDirectoryLink(fixture.agentsPath, oldTarget);
    await rm(oldTarget, { recursive: true });
    const before = await readdir(fixture.vaultPath);

    const status = await inspectObsidianAgentsStatus({
      paths: fixture.paths,
      profileId: 'obsidian-main',
    });
    expect(status.configured).toBe(false);

    const plan = await createObsidianAgentsSetupPlan(
      fixture.paths,
      input(fixture),
    );
    await applyObsidianAgentsSetup(fixture.paths, plan);
    await rm(fixture.sourcePath, { recursive: true });
    const configuredBefore = await readdir(fixture.vaultPath);
    const broken = await inspectObsidianAgentsStatus({ paths: fixture.paths });
    const configuredAfter = await readdir(fixture.vaultPath);
    expect(broken.link.status).toBe('broken');
    expect(configuredAfter).toEqual(configuredBefore);
    expect(before).toContain('.agents');
  });

  test('refuses two non-empty real directories without changing either', async () => {
    const fixture = await createFixture();
    await mkdir(fixture.sourcePath, { recursive: true });
    await mkdir(fixture.agentsPath, { recursive: true });
    await writeFile(join(fixture.sourcePath, 'source.txt'), 'source\n', 'utf8');
    await writeFile(join(fixture.agentsPath, 'agents.txt'), 'agents\n', 'utf8');

    await expect(
      createObsidianAgentsSetupPlan(fixture.paths, input(fixture)),
    ).rejects.toThrow(/Both agents directories contain data/);
    expect(await readFile(join(fixture.sourcePath, 'source.txt'), 'utf8')).toBe(
      'source\n',
    );
    expect(await readFile(join(fixture.agentsPath, 'agents.txt'), 'utf8')).toBe(
      'agents\n',
    );
  });

  test('rejects a visible path whose ancestor link resolves outside the vault', async () => {
    const fixture = await createFixture();
    const outside = join(fixture.root, 'outside');
    const linkedParent = join(fixture.vaultPath, 'Visible');
    const escapedSource = join(linkedParent, 'Agent');
    await mkdir(join(outside, 'Agent'), { recursive: true });
    await createObsidianAgentsDirectoryLink(linkedParent, outside);

    await expect(
      createObsidianAgentsSetupPlan(fixture.paths, {
        id: 'obsidian-main',
        vaultPath: fixture.vaultPath,
        sourcePath: escapedSource,
      }),
    ).rejects.toThrow(/must resolve to a directory inside/);
  });

  test('stops when a mismatched link changes after its preview', async () => {
    const fixture = await createFixture();
    const firstTarget = join(fixture.vaultPath, 'FirstTarget');
    const secondTarget = join(fixture.vaultPath, 'SecondTarget');
    await mkdir(fixture.sourcePath);
    await mkdir(firstTarget);
    await mkdir(secondTarget);
    await writeFile(join(secondTarget, 'keep.txt'), 'keep\n', 'utf8');
    await createObsidianAgentsDirectoryLink(fixture.agentsPath, firstTarget);
    const plan = await createObsidianAgentsSetupPlan(
      fixture.paths,
      input(fixture),
    );

    await unlink(fixture.agentsPath);
    await createObsidianAgentsDirectoryLink(fixture.agentsPath, secondTarget);
    await expect(applyObsidianAgentsSetup(fixture.paths, plan)).rejects.toThrow(
      /topology changed after preview/,
    );
    expect(await readFile(join(secondTarget, 'keep.txt'), 'utf8')).toBe(
      'keep\n',
    );
    expect(
      (await inspectObsidianAgentsTopology(setupProfile(fixture))).agents
        .resolvedTarget,
    ).toBe(secondTarget);
  });

  test('selects junctions on Windows and directory symlinks elsewhere', () => {
    expect(getObsidianAgentsLinkType('win32')).toBe('junction');
    expect(getObsidianAgentsLinkType('linux')).toBe('symbolic_link');
    expect(getObsidianAgentsLinkType('darwin')).toBe('symbolic_link');
  });
});

function setupProfile(fixture: Awaited<ReturnType<typeof createFixture>>) {
  return {
    id: 'obsidian-main',
    vaultPath: fixture.vaultPath,
    sourcePath: fixture.sourcePath,
    agentsPath: fixture.agentsPath,
  };
}
