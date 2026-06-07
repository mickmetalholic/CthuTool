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
  await writeJson(join(pluginRoot, 'hooks', 'hooks.json'), {
    hooks: {
      UserPromptSubmit: [
        {
          hooks: [
            {
              type: 'command',
              command: 'node "<PLUGIN_ROOT>/scripts/language-coach.mjs"',
              timeout: 5,
            },
          ],
        },
      ],
    },
  });
}

function stripAnsi(value: string): string {
  return value.replace(
    new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g'),
    '',
  );
}

describe('codex config command', () => {
  test('does not expose a codex plugins command', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));

    const result = await runCli([
      'codex',
      'plugins',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
      '--json',
    ]);

    expect(result.code).not.toBe(0);
  });

  test('installs repository plugin manifests and syncs plugin cache', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const pluginsRoot = join(repoRoot, 'codex', 'plugins');
    const marketplace = join(
      homeRoot,
      '.agents',
      'plugins',
      'marketplace.json',
    );
    const cacheRoot = join(homeRoot, '.codex', 'plugins', 'cache', 'personal');
    await mkdir(pluginsRoot, { recursive: true });
    await writePlugin(pluginsRoot, 'cthu-codex');
    await writeJson(join(repoRoot, 'codex', 'plugins.manifest.json'), {
      version: 1,
      plugins: [
        {
          name: 'cthu-codex',
          source: 'repo',
          path: 'codex/plugins/cthu-codex',
          enabled: true,
        },
      ],
    });

    const result = await runCli([
      'codex',
      'install',
      '--repo-root',
      repoRoot,
      '--marketplace',
      marketplace,
      '--home',
      homeRoot,
      '--cache-root',
      cacheRoot,
      '--json',
    ]);

    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.out);
    expect(parsed.command).toBe('codex install');
    expect(parsed.result.installedPlugins).toEqual([
      { name: 'cthu-codex', action: 'installed' },
    ]);
    expect(parsed.result.syncedPluginCaches).toEqual([
      { name: 'cthu-codex', action: 'synced', version: '0.1.0' },
    ]);
    expect(
      await readFile(
        join(cacheRoot, 'cthu-codex', '0.1.0', 'hooks', 'hooks.json'),
        'utf8',
      ),
    ).not.toContain('<PLUGIN_ROOT>');
  });

  test('reports status as read-only JSON', async () => {
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

    expect(status.code).toBe(0);
    expect(JSON.parse(status.out).comparison.areas.prompts.counts.added).toBe(
      1,
    );
    expect(JSON.parse(status.out).command).toBe('codex status');
    expect(JSON.parse(status.out).comparison.missingRepoSkills).toEqual([]);
    await expect(
      stat(join(repoRoot, 'codex', 'prompts', 'daily.md')),
    ).rejects.toThrow();
  });

  test('prints enhanced status with grouped bounded changes and repo install gaps', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));

    await mkdir(join(homeRoot, '.codex', 'prompts'), { recursive: true });
    await mkdir(join(repoRoot, 'codex', 'prompts'), { recursive: true });
    await mkdir(join(homeRoot, '.codex', 'skills', 'personal-only'), {
      recursive: true,
    });
    await writeFile(
      join(homeRoot, '.codex', 'skills', 'personal-only', 'SKILL.md'),
      'personal skill',
    );
    await mkdir(join(repoRoot, 'codex', 'skills', 'repo-skill'), {
      recursive: true,
    });
    await writePlugin(join(repoRoot, 'codex', 'plugins'), 'repo-plugin');
    await writeFile(join(homeRoot, '.codex', 'prompts', 'local-only.md'), 'a');
    await writeFile(join(repoRoot, 'codex', 'prompts', 'repo-only.md'), 'b');
    await writeFile(join(homeRoot, '.codex', 'prompts', 'changed.md'), 'local');
    await writeFile(join(repoRoot, 'codex', 'prompts', 'changed.md'), 'repo');
    for (let index = 1; index <= 7; index += 1) {
      await writeFile(
        join(homeRoot, '.codex', 'prompts', `extra-${index}.md`),
        'extra',
      );
    }
    await writeJson(join(repoRoot, 'codex', 'skills.manifest.json'), {
      version: 1,
      skills: [
        {
          name: 'repo-skill',
          source: 'repo',
          path: 'codex/skills/repo-skill',
          enabled: true,
        },
        {
          name: 'external-skill',
          source: 'github',
          path: 'owner/repo',
          enabled: true,
        },
      ],
    });
    await writeJson(join(repoRoot, 'codex', 'plugins.manifest.json'), {
      version: 1,
      plugins: [
        {
          name: 'repo-plugin',
          source: 'repo',
          path: 'codex/plugins/repo-plugin',
          enabled: true,
        },
      ],
    });

    const result = await runCli([
      'codex',
      'status',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
    ]);
    const out = stripAnsi(result.out);

    expect(result.code).toBe(0);
    expect(out).toContain('Codex Status Details');
    expect(out).toContain(`local: ${join(homeRoot, '.codex')}`);
    expect(out).toContain(`repo:  ${join(repoRoot, 'codex')}`);
    expect(out).toContain('Area      Added  Removed  Modified  Unchanged');
    expect(out).toContain('prompts');
    expect(out).toContain('+ extra-1.md');
    expect(out).toContain('- repo-only.md');
    expect(out).toContain('~ changed.md');
    expect(out).toContain('... 3 more added paths');
    expect(out).toContain('Repository-owned assets not installed locally');
    expect(out).toContain('skills: repo-skill');
    expect(out).toContain('plugins: repo-plugin');
    expect(out).toContain('Repository plugins');
    expect(out).toContain('repo-plugin: not applied');
    expect(out).toContain('Local backup intent not tracked');
    expect(out).not.toContain('Unmanaged local assets');
    expect(out).toContain('skills: personal-only');
    expect(out).toContain('Unsupported restore intent');
    expect(out).toContain('skills: external-skill');
    expect(out).toContain('Next: run `chc codex install`');
  });

  test('prints repository plugin status before export generates a manifest', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    await writePlugin(join(repoRoot, 'codex', 'plugins'), 'cthu-codex');

    const result = await runCli([
      'codex',
      'status',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
    ]);
    const out = stripAnsi(result.out);

    expect(result.code).toBe(0);
    expect(out).toContain('Repository-owned assets not installed locally');
    expect(out).toContain('plugins: cthu-codex');
    expect(out).toContain('Repository plugins');
    expect(out).toContain('cthu-codex: not applied');
    expect(out).toContain('Next: run `chc codex install`');
  });

  test('exports applies and reports unsafe repository Codex config in status', async () => {
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
      await readFile(join(repoRoot, 'codex', 'prompts', 'daily.md'), 'utf8'),
    ).toBe('local');

    await writeFile(join(repoRoot, 'codex', 'prompts', 'daily.md'), 'repo');
    const blocked = await runCli([
      'codex',
      'apply',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
      '--json',
    ]);

    expect(blocked.code).not.toBe(0);
    expect(JSON.parse(blocked.out)).toMatchObject({
      ok: false,
      error: {
        code: 'invalid_option',
      },
    });
    expect(
      await readFile(join(homeRoot, '.codex', 'prompts', 'daily.md'), 'utf8'),
    ).toBe('local');

    const applied = await runCli([
      'codex',
      'apply',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
      '--json',
      '--yes',
    ]);

    expect(applied.code).toBe(0);
    expect(
      await readFile(join(homeRoot, '.codex', 'prompts', 'daily.md'), 'utf8'),
    ).toBe('repo');

    await writeFile(join(repoRoot, 'codex', 'auth.json'), '{}');
    const status = await runCli([
      'codex',
      'status',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
      '--json',
    ]);

    expect(status.code).not.toBe(0);
    expect(JSON.parse(status.out)).toMatchObject({
      ok: false,
      command: 'codex status',
      comparison: {
        unsafeRepoPaths: ['auth.json'],
      },
    });
  });

  test('applies missing repository config without overwrite confirmation', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    await mkdir(join(repoRoot, 'codex', 'prompts'), { recursive: true });
    await writeFile(join(repoRoot, 'codex', 'prompts', 'daily.md'), 'repo');

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
    expect(JSON.parse(applied.out)).toMatchObject({
      ok: true,
      command: 'codex apply',
    });
    expect(
      await readFile(join(homeRoot, '.codex', 'prompts', 'daily.md'), 'utf8'),
    ).toBe('repo');
  });

  test('does not expose codex diff or codex doctor commands', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));

    for (const command of ['diff', 'doctor']) {
      const result = await runCli([
        'codex',
        command,
        '--repo-root',
        repoRoot,
        '--home',
        homeRoot,
        '--json',
      ]);

      expect(result.code).not.toBe(0);
    }
  });
});
