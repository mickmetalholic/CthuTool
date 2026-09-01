import { describe, expect, test } from 'bun:test';
import { access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const skillRoot = join(
  repoRoot,
  'codex',
  'plugins',
  'cthu-codex',
  'skills',
  'codex-skill-promoter',
);

describe('Codex skill promoter contract', () => {
  test('keeps Codex discovery explicit and excludes third-party ownership', async () => {
    const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
    const reference = await readFile(
      join(skillRoot, 'references', 'promotion-contract.md'),
      'utf8',
    );
    const metadata = await readFile(
      join(skillRoot, 'agents', 'openai.yaml'),
      'utf8',
    );

    expect(metadata).toContain('allow_implicit_invocation: false');
    expect(skill).toContain('chc codex skills for discovery');
    expect(skill).toContain('git status --porcelain');
    expect(skill).toMatch(/Require explicit selection for every promoted/u);
    expect(skill).toMatch(/Never execute\s+a source-provided script/u);
    expect(reference).toContain('Repository codex/skills.manifest.json');
    expect(reference).toContain('User npx lock');
    expect(reference).toContain('Installed plugin/cache');
    expect(reference).toContain('System/bundled roots');
    expect(skill).toMatch(
      /classify a malformed or conflicting marker as ambiguous/u,
    );
  });

  test('scans read-only before explicit promotion and cleanup selection', async () => {
    const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
    const reference = await readFile(
      join(skillRoot, 'references', 'promotion-contract.md'),
      'utf8',
    );

    expect(skill).toContain(
      'Explicit invocation authorizes read-only discovery',
    );
    expect(skill).not.toContain(
      'Ask for explicit confirmation before reading either skill tree',
    );
    expect(skill).toContain('promotion action: Promote or Skip');
    expect(skill).toContain('cleanup targets: zero or more exact local paths');
    expect(skill).toContain(
      'Default every row to Skip and every local copy to Keep',
    );
    expect(skill).toMatch(
      /A Codex-local candidate\s+exposes its exact \$CODEX_HOME\/skills\/<name>/u,
    );
    expect(skill).toContain(
      'Hermes candidate exposes its exact $HERMES_HOME/skills/<name> source and its',
    );
    expect(skill).toContain(
      'planned future $CODEX_HOME/skills/<target-name> staging source as independent',
    );
    expect(skill).toContain(
      'cleanup target only when its owning candidate is Promote',
    );
    expect(reference).toContain('Post-discovery selection contract');
    expect(reference).toContain('Promote or Skip');
    expect(reference).toContain(
      'Any reviewed exact local paths owned by this candidate',
    );
    expect(reference).toContain('two independent targets');
  });

  test('absorbs only eligible Hermes evolution skills through the same entry point', async () => {
    const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
    const reference = await readFile(
      join(skillRoot, 'references', 'promotion-contract.md'),
      'utf8',
    );
    const standaloneAbsorber = join(
      repoRoot,
      'codex',
      'plugins',
      'cthu-codex',
      'skills',
      'hermes-skill-absorber',
      'SKILL.md',
    );

    expect(skill).toContain('Discover both source modes read-only');
    expect(skill).toContain('.hermes-evolution.json');
    expect(skill).toContain('.bundled_manifest');
    expect(skill).toContain('.hub/lock.json');
    expect(skill).toContain('protected built-in');
    expect(skill).toMatch(
      /Hermes is not written, renamed, installed, updated, or deleted during\s+discovery, adaptation, repository promotion, installation, or verification/u,
    );
    expect(skill).toContain('.cthu-skill-bridge.json');
    expect(reference).toContain('"source": "hermes-evolution"');
    expect(reference).toContain('created_by: "agent"');
    expect(reference).toContain('"kind": "hermes-absorption"');
    expect(reference).toMatch(
      /Only the final cleanup phase may delete an\s+explicitly selected source/u,
    );
    await expect(access(standaloneAbsorber)).rejects.toThrow();
  });

  test('requires a shared Codex and Hermes compatibility contract', async () => {
    const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
    const reference = await readFile(
      join(skillRoot, 'references', 'promotion-contract.md'),
      'utf8',
    );

    expect(skill).toContain('Preserve a portable shared core');
    expect(skill).toContain('agents/openai.yaml');
    expect(skill).toContain('references/codex-adapter.md');
    expect(skill).toContain('references/hermes-adapter.md');
    expect(skill).toMatch(
      /Do not claim compatibility when required behavior has no safe shared/u,
    );
    expect(reference).toContain('Shared Codex and Hermes compatibility');
    expect(reference).toContain('Shared core');
    expect(reference).toContain('Codex adapter');
    expect(reference).toContain('Hermes adapter');
  });

  test('validates the user-managed checkout without changing checkout state', async () => {
    const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
    const reference = await readFile(
      join(skillRoot, 'references', 'promotion-contract.md'),
      'utf8',
    );

    expect(skill).toContain('Validate the user checkout');
    expect(skill).toContain('Do not run git checkout');
    expect(skill).toContain('git branch --show-current');
    expect(skill).toContain('git rev-parse HEAD');
    expect(skill).toContain('clean, non-detached feature branch');
    expect(skill).not.toContain('git worktree add -b');
    expect(skill).toContain('merge, replace, or rename');
    expect(skill).toContain('chc codex install');
    expect(skill).toContain('--repo-root <current-checkout>');
    expect(skill).toMatch(/personal marketplace\/config\s+registration/u);
    expect(skill).toContain('installed plugin cache');
    expect(skill).toMatch(
      /Retain every Codex-local and Hermes source\s+if installation or verification fails/u,
    );
    expect(reference).toContain(
      'Write a Codex adaptation or repository target into a temporary sibling',
    );
    expect(reference).toContain('Never create, switch, or');
  });

  test('documents guarded cleanup and Git handoff without implicit synchronization', async () => {
    const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
    const reference = await readFile(
      join(skillRoot, 'references', 'promotion-contract.md'),
      'utf8',
    );

    expect(skill).toMatch(/ask a final\s+explicit deletion confirmation/u);
    expect(skill).toContain('Default this confirmation to No');
    expect(skill).toMatch(
      /exact paths in the user-selected cleanup target set/u,
    );
    expect(skill).toMatch(/reviewed\s+fingerprint/u);
    expect(skill).toContain('direct child of the resolved Codex skills root');
    expect(skill).toContain('direct child of the resolved Hermes skills root');
    expect(skill).toContain('same valid .hermes-evolution.json marker');
    expect(skill).toContain('If any check fails, delete none of the');
    expect(skill).toMatch(
      /deletion of\s+the confirmed eligible source tree is the only permitted Hermes mutation/u,
    );
    expect(skill).toMatch(
      /Do not create or switch a branch\s+or worktree, commit, push/u,
    );
    expect(skill).toMatch(
      /Do not execute source-provided scripts or add the skill to\s+codex\/skills\.manifest\.json/u,
    );
    expect(reference).toContain('If any target fails validation, delete none');
    expect(reference).toMatch(
      /Failed install, failed verification, changed fingerprint, changed marker/u,
    );
    expect(reference).toContain('$HERMES_HOME/skills/<sourceRelativePath>');
  });
});
