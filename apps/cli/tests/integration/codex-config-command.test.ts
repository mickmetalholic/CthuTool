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
  return {
    out: await new Response(proc.stdout).text(),
    err: await new Response(proc.stderr).text(),
    code: await proc.exited,
  };
}

async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
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
  await writeJson(join(pluginRoot, '.mcp.json'), {
    mcpServers: {
      sample: {
        command: 'node',
        args: ['$' + '{PLUGIN_ROOT}/server.mjs'],
      },
    },
  });
  await writeJson(join(pluginRoot, 'hooks', 'hooks.json'), {
    hooks: {
      UserPromptSubmit: [
        {
          hooks: [
            {
              type: 'command',
              command: 'node "<PLUGIN_ROOT>/language-coach.mjs"',
              timeout: 5,
            },
          ],
        },
      ],
    },
  });
}

describe('codex command boundary', () => {
  test('bare help exposes exactly skills and install', async () => {
    const result = await runCli(['codex']);
    expect(result.code).toBe(0);
    expect(result.err).toBe('');
    expect(result.out).toContain('skills');
    expect(result.out).toContain('install');
    for (const retired of ['status', 'export', 'apply']) {
      expect(result.out).not.toMatch(new RegExp(`\\b${retired}\\b`));
    }
  });

  test('rejects every retired subcommand without touching state', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    for (const retired of ['status', 'export', 'apply', 'plugins']) {
      const result = await runCli(['codex', retired, '--repo-root', repoRoot]);
      expect(result.code).not.toBe(0);
      expect(result.err).toContain('Unknown command');
    }
    await expect(stat(join(repoRoot, 'codex'))).rejects.toThrow();
  });

  test('prints an empty, read-only version 2 skills snapshot as JSON', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    await writeJson(join(repoRoot, 'codex', 'skills.manifest.json'), {
      version: 2,
      skills: [],
    });

    const before = await readFile(
      join(repoRoot, 'codex', 'skills.manifest.json'),
      'utf8',
    );
    const result = await runCli([
      'codex',
      'skills',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
      '--json',
    ]);

    expect(result.code).toBe(0);
    expect(result.err).toBe('');
    expect(JSON.parse(result.out)).toEqual({
      ok: true,
      command: 'codex skills',
      result: { manifestVersion: 2, skills: [], legacyEntries: [] },
    });
    expect(
      await readFile(join(repoRoot, 'codex', 'skills.manifest.json'), 'utf8'),
    ).toBe(before);
  });

  test('reports legacy names without migrating or querying local skills', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    await writeJson(join(repoRoot, 'codex', 'skills.manifest.json'), {
      version: 1,
      skills: [
        { name: 'old-skill', source: 'external', path: 'skill:old-skill' },
      ],
    });

    const result = await runCli([
      'codex',
      'skills',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
      '--json',
    ]);
    const parsed = JSON.parse(result.out);
    expect(result.code).toBe(0);
    expect(parsed.result.legacyEntries).toEqual(['old-skill']);
    expect(parsed.result.skills[0]).toMatchObject({
      name: 'old-skill',
      state: 'legacy',
    });
  });

  test('fails safely when the skills UI has no TTY', async () => {
    const result = await runCli(['codex', 'skills']);
    expect(result.code).not.toBe(0);
    expect(result.out).toBe('');
    expect(result.err).toContain('requires an interactive terminal');
    expect(result.err).toContain('--json');
  });

  test('installs enabled repository plugins only and preserves plugin behavior', async () => {
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
    await writePlugin(pluginsRoot, 'enabled-plugin');
    await writePlugin(pluginsRoot, 'disabled-plugin');
    await writeJson(join(repoRoot, 'codex', 'plugins.manifest.json'), {
      version: 1,
      plugins: [
        {
          name: 'disabled-plugin',
          source: 'repo',
          path: 'codex/plugins/disabled-plugin',
          enabled: false,
        },
      ],
    });
    await writeFile(join(repoRoot, 'codex', 'skills.manifest.json'), '{');
    await mkdir(join(repoRoot, 'codex', 'skills', 'ignored-skill'), {
      recursive: true,
    });
    await mkdir(join(homeRoot, '.codex', 'rules'), { recursive: true });
    await writeFile(
      join(homeRoot, '.codex', 'rules', 'personal.rules'),
      'leave unchanged',
    );

    const result = await runCli([
      'codex',
      'install',
      '--repo-root',
      repoRoot,
      '--home',
      homeRoot,
      '--marketplace',
      marketplace,
      '--cache-root',
      cacheRoot,
      '--json',
    ]);
    const parsed = JSON.parse(result.out);

    expect(result.code).toBe(0);
    expect(parsed.command).toBe('codex install');
    expect(parsed.result.installedPlugins).toEqual([
      { name: 'enabled-plugin', action: 'installed' },
    ]);
    const marketplaceValue = JSON.parse(await readFile(marketplace, 'utf8'));
    expect(
      marketplaceValue.plugins.map((plugin: { name: string }) => plugin.name),
    ).toEqual(['enabled-plugin']);
    expect(
      await readFile(
        join(cacheRoot, 'enabled-plugin', '0.1.0', 'hooks', 'hooks.json'),
        'utf8',
      ),
    ).not.toContain('<PLUGIN_ROOT>');
    expect(
      await readFile(
        join(cacheRoot, 'enabled-plugin', '0.1.0', '.mcp.json'),
        'utf8',
      ),
    ).toContain('$' + '{PLUGIN_ROOT}');
    await expect(stat(join(cacheRoot, 'disabled-plugin'))).rejects.toThrow();
    expect(
      await readFile(join(homeRoot, '.codex', 'config.toml'), 'utf8'),
    ).toContain('[plugins."enabled-plugin@personal"]');
    expect(
      await readFile(
        join(homeRoot, '.codex', 'rules', 'personal.rules'),
        'utf8',
      ),
    ).toBe('leave unchanged');
  });
});
