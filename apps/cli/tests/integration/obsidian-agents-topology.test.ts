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
  sameCanonicalPath,
} from '../../src/domain/obsidian-agents-service';
import { createObsidianAgentsDataPaths } from '../../src/infra/obsidian-agents-paths';

async function createFixture(name = 'cthutool-obsidian-topology-') {
  const root = await mkdtemp(join(tmpdir(), name));
  const vaultPath = join(root, 'vault');
  const sourcePath = join(vaultPath, 'Agents');
  const agentsPath = join(vaultPath, '.agents');
  const paths = createObsidianAgentsDataPaths({
    dataRoot: join(root, 'chc-data'),
  });
  await mkdir(vaultPath, { recursive: true });
  return { root, vaultPath, sourcePath, agentsPath, paths };
}

function input(fixture: Awaited<ReturnType<typeof createFixture>>) {
  return {
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

  test('links an existing visible Agents source without changing its files', async () => {
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

  test('blocks empty and populated .agents directories without mutation', async () => {
    for (const populated of [false, true]) {
      const fixture = await createFixture();
      await mkdir(fixture.agentsPath);
      if (populated)
        await writeFile(join(fixture.agentsPath, 'keep.txt'), 'keep');
      const before = await readdir(fixture.vaultPath);
      await expect(
        createObsidianAgentsSetupPlan(fixture.paths, input(fixture)),
      ).rejects.toThrow(/Relocate it manually/);
      expect(await readdir(fixture.vaultPath)).toEqual(before);
      expect(await Bun.file(fixture.paths.configPath).exists()).toBe(false);
      if (populated)
        expect(
          await readFile(join(fixture.agentsPath, 'keep.txt'), 'utf8'),
        ).toBe('keep');
    }
  });

  test('unrelated Git metadata produces no diagnostics or special behavior', async () => {
    const fixture = await createFixture();
    const plan = await createObsidianAgentsSetupPlan(
      fixture.paths,
      input(fixture),
    );
    await applyObsidianAgentsSetup(fixture.paths, plan);
    const before = await inspectObsidianAgentsStatus({ paths: fixture.paths });
    await mkdir(join(fixture.sourcePath, '.git'));
    await writeFile(join(fixture.sourcePath, '.git', 'config'), 'untouched');
    const after = await inspectObsidianAgentsStatus({ paths: fixture.paths });
    expect(after).toEqual(before);
    expect(
      await readFile(join(fixture.sourcePath, '.git', 'config'), 'utf8'),
    ).toBe('untouched');
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
      vaultPath: fixture.vaultPath,
    });
    expect(status.vaults[0]?.configured).toBe(false);

    const plan = await createObsidianAgentsSetupPlan(
      fixture.paths,
      input(fixture),
    );
    await applyObsidianAgentsSetup(fixture.paths, plan);
    await rm(fixture.sourcePath, { recursive: true });
    const configuredBefore = await readdir(fixture.vaultPath);
    const broken = await inspectObsidianAgentsStatus({ paths: fixture.paths });
    const configuredAfter = await readdir(fixture.vaultPath);
    expect(broken.vaults[0]?.link.status).toBe('broken');
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
    ).rejects.toThrow(/Relocate it manually/);
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
    const escapedSource = join(linkedParent, 'Agents');
    await mkdir(join(outside, 'Agents'), { recursive: true });
    await createObsidianAgentsDirectoryLink(linkedParent, outside);

    await expect(
      createObsidianAgentsSetupPlan(fixture.paths, {
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
    const topology = await inspectObsidianAgentsTopology(setupProfile(fixture));
    expect(topology.agents.resolvedTarget).toBeDefined();
    await expect(
      sameCanonicalPath(topology.agents.resolvedTarget ?? '', secondTarget),
    ).resolves.toBe(true);
  });

  test('selects junctions on Windows and directory symlinks elsewhere', () => {
    expect(getObsidianAgentsLinkType('win32')).toBe('junction');
    expect(getObsidianAgentsLinkType('linux')).toBe('symbolic_link');
    expect(getObsidianAgentsLinkType('darwin')).toBe('symbolic_link');
  });
});

function setupProfile(fixture: Awaited<ReturnType<typeof createFixture>>) {
  return {
    vaultPath: fixture.vaultPath,
    sourcePath: fixture.sourcePath,
    agentsPath: fixture.agentsPath,
  };
}
