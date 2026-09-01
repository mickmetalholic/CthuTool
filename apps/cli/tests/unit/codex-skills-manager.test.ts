import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  runSkills,
  type SkillsInteraction,
} from '../../src/command/codex.command';
import {
  createNpxSkillsBackend,
  parseDiscoveredSkills,
  parseInstalledSkills,
  pinnedSkillsCliVersion,
  type SkillsBackend,
} from '../../src/domain/codex-skills-backend';
import {
  buildManagedSkillInventory,
  executeSkillPlan,
} from '../../src/domain/codex-skills-manager';
import {
  type CodexSkillsManifest,
  type ManagedCodexSkill,
  readCodexSkillsManifest,
  validateCodexSkillsManifest,
  writeCodexSkillsManifest,
} from '../../src/domain/codex-skills-manifest';
import {
  parseSkillSource,
  SkillSourceError,
} from '../../src/domain/codex-skills-source';
import type { ObservedCliCommandScope } from '../../src/runtime/command-diagnostics';

const trackedSkill: ManagedCodexSkill = {
  name: 'grill-me',
  source: 'github',
  repository: 'mattpocock/skills',
  selector: 'grill-me',
  tracking: { type: 'branch', ref: 'main' },
  enabled: true,
};

function manifest(
  skills: readonly ManagedCodexSkill[] = [trackedSkill],
): CodexSkillsManifest {
  return { version: 2, skills: [...skills] };
}

function fakeBackend(overrides: Partial<SkillsBackend> = {}): SkillsBackend {
  return {
    listInstalled: async () => [],
    discover: async () => [],
    validate: async () => {},
    checkUpdates: async () => new Set(),
    install: async () => {},
    update: async () => {},
    remove: async () => {},
    ...overrides,
  };
}

describe('Codex skills manifest', () => {
  test('validates, sorts, and atomically writes version 2 desired state', async () => {
    const repoCodexRoot = await mkdtemp(join(tmpdir(), 'chc-skills-'));
    const second = {
      ...trackedSkill,
      name: 'another-skill',
      selector: 'skills/another-skill',
      tracking: { type: 'pin' as const, ref: 'v1.2.3' },
    };

    await writeCodexSkillsManifest(
      repoCodexRoot,
      manifest([trackedSkill, second]),
    );
    const result = await readCodexSkillsManifest(repoCodexRoot);

    expect(result.manifest.skills.map((skill) => skill.name)).toEqual([
      'another-skill',
      'grill-me',
    ]);
    expect(
      JSON.parse(
        await readFile(join(repoCodexRoot, 'skills.manifest.json'), 'utf8'),
      ),
    ).toEqual(result.manifest);
    expect(
      (await Array.fromAsync(new Bun.Glob('*.tmp').scan(repoCodexRoot))).length,
    ).toBe(0);
  });

  test('fails closed for malformed and duplicate entries', () => {
    expect(() =>
      validateCodexSkillsManifest({ version: 2, skills: [{}] }),
    ).toThrow();
    expect(() =>
      validateCodexSkillsManifest({
        version: 2,
        skills: [trackedSkill, trackedSkill],
      }),
    ).toThrow('Duplicate');
  });

  test('reports version 1 names as legacy without inferring sources', async () => {
    const repoCodexRoot = await mkdtemp(join(tmpdir(), 'chc-skills-legacy-'));
    await writeFile(
      join(repoCodexRoot, 'skills.manifest.json'),
      JSON.stringify({
        version: 1,
        skills: [
          { name: 'old-skill', source: 'external', path: 'skill:old-skill' },
        ],
      }),
    );

    const result = await readCodexSkillsManifest(repoCodexRoot);
    expect(result.manifest).toEqual({ version: 2, skills: [] });
    expect(result.legacyEntries).toEqual(['old-skill']);
  });

  test('rejects version 2 local-source entries', () => {
    expect(() =>
      validateCodexSkillsManifest({
        version: 2,
        skills: [
          {
            name: 'my-local-skill',
            source: 'local',
            path: 'my-local-skills',
            selector: 'my-local-skill',
            enabled: true,
          },
        ],
      }),
    ).toThrow('must use source "github"');
  });
});

