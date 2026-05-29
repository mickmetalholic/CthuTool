import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  applyCodexConfig,
  compareCodexConfig,
  doctorCodexRepo,
  exportCodexConfig,
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

  test('exports safe prompts rules and versioned manifests only', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const paths = createCodexConfigPaths({ repoRoot, homeRoot });

    await mkdir(join(paths.localCodexRoot, 'prompts'), { recursive: true });
    await mkdir(join(paths.localCodexRoot, 'rules'), { recursive: true });
    await mkdir(join(paths.localCodexRoot, 'skills', 'commit-changes'), {
      recursive: true,
    });
    await mkdir(join(paths.localCodexRoot, 'skills', '.system'), {
      recursive: true,
    });
    await mkdir(paths.pluginsRoot, { recursive: true });
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
    await writePlugin(paths.pluginsRoot, 'english-coach');

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
          name: 'commit-changes',
          source: 'local',
          path: '.codex/skills/commit-changes',
        },
      ],
    });
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
          name: 'english-coach',
          source: 'local',
          path: 'packages/codex-plugins/plugins/english-coach',
          enabled: true,
        },
      ],
    });
  });

  test('applies prompts rules plugins and local skills without touching runtime state', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const paths = createCodexConfigPaths({ repoRoot, homeRoot });

    await mkdir(join(paths.repoCodexRoot, 'prompts'), { recursive: true });
    await mkdir(join(paths.repoCodexRoot, 'rules'), { recursive: true });
    await mkdir(join(paths.repoCodexRoot, 'skills', 'commit-changes'), {
      recursive: true,
    });
    await mkdir(paths.localCodexRoot, { recursive: true });
    await mkdir(paths.pluginsRoot, { recursive: true });
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
    await writeFile(join(paths.localCodexRoot, 'auth.json'), '{}', {
      encoding: 'utf8',
      flag: 'w',
    });
    await writePlugin(paths.pluginsRoot, 'english-coach');
    await writeJson(join(paths.repoCodexRoot, 'skills.manifest.json'), {
      version: 1,
      skills: [
        {
          name: 'commit-changes',
          source: 'local',
          path: '.codex/skills/commit-changes',
        },
        { name: 'remote-skill', source: 'github', path: 'owner/repo' },
      ],
    });
    await writeJson(join(paths.repoCodexRoot, 'plugins.manifest.json'), {
      version: 1,
      plugins: [
        {
          name: 'english-coach',
          source: 'local',
          path: 'packages/codex-plugins/plugins/english-coach',
          enabled: true,
        },
      ],
    });

    const result = await applyCodexConfig(paths);

    expect(result.appliedAreas).toEqual(['prompts', 'rules']);
    expect(result.installedPlugins).toEqual([
      { name: 'english-coach', action: 'installed' },
    ]);
    expect(result.installedSkills).toEqual(['commit-changes']);
    expect(result.unsupportedSkills).toEqual(['remote-skill']);
    expect(
      await readFile(join(paths.localCodexRoot, 'prompts', 'daily.md'), 'utf8'),
    ).toBe('repo prompt');
    expect(
      await readFile(
        join(paths.localCodexRoot, 'skills', 'commit-changes', 'SKILL.md'),
        'utf8',
      ),
    ).toBe('skill');
    expect(
      await readFile(join(paths.localCodexRoot, 'auth.json'), 'utf8'),
    ).toBe('{}');
  });

  test('doctor reports unsafe repository runtime files and directories', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'cthutool-repo-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'cthutool-home-'));
    const paths = createCodexConfigPaths({ repoRoot, homeRoot });

    await mkdir(join(paths.repoCodexRoot, 'plugins', 'cache'), {
      recursive: true,
    });
    await mkdir(join(paths.repoCodexRoot, 'sessions'), { recursive: true });
    await writeFile(join(paths.repoCodexRoot, 'auth.json'), '{}', 'utf8');
    await writeFile(join(paths.repoCodexRoot, 'state.sqlite'), '', 'utf8');

    const result = await doctorCodexRepo(paths);

    expect(result.ok).toBe(false);
    expect(result.unsafePaths.sort()).toEqual([
      'auth.json',
      'plugins/cache',
      'sessions',
      'state.sqlite',
    ]);
  });
});
