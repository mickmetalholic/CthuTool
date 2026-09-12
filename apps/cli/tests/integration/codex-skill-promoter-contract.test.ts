import { describe, expect, test } from 'bun:test';
import { access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const skillRoot = join(
  repoRoot,
  'codex/plugins/cthu-codex/skills/codex-skill-promoter',
);
const readSkill = () => readFile(join(skillRoot, 'SKILL.md'), 'utf8');
const readContract = () =>
  readFile(join(skillRoot, 'references/promotion-contract.md'), 'utf8');

describe('Codex skill promoter contract', () => {
  test('scans both roots without a caller Git-state gate', async () => {
    const skill = await readSkill();
    const reference = await readContract();
    const metadata = await readFile(
      join(skillRoot, 'agents/openai.yaml'),
      'utf8',
    );

    expect(metadata).toContain('allow_implicit_invocation: false');
    expect(skill).toContain('read-only discovery');
    expect(skill).toContain('regardless');
    expect(skill).toContain('working-tree state');
    expect(skill.indexOf('## 1. Scan local Skills')).toBeLessThan(
      skill.indexOf('## 3. Prepare and propose the selected change'),
    );
    expect(skill).not.toMatch(
      /Require a clean|Refuse a dirty checkout|git status --porcelain/u,
    );
    expect(reference).toContain('Current Git state is irrelevant');
    expect(reference).toContain('codex/skills.manifest.json');
    expect(reference).toContain('User npx lock');
    expect(reference).toContain('.hermes-evolution.json');
    expect(reference).toContain('.bundled_manifest');
    expect(reference).toContain('.hub/lock.json');
    expect(skill).toContain('chc codex skills');
  });

  test('shows complete candidate choices before one authorized run', async () => {
    const skill = await readSkill();
    const table = skill.match(
      /\| Skill \|[^\n]+\n\| --- \|[^\n]+\n\| `example` \|[^\n]+/u,
    )?.[0];

    expect(table).toBeDefined();
    for (const field of [
      'Source mode and exact path',
      'Ownership/provenance',
      'Files and fingerprint',
      'Codex + Hermes compatibility and warnings',
      'Plugin target/collision choice',
      'Exact original to retire',
      'Action',
    ]) {
      expect(table).toContain(field);
    }
    expect(skill).toContain('Default every row to **Skip**');
    expect(skill).toContain('merge, replace, or');
    expect(skill).toContain('one complete confirmation table');
    expect(skill).toContain('not an optional cleanup choice');
    expect(skill).toContain('without another prompt');
  });

  test('preserves both agent entry points before removing an original', async () => {
    const skill = await readSkill();
    const reference = await readContract();

    expect(skill).toContain('agents/openai.yaml');
    expect(skill).toContain('references/codex-adapter.md');
    expect(skill).toContain('references/hermes-adapter.md');
    expect(skill).toContain('.cthu-skill-bridge.json');
    expect(skill).toContain('explicitly load/invoke the result in Codex');
    expect(skill).toContain('Hermes-accessible entry point');
    expect(skill).toContain(
      'the replacement must work *while the original still exists*',
    );
    expect(reference).toContain(
      'The CthuCodex cache alone is not a Hermes installation',
    );
    expect(
      skill.indexOf('Verify a **separate Hermes-accessible entry point**'),
    ).toBeLessThan(
      skill.indexOf(
        'Remove only those confirmed original active local Skill trees',
      ),
    );
    expect(skill).toContain('If any check');
    expect(skill).toContain('retire none of the originals');
    expect(skill).toContain('never execute a source-provided');
  });

  test('orders OpenSpec proposal, implementation, retirement, archive, and PR', async () => {
    const skill = await readSkill();
    const steps = [
      '## 3. Prepare and propose the selected change',
      '## 4. Adapt, implement, and verify both agents',
      '## 5. Retire originals, archive, and open the PR',
      'Remove only those confirmed original active local Skill trees',
      'archive **only this change**',
      'open one reviewable PR',
    ];
    const positions = steps.map((step) => skill.indexOf(step));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(skill).toMatch(/an\s+isolated task branch\/worktree/u);
    expect(skill).toContain('Do not stash, reset,');
    expect(skill).toContain('Stage an exact allowlist');
    expect(skill).toContain('Do not edit generated OpenSpec adapters');
    expect(skill).toContain(
      'reversible move outside **all** active Skill roots',
    );
    expect(skill).toContain('Otherwise preserve the');
    await expect(
      access(
        join(
          repoRoot,
          'codex/plugins/cthu-codex/skills/hermes-skill-absorber/SKILL.md',
        ),
      ),
    ).rejects.toThrow();
  });
});