describe('Codex skill source parser', () => {
  test('normalizes GitHub shorthand, repository URL, and tree URL', () => {
    expect(parseSkillSource('vercel-labs/agent-skills')).toEqual({
      kind: 'github',
      repository: 'vercel-labs/agent-skills',
      locator: 'vercel-labs/agent-skills',
    });
    expect(
      parseSkillSource('https://github.com/vercel-labs/agent-skills'),
    ).toEqual({
      kind: 'github',
      repository: 'vercel-labs/agent-skills',
      locator: 'vercel-labs/agent-skills',
    });
    expect(
      parseSkillSource(
        'https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines',
      ),
    ).toEqual({
      kind: 'github',
      repository: 'vercel-labs/agent-skills',
      ref: 'main',
      subpath: 'skills/web-design-guidelines',
      locator:
        'https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines',
    });
  });

  test('rejects local paths and unsupported URLs', () => {
    for (const source of [
      './my-local-skills',
      '../outside',
      '/tmp/my-local-skills',
      'https://gitlab.com/org/repo',
      'git@github.com:vercel-labs/agent-skills.git',
      'https://example.com/org/repo',
    ]) {
      expect(() => parseSkillSource(source)).toThrow(SkillSourceError);
      expect(() => parseSkillSource(source)).toThrow(
        'Unsupported skill source',
      );
    }
  });
});
describe('pinned skills backend contract', () => {
  test('parses pinned list and discovery fixtures and rejects drift', () => {
    expect(pinnedSkillsCliVersion).toBe('1.5.19');
    expect(
      parseInstalledSkills('[{"name":"grill-me","path":"/tmp/grill-me"}]'),
    ).toEqual([{ name: 'grill-me', path: '/tmp/grill-me', managed: false }]);
    expect(parseDiscoveredSkills('Found 1 skills\n│    grill-me\n')).toEqual([
      { name: 'grill-me' },
    ]);
    expect(() => parseInstalledSkills('not json')).toThrow('Unsupported');
    expect(() => parseDiscoveredSkills('new format')).toThrow('Unsupported');
  });

  test('uses the Codex global contract and lock metadata for source lookup', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'chc-skills-home-'));
    await mkdir(join(homeRoot, '.agents'), { recursive: true });
    await writeFile(
      join(homeRoot, '.agents', '.skill-lock.json'),
      JSON.stringify({
        version: 3,
        skills: {
          'grill-me': {
            sourceType: 'github',
            source: 'mattpocock/skills',
            ref: 'main',
            skillPath: 'skills/grill-me/SKILL.md',
            skillFolderHash: 'old-tree-sha',
          },
          'unsupported-github': {
            sourceType: 'github',
            source: 'owner/skills',
            ref: 'main',
            skillPath: 'unexpected/location/SKILL.md',
            skillFolderHash: 'tree-sha',
          },
          'no-ref': {
            sourceType: 'github',
            sourceUrl: 'https://github.com/owner/skills.git',
            skillPath: 'skills/no-ref/SKILL.md',
            skillFolderHash: 'tree-sha',
          },
          'well-known': {
            sourceType: 'well-known',
            source: 'example.com',
            sourceUrl:
              'https://example.com/.well-known/skills/example/SKILL.md',
            skillFolderHash: 'tree-sha',
          },
        },
      }),
    );
    const calls: string[][] = [];
    const backend = createNpxSkillsBackend({
      homeRoot,
      localCodexRoot: join(homeRoot, '.codex'),
      run: async (args) => {
        calls.push([...args]);
        if (args[0] === 'add') {
          return {
            stdout: 'Found 1 skills\n│    grill-me\n',
            stderr: '',
          };
        }
        return {
          stdout: JSON.stringify([
            { name: 'grill-me', path: '/tmp/grill-me' },
            { name: 'unsupported-github', path: '/tmp/unsupported-github' },
            { name: 'no-ref', path: '/tmp/no-ref' },
            { name: 'well-known', path: '/tmp/well-known' },
            { name: 'manual', path: '/tmp/manual' },
          ]),
          stderr: '',
        };
      },
      fetchRemoteTree: async () =>
        new Response(
          JSON.stringify({
            tree: [
              { path: 'skills/grill-me', type: 'tree', sha: 'new-tree-sha' },
            ],
          }),
        ),
    });

    expect(await backend.listInstalled()).toEqual([
      {
        name: 'grill-me',
        path: '/tmp/grill-me',
        managed: true,
        repository: 'mattpocock/skills',
        localGitHubCandidate: {
          repository: 'mattpocock/skills',
          selector: 'grill-me',
          skillPath: 'skills/grill-me/SKILL.md',
          ref: 'main',
        },
      },
      {
        name: 'unsupported-github',
        path: '/tmp/unsupported-github',
        managed: true,
        repository: 'owner/skills',
        localGitHubCandidate: undefined,
      },
      {
        name: 'no-ref',
        path: '/tmp/no-ref',
        managed: true,
        repository: 'owner/skills',
        localGitHubCandidate: {
          repository: 'owner/skills',
          selector: 'no-ref',
          skillPath: 'skills/no-ref/SKILL.md',
        },
      },
      {
        name: 'well-known',
        path: '/tmp/well-known',
        managed: false,
        repository: undefined,
        localGitHubCandidate: undefined,
      },
      {
        name: 'manual',
        path: '/tmp/manual',
        managed: false,
        repository: undefined,
        localGitHubCandidate: undefined,
      },
    ]);
    expect([...(await backend.checkUpdates([trackedSkill]))]).toEqual([
      'grill-me',
    ]);
    await backend.validate({
      ...trackedSkill,
      tracking: { type: 'pin', ref: 'v1.2.3' },
    });
    expect(calls).toEqual([
      ['list', '--global', '--agent', 'codex', '--json'],
      ['add', 'mattpocock/skills#v1.2.3', '--list'],
    ]);
  });

  test('rejects a tracking source whose selected skill is absent', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'chc-skills-home-'));
    const backend = createNpxSkillsBackend({
      homeRoot,
      localCodexRoot: join(homeRoot, '.codex'),
      run: async () => ({ stdout: 'Found 0 skills\n', stderr: '' }),
    });

    await expect(backend.validate(trackedSkill)).rejects.toThrow(
      'was not found',
    );
  });

  test('skips the list subprocess when no lock entry can be tracked', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'chc-skills-home-'));
    await mkdir(join(homeRoot, '.agents'), { recursive: true });
    await writeFile(
      join(homeRoot, '.agents', '.skill-lock.json'),
      JSON.stringify({
        version: 3,
        skills: {
          'well-known': {
            sourceType: 'well-known',
            source: 'example.com',
            sourceUrl:
              'https://example.com/.well-known/skills/example/SKILL.md',
          },
        },
      }),
    );
    let ran = false;
    const backend = createNpxSkillsBackend({
      homeRoot,
      localCodexRoot: join(homeRoot, '.codex'),
      run: async () => {
        ran = true;
        return { stdout: '[]', stderr: '' };
      },
    });

    expect(await backend.listInstalled({ trackableOnly: true })).toEqual([]);
    expect(ran).toBe(false);
  });

  test('uses GitHub arguments for tree discovery and lifecycle', async () => {
    const homeRoot = await mkdtemp(join(tmpdir(), 'chc-skills-home-'));
    const calls: string[][] = [];
    const backend = createNpxSkillsBackend({
      homeRoot,
      localCodexRoot: join(homeRoot, '.codex'),
      run: async (args) => {
        calls.push([...args]);
        return {
          stdout: 'Found 1 skills\n│    web-design-guidelines\n',
          stderr: '',
        };
      },
    });
    const treeSource = parseSkillSource(
      'https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines',
    );
    const githubSkill: ManagedCodexSkill = {
      name: 'web-design-guidelines',
      source: 'github',
      repository: 'vercel-labs/agent-skills',
      selector: 'web-design-guidelines',
      tracking: { type: 'branch', ref: 'main' },
      enabled: true,
    };

    await backend.discover(treeSource);
    await backend.validate(githubSkill);
    await backend.install(githubSkill);
    await backend.update(githubSkill);
    expect(calls).toEqual([
      [
        'add',
        'https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines',
        '--list',
      ],
      ['add', 'vercel-labs/agent-skills#main', '--list'],
      [
        'add',
        'vercel-labs/agent-skills#main',
        '--skill',
        'web-design-guidelines',
        '--global',
        '--agent',
        'codex',
        '--yes',
      ],
      [
        'add',
        'vercel-labs/agent-skills#main',
        '--skill',
        'web-design-guidelines',
        '--global',
        '--agent',
        'codex',
        '--yes',
      ],
    ]);
  });
});

