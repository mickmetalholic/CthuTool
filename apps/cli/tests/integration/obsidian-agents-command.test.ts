import { afterEach, describe, expect, test } from 'bun:test';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createObsidianAgentsDirectoryLink } from '../../src/domain/obsidian-agents-service';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'cthutool-obsidian-cli-'));
  roots.push(root);
  const vaultPath = join(root, 'Notes');
  const dataRoot = join(root, 'chc-data');
  await mkdir(vaultPath);
  return {
    root,
    vaultPath,
    dataRoot,
    sourcePath: join(vaultPath, 'Agents'),
    agentsPath: join(vaultPath, '.agents'),
  };
}
async function runCli(args: string[], env: Record<string, string> = {}) {
  const proc = Bun.spawn(
    ['bun', 'run', 'src/index.ts', 'obsidian', 'agents', ...args],
    {
      cwd: cliRoot,
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', ...env },
      stdin: 'ignore',
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { out, err, code };
}
function jsonArgs(dataRoot: string) {
  return ['--data-root', dataRoot, '--json', '--no-interactive'];
}
async function setup(vaultPath: string, dataRoot: string) {
  const result = await runCli([
    'setup',
    '--vault',
    vaultPath,
    '--yes',
    ...jsonArgs(dataRoot),
  ]);
  expect(result.code).toBe(0);
  expect(result.err).toBe('');
  return JSON.parse(result.out).result;
}

describe('Obsidian agents CLI', () => {
  test('sets up without IDs and reuses aliases without duplicating configurations', async () => {
    const f = await fixture();
    const canonical = await realpath(f.vaultPath);
    expect(await setup(f.vaultPath, f.dataRoot)).toMatchObject({
      status: 'configured',
      vault: {
        vaultPath: canonical,
        sourcePath: join(canonical, 'Agents'),
        agentsPath: join(canonical, '.agents'),
      },
      transition: 'create',
    });
    const alias = join(f.root, 'alias');
    await symlink(
      f.vaultPath,
      alias,
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    expect(await setup(alias, f.dataRoot)).toMatchObject({
      transition: 'reuse',
    });
    const withAliasSource = await runCli([
      'setup',
      '--vault',
      alias,
      '--source-path',
      join(alias, 'Agents'),
      '--yes',
      ...jsonArgs(f.dataRoot),
    ]);
    expect(withAliasSource.code).toBe(0);
    const config = JSON.parse(
      await readFile(join(f.dataRoot, 'obsidian-agents.json'), 'utf8'),
    );
    expect(config.version).toBe(3);
    expect(config.vaults).toHaveLength(1);
    expect(config).not.toHaveProperty('defaultProfile');
    expect(config.vaults[0]).not.toHaveProperty('id');
    expect(
      await readFile(join(f.agentsPath, 'skills', 'missing.md'), 'utf8').catch(
        () => 'missing',
      ),
    ).toBe('missing');
    const report = await runCli(['status', ...jsonArgs(f.dataRoot)]);
    expect(JSON.parse(report.out)).toMatchObject({
      ok: true,
      result: {
        summary: { total: 1, healthy: 1, needsAttention: 0 },
        vaults: [
          {
            configured: true,
            healthy: true,
            issues: [],
            link: { status: 'correct' },
          },
        ],
      },
    });
    expect(report.out).not.toMatch(
      /"(?:id|profile|legacy|consistency|warnings)":/,
    );
  });
  test('reports all vaults by path order, filters aliases, and retains missing entries', async () => {
    const f = await fixture();
    await setup(f.vaultPath, f.dataRoot);
    const second = join(f.root, 'Other', 'Notes');
    await mkdir(second, { recursive: true });
    await setup(second, f.dataRoot);
    await unlink(join(second, '.agents'));
    const before = await readFile(
      join(f.dataRoot, 'obsidian-agents.json'),
      'utf8',
    );
    const result = await runCli(['status', ...jsonArgs(f.dataRoot)]);
    expect(result.code).toBe(0);
    const report = JSON.parse(result.out).result;
    expect(report.summary).toEqual({ total: 2, healthy: 1, needsAttention: 1 });
    expect(
      report.vaults.map((entry: { vaultPath: string }) => entry.vaultPath),
    ).toEqual([await realpath(f.vaultPath), await realpath(second)].sort());
    const alias = join(f.root, 'alias');
    await symlink(
      f.vaultPath,
      alias,
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    expect(
      JSON.parse(
        (await runCli(['status', '--vault', alias, ...jsonArgs(f.dataRoot)]))
          .out,
      ).result.summary.total,
    ).toBe(1);
    const unknown = JSON.parse(
      (
        await runCli([
          'status',
          '--vault',
          join(f.root, 'Unknown'),
          ...jsonArgs(f.dataRoot),
        ])
      ).out,
    ).result;
    expect(unknown.vaults).toHaveLength(1);
    expect(unknown.vaults[0].configured).toBe(false);
    expect(unknown.vaults[0].vaultPath).toContain('Unknown');
    await rm(second, { recursive: true });
    const missing = JSON.parse(
      (await runCli(['status', ...jsonArgs(f.dataRoot)])).out,
    ).result;
    expect(missing.vaults).toHaveLength(2);
    expect(missing.vaults[1].paths.vaultExists).toBe(false);
    expect(
      await readFile(join(f.dataRoot, 'obsidian-agents.json'), 'utf8'),
    ).toBe(before);
  });
  test('empty status is read-only with a stable JSON array and human invitation', async () => {
    const f = await fixture();
    const result = await runCli(['status', ...jsonArgs(f.dataRoot)]);
    expect(JSON.parse(result.out).result).toEqual({
      summary: { total: 0, healthy: 0, needsAttention: 0 },
      vaults: [],
    });
    expect(
      await Bun.file(join(f.dataRoot, 'obsidian-agents.json')).exists(),
    ).toBe(false);
    const human = await runCli(['status', '--data-root', f.dataRoot]);
    expect(human.out).toContain('No vaults configured.');
    expect(human.out).toContain('chc obsidian agents setup');
    expect(human.out).not.toContain('READY');
  });
  test('reports mismatch, broken link, and occupied directory without mutation', async () => {
    const f = await fixture();
    await setup(f.vaultPath, f.dataRoot);
    const oldTarget = join(f.vaultPath, 'OldAgent');
    await mkdir(oldTarget);
    await unlink(f.agentsPath);
    await createObsidianAgentsDirectoryLink(f.agentsPath, oldTarget);
    const mismatch = await runCli(['status', '--data-root', f.dataRoot]);
    expect(mismatch.out).toContain('NEEDS ATTENTION');
    expect(mismatch.out).toContain('Link target mismatch');
    expect(mismatch.out.replace(/\n\s+/g, '')).toContain(oldTarget);
    await rm(oldTarget, { recursive: true });
    const before = await readdir(f.vaultPath);
    expect(
      JSON.parse((await runCli(['status', ...jsonArgs(f.dataRoot)])).out).result
        .vaults[0].link.status,
    ).toBe('broken');
    expect(await readdir(f.vaultPath)).toEqual(before);
    await unlink(f.agentsPath);
    await mkdir(f.agentsPath);
    await writeFile(join(f.agentsPath, 'keep.txt'), 'keep');
    const conflict = await runCli([
      'setup',
      '--vault',
      f.vaultPath,
      '--yes',
      ...jsonArgs(f.dataRoot),
    ]);
    expect(conflict.code).not.toBe(0);
    expect(JSON.parse(conflict.out).error.message).toContain(
      'Relocate it manually',
    );
    expect(await readFile(join(f.agentsPath, 'keep.txt'), 'utf8')).toBe('keep');
    expect((await runCli(['status', '--data-root', f.dataRoot])).out).toContain(
      'Relocate',
    );
  });
  test('human output is styled by hierarchy, plain when redirected, and quiet when requested', async () => {
    const f = await fixture();
    await setup(f.vaultPath, f.dataRoot);
    const human = await runCli(['status', '--data-root', f.dataRoot], {
      FORCE_COLOR: '1',
    });
    expect(human.out).toContain('Obsidian Agents');
    expect(human.out).toContain('1 vault  /  1 ready');
    expect(human.out).toContain('READY');
    expect(human.out).toContain('Skills OK  /  State OK');
    expect(human.out).not.toContain('\x1b');
    expect(human.out).not.toMatch(/warning|consistency|legacy/);
    expect(
      (await runCli(['status', '--data-root', f.dataRoot, '--quiet'])).out,
    ).toBe('');
  });
  test('requires a vault each time and rejects unsafe sources and removed profile options', async () => {
    const f = await fixture();
    await setup(f.vaultPath, f.dataRoot);
    const missing = await runCli(['setup', ...jsonArgs(f.dataRoot)]);
    expect(JSON.parse(missing.out)).toMatchObject({
      ok: false,
      error: { code: 'missing_required_argument' },
    });
    const invalid = await runCli([
      'setup',
      '--vault',
      f.vaultPath,
      '--source-path',
      join(f.root, 'outside'),
      '--yes',
      ...jsonArgs(f.dataRoot),
    ]);
    expect(invalid.code).not.toBe(0);
    for (const operation of ['setup', 'status']) {
      const removed = await runCli([
        operation,
        '--profile',
        'old',
        ...jsonArgs(f.dataRoot),
      ]);
      expect(removed.code).not.toBe(0);
      expect(JSON.parse(removed.out).error.message).toContain('--vault');
    }
  });
  test('exposes only setup and status operations', async () => {
    const result = await runCli(['sync']);
    expect(result.code).not.toBe(0);
    expect(result.out).toContain('setup');
    expect(result.out).toContain('status');
    expect(result.err).toContain('Unknown command `sync`');
  });
});
