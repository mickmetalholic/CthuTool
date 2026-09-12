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
  selectCodexPluginSource,
} from '../../src/command/codex.command';
import type { SkillsBackend } from '../../src/domain/codex-skills-backend';
import type { ObservedCliCommandScope } from '../../src/runtime/command-diagnostics';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

async function runCli(
  args: string[],
  env: NodeJS.ProcessEnv = {},
  cwd = cliRoot,
) {
  const proc = Bun.spawn(
    ['bun', 'run', join(cliRoot, 'src/index.ts'), ...args],
    {
      cwd,
      env: { ...process.env, ...env },
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'ignore',
    },
  );
  return {
    out: await new Response(proc.stdout).text(),
    err: await new Response(proc.stderr).text(),
    code: await proc.exited,
  };
}

async function createFakeNpx(
  root: string,
  installed: readonly { readonly name: string; readonly path: string }[],
): Promise<{ binRoot: string; scriptPath: string }> {
  const binRoot = join(root, 'bin');
  const scriptPath = join(binRoot, 'fake-npx.mjs');
  const script = `const args = process.argv.slice(2);\nif (args[0] === '--yes' && args[1] === 'skills@1.5.19' && args.includes('list')) {\n  process.stdout.write(${JSON.stringify(JSON.stringify(installed))});\n} else {\n  process.stderr.write('unexpected fake npx args: ' + args.join(' '));\n  process.exitCode = 1;\n}\n`;
  await mkdir(binRoot, { recursive: true });
  await writeFile(scriptPath, script, 'utf8');
  if (process.platform !== 'win32') {
    const executable = join(binRoot, 'npx');
    await writeFile(executable, `#!/usr/bin/env node\n${script}`, 'utf8');
    await chmod(executable, 0o755);
  }
  return { binRoot, scriptPath };
}

