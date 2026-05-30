import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  applyCodexConfig,
  compareCodexConfig,
  exportCodexConfig,
  installCodexAssets,
} from '../../src/domain/codex-config-manager';
import { createCodexConfigPaths } from '../../src/infra/codex-config-paths';

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
  return pluginRoot;
}

describe('codex config manager', () => {
  test('compares prompts and rules as added removed modified and unchanged', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const paths = createCodexConfigPaths({ repoRoot, homeRoot });

    await mkdir(join(paths.localCodexRoot, 'prompts'), { recursive: true });
    await mkdir(join(paths.repoCodexRoot, 'prompts'), { recursive: true });
    await writeFile(
      join(paths.localCodexRoot, 'prompts', 'added.md'),
      'local only',
      'utf8',
    );
    await writeFile(
      join(paths.repoCodexRoot, 'prompts', 'removed.md'),
      'repo only',
      'utf8',
    );
    await writeFile(
      join(paths.localCodexRoot, 'prompts', 'modified.md'),
      'local',
      'utf8',
    );
    await writeFile(
      join(paths.repoCodexRoot, 'prompts', 'modified.md'),
      'repo',
      'utf8',
    );
    await writeFile(
      join(paths.localCodexRoot, 'prompts', 'same.md'),
      'same',
      'utf8',
    );
    await writeFile(
      join(paths.repoCodexRoot, 'prompts', 'same.md'),
      'same',
      'utf8',
    );

    const comparison = await compareCodexConfig(paths);

    expect(comparison.areas.prompts.counts).toEqual({
      added: 1,
      removed: 1,
      modified: 1,
      unchanged: 1,
    });
    expect(comparison.areas.rules.counts).toEqual({
      added: 0,
      removed: 0,
      modified: 0,
      unchanged: 0,
    });
  });

  test('ignores generated OpenSpec prompt adapters during compare export and apply', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const paths = createCodexConfigPaths({ repoRoot, homeRoot });

    await mkdir(join(paths.localCodexRoot, 'prompts'), { recursive: true });
    await mkdir(join(paths.repoCodexRoot, 'prompts'), { recursive: true });
    await writeFile(
      join(paths.localCodexRoot, 'prompts', 'opsx-propose.md'),
      'generated command adapter',
      'utf8',
    );
    await writeFile(
      join(paths.localCodexRoot, 'prompts', 'daily.md'),
      'personal prompt',
      'utf8',
    );

    const comparison = await compareCodexConfig(paths);

    expect(comparison.areas.prompts.files.added).toEqual(['daily.md']);

    await exportCodexConfig(paths);

    await expect(
      stat(join(paths.repoCodexRoot, 'prompts', 'opsx-propose.md')),
    ).rejects.toThrow();
    expect(
      await readFile(join(paths.repoCodexRoot, 'prompts', 'daily.md'), 'utf8'),
    ).toBe('personal prompt');

    await writeFile(
      join(paths.repoCodexRoot, 'prompts', 'daily.md'),
      'repo prompt',
      'utf8',
    );
    await applyCodexConfig(paths);

    expect(
      await readFile(
        join(paths.localCodexRoot, 'prompts', 'opsx-propose.md'),
        'utf8',
      ),
    ).toBe('generated command adapter');
    expect(
      await readFile(join(paths.localCodexRoot, 'prompts', 'daily.md'), 'utf8'),
    ).toBe('repo prompt');
  });

  test('reports unmanaged and unsupported Codex asset intent', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const paths = createCodexConfigPaths({ repoRoot, homeRoot });

    await mkdir(join(paths.localCodexRoot, 'skills', 'personal-only'), {
      recursive: true,
    });
    await writeFile(
      join(paths.localCodexRoot, 'skills', 'personal-only', 'SKILL.md'),
      'personal skill',
      'utf8',
    );
    await mkdir(
      join(
        paths.localCodexRoot,
        'plugins',
        'cache',
        'personal',
        'bundled-plugin',
        '0.1.0',
        'skills',
        'bundled-skill',
      ),
      { recursive: true },
    );
    await mkdir(join(paths.repoCodexRoot), { recursive: true });
    await mkdir(join(paths.marketplacePath, '..'), { recursive: true });
    await writeJson(join(paths.repoCodexRoot, 'skills.manifest.json'), {
      version: 1,
      skills: [
        {
          name: 'external-skill',
          source: 'github',
          path: 'owner/repo',
          enabled: true,
        },
      ],
    });
    await writeJson(join(paths.repoCodexRoot, 'plugins.manifest.json'), {
      version: 1,
      plugins: [
        {
          name: 'external-plugin',
          source: 'marketplace',
          path: 'marketplace:external-plugin',
          enabled: true,
        },
      ],
    });
    await writeJson(paths.marketplacePath, {
      plugins: [{ name: 'personal-plugin' }],
    });

    const comparison = await compareCodexConfig(paths);

    expect(comparison.unmanagedSkills).toEqual(['personal-only']);
    expect(comparison.unmanagedPlugins).toEqual(['personal-plugin']);
    expect(JSON.stringify(comparison)).not.toContain('bundled-skill');
    expect('ignoredPluginBundledSkills' in comparison).toBe(false);
    expect(comparison.unsupportedSkills).toEqual(['external-skill']);
    expect(comparison.unsupportedPlugins).toEqual(['external-plugin']);
  });

  test('reports repository-owned skills and plugins that are not applied locally', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const paths = createCodexConfigPaths({ repoRoot, homeRoot });

    await mkdir(join(paths.repoCodexRoot, 'skills', 'repo-skill'), {
      recursive: true,
    });
    await mkdir(join(paths.localCodexRoot, 'skills', 'installed-skill'), {
      recursive: true,
    });
    await writePlugin(join(paths.repoCodexRoot, 'plugins'), 'repo-plugin');
    await writePlugin(join(paths.repoCodexRoot, 'plugins'), 'installed-plugin');
    await mkdir(join(paths.marketplacePath, '..'), { recursive: true });
    await writeJson(join(paths.repoCodexRoot, 'skills.manifest.json'), {
      version: 1,
      skills: [
        {
          name: 'repo-skill',
          source: 'repo',
          path: 'codex/skills/repo-skill',
          enabled: true,
        },
        {
          name: 'installed-skill',
          source: 'repo',
          path: 'codex/skills/installed-skill',
          enabled: true,
        },
        {
          name: 'disabled-skill',
          source: 'repo',
          path: 'codex/skills/disabled-skill',
          enabled: false,
        },
      ],
    });
    await writeJson(join(paths.repoCodexRoot, 'plugins.manifest.json'), {
      version: 1,
      plugins: [
        {
          name: 'repo-plugin',
          source: 'repo',
          path: 'codex/plugins/repo-plugin',
          enabled: true,
        },
        {
          name: 'installed-plugin',
          source: 'repo',
          path: 'codex/plugins/installed-plugin',
          enabled: true,
        },
        {
          name: 'disabled-plugin',
          source: 'repo',
          path: 'codex/plugins/disabled-plugin',
          enabled: false,
        },
      ],
    });
    await writeJson(paths.marketplacePath, {
      plugins: [
        {
          name: 'installed-plugin',
          source: {
            source: 'local',
            path: join(paths.repoCodexRoot, 'plugins', 'installed-plugin'),
          },
        },
      ],
    });
    await mkdir(paths.localCodexRoot, { recursive: true });
    await writeFile(
      join(paths.localCodexRoot, 'config.toml'),
      '[plugins."installed-plugin@personal"]\nenabled = true\n',
      'utf8',
    );

    const comparison = await compareCodexConfig(paths);

    expect(comparison.missingRepoSkills).toEqual(['repo-skill']);
    expect(comparison.missingRepoPlugins).toEqual(['repo-plugin']);
    expect(comparison.unmanagedSkills).toEqual([]);
    expect(comparison.unmanagedPlugins).toEqual([]);
    expect(comparison.repoPlugins).toEqual([
      {
        name: 'installed-plugin',
        path: 'codex/plugins/installed-plugin',
        status: 'applied',
      },
      {
        name: 'repo-plugin',
        path: 'codex/plugins/repo-plugin',
        status: 'not_applied',
      },
    ]);
  });

  test('reports repository plugins that are present before export generates a manifest', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const paths = createCodexConfigPaths({ repoRoot, homeRoot });

    await mkdir(join(paths.repoCodexRoot, 'skills', 'repo-skill'), {
      recursive: true,
    });
    await writePlugin(join(paths.repoCodexRoot, 'plugins'), 'language-coach');

    const comparison = await compareCodexConfig(paths);

    expect(comparison.missingRepoSkills).toEqual(['repo-skill']);
    expect(comparison.missingRepoPlugins).toEqual(['language-coach']);
    expect(comparison.repoPlugins).toEqual([
      {
        name: 'language-coach',
        path: 'codex/plugins/language-coach',
        status: 'not_applied',
      },
    ]);
  });

  test('installs repository skills and plugins before export generates manifests', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const paths = createCodexConfigPaths({ repoRoot, homeRoot });

    await mkdir(join(paths.repoCodexRoot, 'skills', 'repo-skill'), {
      recursive: true,
    });
    await writeFile(
      join(paths.repoCodexRoot, 'skills', 'repo-skill', 'SKILL.md'),
      'skill',
      'utf8',
    );
    await writePlugin(join(paths.repoCodexRoot, 'plugins'), 'language-coach');

    const result = await installCodexAssets(paths);

    expect(result.installedSkills).toEqual(['repo-skill']);
    expect(result.installedPlugins).toEqual([
      { name: 'language-coach', action: 'installed' },
    ]);
    expect(
      await readFile(
        join(paths.localCodexRoot, 'skills', 'repo-skill', 'SKILL.md'),
        'utf8',
      ),
    ).toBe('skill');
    expect(
      await readFile(join(paths.localCodexRoot, 'config.toml'), 'utf8'),
    ).toContain('[plugins."language-coach@personal"]\nenabled = true');
  });

  test('exports safe prompts rules and versioned manifests only', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const paths = createCodexConfigPaths({ repoRoot, homeRoot });

    await mkdir(join(paths.localCodexRoot, 'prompts'), { recursive: true });
    await mkdir(join(paths.localCodexRoot, 'rules'), { recursive: true });
    await mkdir(join(paths.repoCodexRoot, 'skills', 'commit-changes'), {
      recursive: true,
    });
    await mkdir(join(paths.localCodexRoot, 'skills', 'personal-only'), {
      recursive: true,
    });
    await writeFile(
      join(paths.localCodexRoot, 'skills', 'personal-only', 'SKILL.md'),
      'personal skill',
      'utf8',
    );
    await mkdir(join(paths.localCodexRoot, 'skills', 'runtime-marker'), {
      recursive: true,
    });
    await mkdir(join(paths.localCodexRoot, 'skills', '.system'), {
      recursive: true,
    });
    await mkdir(join(paths.repoCodexRoot, 'plugins'), { recursive: true });
    await mkdir(join(paths.marketplacePath, '..'), { recursive: true });
    await writeFile(
      join(paths.localCodexRoot, 'prompts', 'daily.md'),
      'prompt',
      'utf8',
    );
    await writeFile(
      join(paths.localCodexRoot, 'rules', 'style.md'),
      'rule',
      'utf8',
    );
    await writeFile(join(paths.localCodexRoot, 'auth.json'), '{}', 'utf8');
    await writePlugin(join(paths.repoCodexRoot, 'plugins'), 'language-coach');
    await writeJson(paths.marketplacePath, {
      plugins: [{ name: 'personal-plugin' }],
    });

    const result = await exportCodexConfig(paths);

    expect(result.exportedAreas).toEqual(['prompts', 'rules']);
    expect(
      await readFile(join(paths.repoCodexRoot, 'prompts', 'daily.md'), 'utf8'),
    ).toBe('prompt');
    expect(
      await readFile(join(paths.repoCodexRoot, 'rules', 'style.md'), 'utf8'),
    ).toBe('rule');
    await expect(
      stat(join(paths.repoCodexRoot, 'auth.json')),
    ).rejects.toThrow();
    expect(
      JSON.parse(
        await readFile(
          join(paths.repoCodexRoot, 'skills.manifest.json'),
          'utf8',
        ),
      ),
    ).toEqual({
      version: 1,
      skills: [
        {
          name: 'personal-only',
          source: 'external',
          path: 'skill:personal-only',
          enabled: true,
        },
      ],
    });
    expect(result.unmanagedSkills).toEqual([]);
    expect(
      JSON.parse(
        await readFile(
          join(paths.repoCodexRoot, 'plugins.manifest.json'),
          'utf8',
        ),
      ),
    ).toEqual({
      version: 1,
      plugins: [
        {
          name: 'personal-plugin',
          source: 'marketplace',
          path: 'marketplace:personal-plugin',
          enabled: true,
        },
      ],
    });
    expect(result.unmanagedPlugins).toEqual([]);
    await expect(
      stat(join(paths.repoCodexRoot, 'skills', 'personal-only', 'SKILL.md')),
    ).rejects.toThrow();
  });

  test('applies prompts rules and local backup intent without touching repository assets or runtime state', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const paths = createCodexConfigPaths({ repoRoot, homeRoot });

    await mkdir(join(paths.repoCodexRoot, 'prompts'), { recursive: true });
    await mkdir(join(paths.repoCodexRoot, 'rules'), { recursive: true });
    await mkdir(join(paths.repoCodexRoot, 'skills', 'commit-changes'), {
      recursive: true,
    });
    await mkdir(paths.localCodexRoot, { recursive: true });
    await mkdir(join(paths.repoCodexRoot, 'plugins'), { recursive: true });
    await writeFile(
      join(paths.repoCodexRoot, 'prompts', 'daily.md'),
      'repo prompt',
      'utf8',
    );
    await writeFile(
      join(paths.repoCodexRoot, 'rules', 'style.md'),
      'repo rule',
      'utf8',
    );
    await writeFile(
      join(paths.repoCodexRoot, 'skills', 'commit-changes', 'SKILL.md'),
      'skill',
      'utf8',
    );
    await mkdir(
      join(
        paths.localCodexRoot,
        'vendor_imports',
        'skills',
        'skills',
        '.curated',
        'official-skill',
      ),
      { recursive: true },
    );
    await writeFile(
      join(
        paths.localCodexRoot,
        'vendor_imports',
        'skills',
        'skills',
        '.curated',
        'official-skill',
        'SKILL.md',
      ),
      'official skill',
      'utf8',
    );
    await writeFile(join(paths.localCodexRoot, 'auth.json'), '{}', {
      encoding: 'utf8',
      flag: 'w',
    });
    await writePlugin(join(paths.repoCodexRoot, 'plugins'), 'language-coach');
    await writeJson(join(paths.repoCodexRoot, 'skills.manifest.json'), {
      version: 1,
      skills: [
        {
          name: 'commit-changes',
          source: 'repo',
          path: 'codex/skills/commit-changes',
          enabled: true,
        },
        { name: 'remote-skill', source: 'github', path: 'owner/repo' },
        {
          name: 'official-skill',
          source: 'external',
          path: 'skill:official-skill',
          enabled: true,
        },
      ],
    });
    await writeJson(join(paths.repoCodexRoot, 'plugins.manifest.json'), {
      version: 1,
      plugins: [
        {
          name: 'language-coach',
          source: 'repo',
          path: 'codex/plugins/language-coach',
          enabled: true,
        },
        {
          name: 'marketplace-coach',
          source: 'marketplace',
          path: 'marketplace:coach',
          enabled: true,
        },
      ],
    });

    const result = await applyCodexConfig(paths);

    expect(result.appliedAreas).toEqual(['prompts', 'rules']);
    expect(result.installedPlugins).toEqual([]);
    expect(result.syncedPluginCaches).toEqual([]);
    expect(result.installedSkills).toEqual(['official-skill']);
    expect(result.unsupportedSkills).toEqual(['remote-skill']);
    expect(result.unsupportedPlugins).toEqual(['marketplace-coach']);
    expect(
      await readFile(join(paths.localCodexRoot, 'prompts', 'daily.md'), 'utf8'),
    ).toBe('repo prompt');
    await expect(
      stat(join(paths.localCodexRoot, 'skills', 'commit-changes', 'SKILL.md')),
    ).rejects.toThrow();
    expect(
      await readFile(
        join(paths.localCodexRoot, 'skills', 'official-skill', 'SKILL.md'),
        'utf8',
      ),
    ).toBe('official skill');
    expect(
      await readFile(join(paths.localCodexRoot, 'auth.json'), 'utf8'),
    ).toBe('{}');
  });

  test('apply best-effort installs official external skills from GitHub when no local cache exists', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const paths = createCodexConfigPaths({ repoRoot, homeRoot });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
      const url = String(input);
      if (
        url.includes(
          '/repos/openai/skills/contents/skills/.curated/best-effort-skill?',
        )
      ) {
        return new Response(
          JSON.stringify([
            {
              type: 'file',
              path: 'skills/.curated/best-effort-skill/SKILL.md',
              download_url: 'https://raw.example/SKILL.md',
            },
            {
              type: 'dir',
              path: 'skills/.curated/best-effort-skill/scripts',
            },
          ]),
        );
      }
      if (
        url.includes(
          '/repos/openai/skills/contents/skills/.curated/best-effort-skill/scripts?',
        )
      ) {
        return new Response(
          JSON.stringify([
            {
              type: 'file',
              path: 'skills/.curated/best-effort-skill/scripts/run.js',
              download_url: 'https://raw.example/scripts/run.js',
            },
          ]),
        );
      }
      if (url === 'https://raw.example/SKILL.md') {
        return new Response('official skill');
      }
      if (url === 'https://raw.example/scripts/run.js') {
        return new Response('console.log("ok");');
      }
      return new Response('not found', { status: 404 });
    }) as typeof fetch;

    try {
      await mkdir(paths.repoCodexRoot, { recursive: true });
      await writeJson(join(paths.repoCodexRoot, 'skills.manifest.json'), {
        version: 1,
        skills: [
          {
            name: 'best-effort-skill',
            source: 'external',
            path: 'skill:best-effort-skill',
            enabled: true,
          },
        ],
      });

      const result = await applyCodexConfig(paths);

      expect(result.installedSkills).toEqual(['best-effort-skill']);
      expect(result.unsupportedSkills).toEqual([]);
      expect(
        await readFile(
          join(paths.localCodexRoot, 'skills', 'best-effort-skill', 'SKILL.md'),
          'utf8',
        ),
      ).toBe('official skill');
      expect(
        await readFile(
          join(
            paths.localCodexRoot,
            'skills',
            'best-effort-skill',
            'scripts',
            'run.js',
          ),
          'utf8',
        ),
      ).toBe('console.log("ok");');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('status comparison reports unsafe repository runtime files and directories', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const paths = createCodexConfigPaths({ repoRoot, homeRoot });

    await mkdir(join(paths.repoCodexRoot, 'plugins', 'cache'), {
      recursive: true,
    });
    await mkdir(join(paths.repoCodexRoot, 'sessions'), { recursive: true });
    await mkdir(join(paths.repoRoot, '.codex', 'sessions'), {
      recursive: true,
    });
    await writeFile(join(paths.repoCodexRoot, 'auth.json'), '{}', 'utf8');
    await writeFile(join(paths.repoCodexRoot, 'config.toml'), '', 'utf8');
    await writeFile(join(paths.repoCodexRoot, 'cap_sid'), '', 'utf8');
    await writeFile(join(paths.repoCodexRoot, 'state.sqlite'), '', 'utf8');

    const result = await compareCodexConfig(paths);

    expect(result.unsafeRepoPaths.sort()).toEqual([
      'auth.json',
      'cap_sid',
      'config.toml',
      'plugins/cache',
      'sessions',
      'state.sqlite',
    ]);
  });
});