describe('Codex managed skill inventory and execution', () => {
  test('classifies all managed states and excludes unrelated local skills', async () => {
    const rows = await buildManagedSkillInventory({
      manifest: manifest([
        trackedSkill,
        { ...trackedSkill, name: 'missing', selector: 'missing' },
        {
          ...trackedSkill,
          name: 'disabled',
          selector: 'disabled',
          enabled: false,
        },
        { ...trackedSkill, name: 'collision', selector: 'collision' },
      ]),
      legacyEntries: ['legacy'],
      backend: fakeBackend({
        listInstalled: async () => [
          {
            name: 'grill-me',
            path: '/managed/grill-me',
            managed: true,
            repository: 'mattpocock/skills',
          },
          {
            name: 'disabled',
            path: '/managed/disabled',
            managed: true,
            repository: 'mattpocock/skills',
          },
          { name: 'collision', path: '/local/collision', managed: false },
          {
            name: 'personal-only',
            path: '/local/personal-only',
            managed: false,
          },
          {
            name: 'local-github',
            path: '/managed/local-github',
            managed: true,
            repository: 'owner/skills',
            localGitHubCandidate: {
              repository: 'owner/skills',
              selector: 'local-github',
              skillPath: 'skills/local-github/SKILL.md',
              ref: 'develop',
            },
          },
          {
            name: 'unsupported-github',
            path: '/managed/unsupported-github',
            managed: true,
            repository: 'owner/skills',
          },
        ],
        checkUpdates: async () => new Set(['grill-me']),
      }),
    });

    expect(rows.map(({ name, state }) => ({ name, state }))).toEqual([
      { name: 'collision', state: 'unmanaged_collision' },
      { name: 'disabled', state: 'disabled' },
      { name: 'grill-me', state: 'update_available' },
      { name: 'legacy', state: 'legacy' },
      { name: 'local-github', state: 'local_only' },
      { name: 'missing', state: 'missing' },
    ]);
    expect(rows.some((row) => row.name === 'personal-only')).toBe(false);
    expect(rows.some((row) => row.name === 'unsupported-github')).toBe(false);
    expect(
      rows.find((row) => row.name === 'local-github')?.availableActions,
    ).toEqual(['none', 'track']);
  });

  test('tracks desired state without invoking a backend lifecycle mutation', async () => {
    const repoCodexRoot = await mkdtemp(join(tmpdir(), 'chc-skills-track-'));
    const calls: string[] = [];
    const result = await executeSkillPlan({
      repoCodexRoot,
      manifest: manifest([]),
      items: [
        { action: 'track', name: trackedSkill.name, skill: trackedSkill },
      ],
      backend: fakeBackend({
        install: async () => {
          calls.push('install');
        },
        update: async () => {
          calls.push('update');
        },
        remove: async () => {
          calls.push('remove');
        },
      }),
    });

    expect(calls).toEqual([]);
    expect(result.completed.map((item) => item.action)).toEqual(['track']);
    expect(
      (await readCodexSkillsManifest(repoCodexRoot)).manifest.skills,
    ).toEqual([trackedSkill]);
  });

  test('commits successful outcomes and reports partial failures', async () => {
    const repoCodexRoot = await mkdtemp(join(tmpdir(), 'chc-skills-plan-'));
    const failedSkill = { ...trackedSkill, name: 'failed', selector: 'failed' };
    const result = await executeSkillPlan({
      repoCodexRoot,
      manifest: manifest([]),
      items: [
        { action: 'add', name: trackedSkill.name, skill: trackedSkill },
        { action: 'add', name: failedSkill.name, skill: failedSkill },
      ],
      backend: fakeBackend({
        install: async (skill) => {
          if (skill.name === 'failed') throw new Error('network down');
        },
      }),
    });

    expect(result.completed.map((item) => item.name)).toEqual(['grill-me']);
    expect(result.failed).toHaveLength(1);
    expect(
      (await readCodexSkillsManifest(repoCodexRoot)).manifest.skills,
    ).toEqual([trackedSkill]);
  });

  test('restores an unmanaged collision when replacement fails', async () => {
    const root = await mkdtemp(join(tmpdir(), 'chc-skills-replace-'));
    const repoCodexRoot = join(root, 'repo', 'codex');
    const installedPath = join(root, 'home', '.codex', 'skills', 'grill-me');
    await mkdir(installedPath, { recursive: true });
    await writeFile(join(installedPath, 'SKILL.md'), 'personal copy');

    const result = await executeSkillPlan({
      repoCodexRoot,
      manifest: manifest([]),
      items: [
        {
          action: 'replace',
          name: trackedSkill.name,
          skill: trackedSkill,
          installedPath,
        },
      ],
      backend: fakeBackend({
        install: async () => {
          await mkdir(installedPath, { recursive: true });
          await writeFile(join(installedPath, 'partial'), 'partial');
          throw new Error('install failed');
        },
      }),
    });

    expect(result.failed).toHaveLength(1);
    expect(await readFile(join(installedPath, 'SKILL.md'), 'utf8')).toBe(
      'personal copy',
    );
    await expect(stat(join(installedPath, 'partial'))).rejects.toThrow();
  });

  test('removing collision intent leaves the unmanaged local copy untouched', async () => {
    const repoCodexRoot = await mkdtemp(join(tmpdir(), 'chc-skills-forget-'));
    let backendRemoved = false;
    const result = await executeSkillPlan({
      repoCodexRoot,
      manifest: manifest(),
      items: [
        {
          action: 'remove',
          name: trackedSkill.name,
          skill: trackedSkill,
          installedPath: '/personal/grill-me',
          installedManaged: false,
        },
      ],
      backend: fakeBackend({
        remove: async () => {
          backendRemoved = true;
        },
      }),
    });

    expect(backendRemoved).toBe(false);
    expect(result.manifest.skills).toEqual([]);
  });
});

