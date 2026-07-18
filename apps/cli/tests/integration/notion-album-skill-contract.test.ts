import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const skillRoot = join(
  repoRoot,
  'codex',
  'plugins',
  'cthu-codex',
  'skills',
  'notion-maintain-album',
);

describe('Notion album skill safety contract', () => {
  test('keeps implicit invocation narrow and requires preview confirmation', async () => {
    const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
    const metadata = await readFile(
      join(skillRoot, 'agents', 'openai.yaml'),
      'utf8',
    );
    expect(metadata).toContain('allow_implicit_invocation: true');
    expect(skill).toContain('not ordinary music discussion');
    expect(skill).toContain(
      'No Notion write of any kind before an explicit preview confirmation',
    );
    expect(skill).toContain('Check-only requests end after the report');
  });

  test('documents missing-only writes, personal-field exclusion, and verification', async () => {
    const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
    expect(skill).toContain('minimally update the reconciled target');
    expect(skill).toMatch(/Omit personal fields\s+from the payload/);
    expect(skill).toContain('discover current state before any retry');
    expect(skill).toContain('Never create an Artist page');
    expect(skill).toContain('Query again by canonical Release Group URL');
  });

  test('documents confirmed Genre growth and blocking Artist conflicts', async () => {
    const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
    const reference = await readFile(
      join(skillRoot, 'references', 'schema-and-matching.md'),
      'utf8',
    );
    expect(skill).toContain(
      'Add every still-missing, confirmed Discogs Genre/Style option',
    );
    expect(skill).toContain('A missing page, multiple exact names');
    expect(reference).toContain('new upstream primary type must be previewed');
  });
});
