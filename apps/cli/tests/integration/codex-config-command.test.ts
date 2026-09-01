import { describe, expect, test } from 'bun:test';
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runSkills,
  type SkillsInteraction,
} from '../../src/command/codex.command';
import type { SkillsBackend } from '../../src/domain/codex-skills-backend';
import type { ObservedCliCommandScope } from '../../src/runtime/command-diagnostics';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

async function runCli(args: string[], env: NodeJS.ProcessEnv = {}) {
  const proc = Bun.spawn(['bun', 'run', 'src/index.ts', ...args], {
    cwd: cliRoot,
    env: { ...process.env, ...env },
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

async function createFakeNpx(
  root: string,
  installed: readonly { readonly name: string; readonly path: string }[],
): Promise<string> {
  const binRoot = join(root, 'bin');
  const scriptPath = join(binRoot, 'fake-npx.mjs');
  const script = `const args = process.argv.slice(2);\nif (args.includes('list')) {\n  process.stdout.write(${JSON.stringify(JSON.stringify(installed))});\n} else {\n  process.stderr.write('unexpected fake npx args: ' + args.join(' '));\n  process.exitCode = 1;\n}\n`;
  await mkdir(binRoot, { recursive: true });
  await writeFile(scriptPath, script, 'utf8');
  if (process.platform === 'win32') {
    await writeFile(
      join(binRoot, 'npx.cmd'),
      `@"${process.execPath}" "${scriptPath}" %*\r\n`,
      'utf8',
    );
  } else {
    const executable = join(binRoot, 'npx');
    await writeFile(executable, `#!/usr/bin/env node\n${script}`, 'utf8');
    await chmod(executable, 0o755);
  }
  return binRoot;
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
    const binRoot = await createFakeNpx(homeRoot, []);

    const before = await readFile(
      join(repoRoot, 'codex', 'skills.manifest.json'),
      'utf8',
    );
    const result = await runCli(
      [
        'codex',
        'skills',
        '--repo-root',
        repoRoot,
        '--home',
        homeRoot,
        '--json',
      ],
      { PATH: `${binRoot}${delimiter}${process.env.PATH ?? ''}` },
    );

    expect(result.code).toBe(0);
    expect(result.err).toBe('');
    expect(JSON.parse(result.out)).toEqual({
      ok: true,
      command: 'codex skills',
      result: {
        manifestVersion: 2,
        skills: [],
        legacyEntries: [],
      },
    });
    expect(
      await readFile(join(repoRoot, 'codex', 'skills.manifest.json'), 'utf8'),
    ).toBe(before);
  });

  test('lists only provenance-backed local GitHub skills in read-only JSON', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const manifestPath = join(repoRoot, 'codex', 'skills.manifest.json');
    await writeJson(manifestPath, { version: 2, skills: [] });
    await writeJson(join(homeRoot, '.agents', '.skill-lock.json'), {
      version: 3,
      skills: {
        'grill-me': {
          sourceType: 'github',
          source: 'mattpocock/skills',
          ref: 'main',
          skillPath: 'skills/grill-me/SKILL.md',
          skillFolderHash: 'tree-sha',
        },
        'well-known': {
          sourceType: 'well-known',
          source: 'example.com',
          sourceUrl: 'https://example.com/.well-known/skills/example/SKILL.md',
          skillFolderHash: 'tree-sha',
        },
      },
    });
    const binRoot = await createFakeNpx(homeRoot, [
      { name: 'grill-me', path: join(homeRoot, '.codex/skills/grill-me') },
      { name: 'well-known', path: join(homeRoot, '.codex/skills/well-known') },
      { name: 'manual', path: join(homeRoot, '.codex/skills/manual') },
    ]);
    const before = await readFile(manifestPath, 'utf8');

    const result = await runCli(
      [
        'codex',
        'skills',
        '--repo-root',
        repoRoot,
        '--home',
        homeRoot,
        '--json',
      ],
      { PATH: `${binRoot}${delimiter}${process.env.PATH ?? ''}` },
    );

    expect(result.code).toBe(0);
    expect(result.err).toBe('');
    expect(JSON.parse(result.out).result.skills).toEqual([
      {
        name: 'grill-me',
        source: 'mattpocock/skills:grill-me@main',
        state: 'local_only',
        installedPath: join(homeRoot, '.codex/skills/grill-me'),
        installedManaged: true,
        availableActions: ['none', 'track'],
        localGitHubCandidate: {
          repository: 'mattpocock/skills',
          selector: 'grill-me',
          skillPath: 'skills/grill-me/SKILL.md',
          ref: 'main',
        },
      },
    ]);
    expect(await readFile(manifestPath, 'utf8')).toBe(before);
  });

  test('tracks a reviewed local-only skill without a lifecycle mutation', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const lifecycleCalls: string[] = [];
    const backend: SkillsBackend = {
      listInstalled: async () => [
        {
          name: 'grill-me',
          path: join(homeRoot, '.codex/skills/grill-me'),
          managed: true,
          repository: 'mattpocock/skills',
          localGitHubCandidate: {
            repository: 'mattpocock/skills',
            selector: 'grill-me',
            skillPath: 'skills/grill-me/SKILL.md',
            ref: 'main',
          },
        },
      ],
      discover: async () => [],
      validate: async () => {},
      checkUpdates: async () => new Set(),
      install: async () => {
        lifecycleCalls.push('install');
      },
      update: async () => {
        lifecycleCalls.push('update');
      },
      remove: async () => {
        lifecycleCalls.push('remove');
      },
    };
    const interaction: SkillsInteraction = {
      chooseMode: async () => 'manage',
      chooseManagedActions: async () => [{ name: 'grill-me', action: 'track' }],
      requestRepository: async () => undefined,
      chooseDiscoveredNames: async () => undefined,
      chooseTrackingType: async () => 'branch',
      requestTrackingRef: async () => 'main',
      confirmPlan: async () => true,
    };
    const scope: ObservedCliCommandScope = {
      context: {
        isTty: true,
        interactive: true,
        json: false,
        quiet: true,
      },
      complete() {},
      fail() {},
    };

    await runSkills({ repoRoot, home: homeRoot }, scope, {
      createBackend: () => backend,
      interaction,
    });

    expect(lifecycleCalls).toEqual([]);
    expect(
      JSON.parse(
        await readFile(join(repoRoot, 'codex', 'skills.manifest.json'), 'utf8'),
      ).skills,
    ).toEqual([
      {
        name: 'grill-me',
        source: 'github',
        repository: 'mattpocock/skills',
        selector: 'grill-me',
        tracking: { type: 'branch', ref: 'main' },
        enabled: true,
      },
    ]);
  });

  test('reports legacy names without migrating local skills', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    await writeJson(join(repoRoot, 'codex', 'skills.manifest.json'), {
      version: 1,
      skills: [
        { name: 'old-skill', source: 'external', path: 'skill:old-skill' },
      ],
    });
    const binRoot = await createFakeNpx(homeRoot, []);

    const result = await runCli(
      [
        'codex',
        'skills',
        '--repo-root',
        repoRoot,
        '--home',
        homeRoot,
        '--json',
      ],
      { PATH: `${binRoot}${delimiter}${process.env.PATH ?? ''}` },
    );
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