describe('Codex skills interaction', () => {
  test('executes the Add selection through injected prompts and backend', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'chc-skills-command-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'chc-skills-home-'));
    const calls: string[] = [];
    const backend = fakeBackend({
      discover: async (source) => {
        calls.push(`discover:${source.locator}`);
        return [{ name: 'grill-me' }];
      },
      install: async (skill) => {
        calls.push(`install:${skill.name}`);
      },
    });
    const interaction = addInteraction();
    const previousExitCode = process.exitCode;
    process.exitCode = undefined;
    try {
      await runSkills({ repoRoot, home: homeRoot }, interactiveScope(), {
        createBackend: () => backend,
        interaction,
      });
      expect(calls).toEqual(['discover:owner/repo', 'install:grill-me']);
      expect(
        (await readCodexSkillsManifest(join(repoRoot, 'codex'))).manifest,
      ).toEqual({
        version: 2,
        skills: [{ ...trackedSkill, repository: 'owner/repo' }],
      });
      expect(Number(process.exitCode)).toBe(0);
    } finally {
      process.exitCode = previousExitCode;
    }
  });

  test('rejects unsupported sources before backend discovery', async () => {
    for (const source of [
      './my-local-skills',
      '/tmp/my-local-skills',
      'https://gitlab.com/org/repo',
      'git@github.com:vercel-labs/agent-skills.git',
    ]) {
      const repoRoot = await mkdtemp(
        join(tmpdir(), 'chc-skills-source-error-'),
      );
      const homeRoot = await mkdtemp(join(tmpdir(), 'chc-skills-home-'));
      let discovered = false;
      await expect(
        runSkills({ repoRoot, home: homeRoot }, interactiveScope(), {
          createBackend: () =>
            fakeBackend({
              discover: async () => {
                discovered = true;
                return [];
              },
            }),
          interaction: addInteraction({
            requestRepository: async () => source,
          }),
        }),
      ).rejects.toThrow('Unsupported skill source');
      expect(discovered).toBe(false);
      await expect(
        stat(join(repoRoot, 'codex', 'skills.manifest.json')),
      ).rejects.toThrow();
    }
  });

  test('default-negative plan cancellation performs no mutation', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'chc-skills-cancel-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'chc-skills-home-'));
    let installed = false;
    const interaction = addInteraction({ confirmPlan: async () => false });

    await runSkills({ repoRoot, home: homeRoot }, interactiveScope(), {
      createBackend: () =>
        fakeBackend({
          discover: async () => [{ name: 'grill-me' }],
          install: async () => {
            installed = true;
          },
        }),
      interaction,
    });

    expect(installed).toBe(false);
    await expect(
      stat(join(repoRoot, 'codex', 'skills.manifest.json')),
    ).rejects.toThrow();
  });

  test('tracks an eligible local skill after explicit metadata review', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'chc-skills-track-command-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'chc-skills-home-'));
    const calls: string[] = [];
    let suggestedRef: string | undefined;
    const backend = fakeBackend({
      listInstalled: async () => [
        {
          name: 'grill-me',
          path: '/managed/grill-me',
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
      validate: async (skill) => {
        if (skill.source === 'github') {
          calls.push(`validate:${skill.tracking.ref}`);
        }
      },
      install: async () => {
        calls.push('install');
      },
      update: async () => {
        calls.push('update');
      },
      remove: async () => {
        calls.push('remove');
      },
    });
    const interaction = addInteraction({
      chooseMode: async () => 'manage',
      chooseManagedActions: async () => [{ name: 'grill-me', action: 'track' }],
      chooseTrackingType: async () => 'pin',
      requestTrackingRef: async (_type, initialValue) => {
        suggestedRef = initialValue;
        return 'v1.2.3';
      },
    });

    await runSkills({ repoRoot, home: homeRoot }, interactiveScope(), {
      createBackend: () => backend,
      interaction,
    });

    expect(suggestedRef).toBe('main');
    expect(calls).toEqual(['validate:v1.2.3']);
    expect(
      (await readCodexSkillsManifest(join(repoRoot, 'codex'))).manifest.skills,
    ).toEqual([
      {
        ...trackedSkill,
        tracking: { type: 'pin', ref: 'v1.2.3' },
      },
    ]);
  });

  test('does not open the action table for an empty reconciliation inventory', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'chc-skills-empty-command-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'chc-skills-home-'));
    let actionTableOpened = false;

    await runSkills({ repoRoot, home: homeRoot }, interactiveScope(), {
      createBackend: () => fakeBackend(),
      interaction: addInteraction({
        chooseMode: async () => 'manage',
        chooseManagedActions: async () => {
          actionTableOpened = true;
          return [];
        },
      }),
    });

    expect(actionTableOpened).toBe(false);
    await expect(
      stat(join(repoRoot, 'codex', 'skills.manifest.json')),
    ).rejects.toThrow();
  });

  test('cancelling Track metadata collection leaves local and manifest state unchanged', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'chc-skills-track-cancel-'));
    const homeRoot = await mkdtemp(join(tmpdir(), 'chc-skills-home-'));
    let validated = false;
    const backend = fakeBackend({
      listInstalled: async () => [
        {
          name: 'grill-me',
          path: '/managed/grill-me',
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
      validate: async () => {
        validated = true;
      },
    });

    await runSkills({ repoRoot, home: homeRoot }, interactiveScope(), {
      createBackend: () => backend,
      interaction: addInteraction({
        chooseMode: async () => 'manage',
        chooseManagedActions: async () => [
          { name: 'grill-me', action: 'track' },
        ],
        chooseTrackingType: async () => undefined,
      }),
    });

    expect(validated).toBe(false);
    await expect(
      stat(join(repoRoot, 'codex', 'skills.manifest.json')),
    ).rejects.toThrow();
  });
});

function interactiveScope(): ObservedCliCommandScope {
  return {
    context: {
      isTty: true,
      interactive: true,
      json: false,
      quiet: true,
    },
    complete() {},
    fail() {},
  };
}

function addInteraction(
  overrides: Partial<SkillsInteraction> = {},
): SkillsInteraction {
  return {
    chooseMode: async () => 'add',
    chooseManagedActions: async () => [],
    requestRepository: async () => 'owner/repo',
    chooseDiscoveredNames: async () => ['grill-me'],
    chooseTrackingType: async () => 'branch',
    requestTrackingRef: async () => 'main',
    confirmPlan: async () => true,
    ...overrides,
  };
}
