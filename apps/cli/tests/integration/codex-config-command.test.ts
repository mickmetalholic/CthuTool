import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

async function runCli(args: string[]) {
  const proc = Bun.spawn(['bun', 'run', 'src/index.ts', ...args], {
    cwd: cliRoot,
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: 'ignore',
  });

  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { code, out, err };
}

async function writeJson(path: string, value: unknown) {
  await writeFile(path, JSON.stringify(value, null, 2), 'utf8');
}

async function writePlugin(root: string, name: string) {
  const pluginRoot = join(root, name);
  await mkdir(join(pluginRoot, '.codex-plugin'), { recursive: true });
  await writeJson(join(pluginRoot, '.codex-plugin', 'plugin.json'), {
    name,
    version: '0.1.0',
    interface: { displayName: name },
  });
  await mkdir(join(pluginRoot, 'hooks'), { recursive: true });
  await writeJson(join(pluginRoot, 'hooks', 'hooks.json'), { hooks: {} });
}

describe('codex config command', () => {
  test('runs plugin workflow from codex plugins', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const pluginsRoot = join(repoRoot, 'packages', 'codex-plugins', 'plugins');
    const marketplace = join(
      homeRoot,
      '.agents',
      'plugins',
      'marketplace.json',
    );
    await mkdir(pluginsRoot, { recursive: true });
    await writePlugin(pluginsRoot, 'english-coach');

    const result = await runCli([
      'codex',
      'plugins',
      '--plugins-root',
      pluginsRoot,
      '--marketplace',
      marketplace,
      '--home',
      homeRoot,
      '--plugin',
      'english-coach',
      '--json',
    ]);

    expect(result.code).toBe(0);
    expect(result.err).toBe('');
    expect(JSON.parse(result.out)).toMatchObject({
      ok: true,
      command: 'codex plugins',
      results: [{ name: 'english-coach', action: 'installed' }],
    });
  });

  test('syncs selected plugin cache from codex plugins', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const pluginsRoot = join(repoRoot, 'packages', 'codex-plugins', 'plugins');
    const marketplace = join(
      homeRoot,
      '.agents',
      'plugins',
      'marketplace.json',
    );
    const cacheRoot = join(homeRoot, '.codex', 'plugins', 'cache', 'personal');
    await mkdir(pluginsRoot, { recursive: true });
    await writePlugin(pluginsRoot, 'english-coach');

    const result = await runCli([
      'codex',
      'plugins',
      '--plugins-root',
      pluginsRoot,
      '--marketplace',
      marketplace,
      '--home',
      homeRoot,
      '--cache-root',
      cacheRoot,
      '--plugin',
      'english-coach',
      '--sync-cache',
      '--json',
    ]);

    expect(result.code).toBe(0);
    expect(JSON.parse(result.out).results).toContainEqual({
      name: 'english-coach',
      action: 'synced',
      version: '0.1.0',
    });
    expect(
      await readFile(
        join(cacheRoot, 'english-coach', '0.1.0', 'hooks', 'hooks.json'),
        'utf8',
      ),
    ).toContain('hooks');
  });

  test('reports status and diff as read-only JSON', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    await mkdir(join(homeRoot, '.codex', 'prompts'), { recursive: true });
    await writeFile(join(homeRoot, '.codex', 'prompts', 'daily.md'), 'local');

    const status = await runCli([
      'codex',
      'status',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
      '--json',
    ]);
    const diff = await runCli([
      'codex',
      'diff',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
      '--json',
    ]);

    expect(status.code).toBe(0);
    expect(diff.code).toBe(0);
    expect(JSON.parse(status.out).comparison.areas.prompts.counts.added).toBe(
      1,
    );
    expect(JSON.parse(diff.out).command).toBe('codex diff');
    await expect(
      stat(join(repoRoot, '.codex', 'prompts', 'daily.md')),
    ).rejects.toThrow();
  });

  test('exports applies and doctors repository Codex config', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    await mkdir(join(homeRoot, '.codex', 'prompts'), { recursive: true });
    await writeFile(join(homeRoot, '.codex', 'prompts', 'daily.md'), 'local');

    const exported = await runCli([
      'codex',
      'export',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
      '--json',
    ]);

    expect(exported.code).toBe(0);
    expect(JSON.parse(exported.out)).toMatchObject({
      ok: true,
      command: 'codex export',
    });
    expect(
      await readFile(join(repoRoot, '.codex', 'prompts', 'daily.md'), 'utf8'),
    ).toBe('local');

    await writeFile(join(repoRoot, '.codex', 'prompts', 'daily.md'), 'repo');
    const applied = await runCli([
      'codex',
      'apply',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
      '--json',
    ]);

    expect(applied.code).toBe(0);
    expect(
      await readFile(join(homeRoot, '.codex', 'prompts', 'daily.md'), 'utf8'),
    ).toBe('repo');

    await writeFile(join(repoRoot, '.codex', 'auth.json'), '{}');
    const doctor = await runCli([
      'codex',
      'doctor',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
      '--json',
    ]);

    expect(doctor.code).not.toBe(0);
    expect(JSON.parse(doctor.out)).toMatchObject({
      ok: false,
      command: 'codex doctor',
      unsafePaths: ['auth.json'],
    });
  });
});