function fakeNpxEnv(fake: {
  binRoot: string;
  scriptPath: string;
}): NodeJS.ProcessEnv {
  return {
    PATH: `${fake.binRoot}${delimiter}${process.env.PATH ?? ''}`,
    ...(process.platform === 'win32'
      ? { CHC_SKILLS_NPX_CLI_PATH: fake.scriptPath }
      : {}),
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
  test('first interactive install selects a valid repository and marks it for saving', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    await writePlugin(join(repoRoot, 'codex', 'plugins'), 'sample-plugin');
    let offeredPath: string | undefined;
    const scope: ObservedCliCommandScope = {
      context: { isTty: true, interactive: true, json: false, quiet: true },
      complete() {},
      fail() {},
    };
    const selection = await selectCodexPluginSource({ home: homeRoot }, scope, {
      async requestPath(initialValue) {
        offeredPath = initialValue;
        return repoRoot;
      },
    });
    expect(offeredPath).toBeTruthy();
    expect(selection).toEqual({
      repoRoot,
      origin: 'selected',
      saveDefault: true,
    });
  });

  test('interactive change offers the saved path and selects a replacement', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const previousRepo = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const nextRepo = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    await writePlugin(join(previousRepo, 'codex', 'plugins'), 'old-plugin');
    await writePlugin(join(nextRepo, 'codex', 'plugins'), 'new-plugin');
    await writeJson(
      join(homeRoot, '.cthutool', 'codex', 'plugin-source.json'),
      { version: 1, repoRoot: previousRepo },
    );
    const scope: ObservedCliCommandScope = {
      context: { isTty: true, interactive: true, json: false, quiet: true },
      complete() {},
      fail() {},
    };
    const reused = await selectCodexPluginSource({ home: homeRoot }, scope, {
      async requestPath() {
        throw new Error('saved source should not prompt');
      },
    });
    expect(reused?.repoRoot).toBe(previousRepo);
    expect(reused?.origin).toBe('saved');

    let offeredPath: string | undefined;
    const changed = await selectCodexPluginSource(
      { home: homeRoot, changeSource: true },
      scope,
      {
        async requestPath(initialValue) {
          offeredPath = initialValue;
          return nextRepo;
        },
      },
    );
    expect(offeredPath).toBe(previousRepo);
    expect(changed).toEqual({
      repoRoot: nextRepo,
      origin: 'selected',
      saveDefault: true,
    });
  });

  test('requires a source outside a repository and can remember, reuse, and override it', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'cthutool-other-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const otherRepo = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    await writePlugin(join(repoRoot, 'codex', 'plugins'), 'first-plugin');
    await writePlugin(join(otherRepo, 'codex', 'plugins'), 'second-plugin');

    const missing = await runCli(
      ['codex', 'install', '--home', homeRoot, '--json'],
      {},
      cwd,
    );
    expect(missing.code).not.toBe(0);
    expect(JSON.parse(missing.out).error.message).toContain('--change-source');

    const selected = await runCli(
      [
        'codex',
        'install',
        '--home',
        homeRoot,
        '--change-source',
        '--repo-root',
        repoRoot,
        '--json',
      ],
      {},
      cwd,
    );
    expect(selected.code).toBe(0);
    expect(JSON.parse(selected.out).result.source).toEqual({
      repoRoot,
      origin: 'explicit',
      defaultSaved: true,
    });
    const configPath = join(
      homeRoot,
      '.cthutool',
      'codex',
      'plugin-source.json',
    );
    expect(JSON.parse(await readFile(configPath, 'utf8')).repoRoot).toBe(
      repoRoot,
    );

    const reused = await runCli(
      ['codex', 'install', '--home', homeRoot, '--json'],
      {},
      cwd,
    );
    expect(reused.code).toBe(0);
    expect(JSON.parse(reused.out).result.source.origin).toBe('saved');
    expect(JSON.parse(reused.out).result.installedPlugins[0].name).toBe(
      'first-plugin',
    );

    const human = await runCli(
      ['codex', 'install', '--home', homeRoot],
      {},
      cwd,
    );
    expect(human.code).toBe(0);
    expect(human.out).toContain(`Source  ${repoRoot} (saved)`);
    expect(human.out).toContain('first-plugin');
    expect(human.out).toContain('cache 0.1.0 synced');
    expect(human.out).toContain('Marketplace');
    expect(human.out).not.toContain('installed plugins: (none)');

    const overridden = await runCli(
      [
        'codex',
        'install',
        '--home',
        homeRoot,
        '--repo-root',
        otherRepo,
        '--json',
      ],
      {},
      cwd,
    );
    expect(overridden.code).toBe(0);
    expect(JSON.parse(overridden.out).result.source.origin).toBe('explicit');
    expect(JSON.parse(overridden.out).result.installedPlugins[0].name).toBe(
      'second-plugin',
    );
    expect(JSON.parse(await readFile(configPath, 'utf8')).repoRoot).toBe(
      repoRoot,
    );
  });

  test('reports a stale saved source and repairs it with an explicit change', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'cthutool-other-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    await writePlugin(join(repoRoot, 'codex', 'plugins'), 'sample-plugin');
    const configPath = join(
      homeRoot,
      '.cthutool',
      'codex',
      'plugin-source.json',
    );
    await writeJson(configPath, { version: 1, repoRoot: join(cwd, 'missing') });
    const stale = await runCli(
      ['codex', 'install', '--home', homeRoot, '--json'],
      {},
      cwd,
    );
    expect(stale.code).not.toBe(0);
    expect(JSON.parse(stale.out).error.message).toContain('--change-source');
    const repaired = await runCli(
      [
        'codex',
        'install',
        '--home',
        homeRoot,
        '--change-source',
        '--repo-root',
        repoRoot,
        '--json',
      ],
      {},
      cwd,
    );
    expect(repaired.code).toBe(0);
    expect(JSON.parse(await readFile(configPath, 'utf8')).repoRoot).toBe(
      repoRoot,
    );
  });

  test('explains an empty repository plugin source in human output', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'cthutool-other-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    await writeJson(join(repoRoot, 'codex', 'plugins.manifest.json'), {
      version: 1,
      plugins: [],
    });
    const result = await runCli(
      ['codex', 'install', '--home', homeRoot, '--repo-root', repoRoot],
      {},
      cwd,
    );
    expect(result.code).toBe(0);
    expect(result.out).toContain(`Source  ${repoRoot} (explicit)`);
    expect(result.out).toContain('No enabled repository plugins found');
    expect(result.out).toContain('codex/plugins.manifest.json');
  });

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
    const fakeNpx = await createFakeNpx(homeRoot, []);

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
      fakeNpxEnv(fakeNpx),
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
    const fakeNpx = await createFakeNpx(homeRoot, [
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
      fakeNpxEnv(fakeNpx),
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
    const fakeNpx = await createFakeNpx(homeRoot, []);

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
      fakeNpxEnv(fakeNpx),
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
