import { afterEach, describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { scanHermesSkills } from '../../../../.agents/skills/codex-skill-promoter/scripts/scan-hermes-skills.mjs';

const fixtures: string[] = [];
const sha = (data: string) => createHash('sha256').update(data).digest('hex');
function write(path: string, data: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
}
function fixture() {
  const home = mkdtempSync(join(tmpdir(), 'cthu-promoter-'));
  fixtures.push(home);
  write(join(home, 'skills/.bundled_manifest'), '');
  write(join(home, 'skills/.hub/lock.json'), JSON.stringify({ installed: {} }));
  write(join(home, 'skills/.usage.json'), '{}');
  write(join(home, 'skills/.curator_ledger.jsonl'), '');
  write(
    join(home, 'hermes-agent/agent/skill_utils.py'),
    'ESSENTIAL_SKILLS = frozenset({"hermes-agent"})\n',
  );
  write(
    join(home, 'hermes-agent/tools/skill_usage.py'),
    'PROTECTED_BUILTIN_SKILLS: Set[str] = set()\n',
  );
  return home;
}
function skill(
  home: string,
  relative: string,
  name = relative.split('/').at(-1) ?? relative,
  extra = '',
) {
  const path = join(home, 'skills', relative, 'SKILL.md');
  write(
    path,
    [
      '---',
      `name: ${name}`,
      'description: A local test skill',
      extra,
      '---',
      '',
      '# Instructions',
      'Run reviewed work.',
    ]
      .filter((line, index) => line !== '' || index > 5)
      .join('\n'),
  );
  return path;
}
function event(path: string, name: string, actor = 'agent') {
  return {
    id: 'create-1',
    ts: '2026-10-18T00:00:00Z',
    action: 'create',
    actor,
    skill: name,
    before: [],
    after: [{ path, sha256: sha(readFileSync(path, 'utf8')) }],
  };
}
function history(home: string, rows: object[]) {
  write(
    join(home, 'skills/.curator_ledger.jsonl'),
    rows.map((row) => JSON.stringify(row)).join('\n'),
  );
}
function snapshot(home: string) {
  const records: [string, string][] = [];
  function visit(directory: string) {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      const info = lstatSync(path);
      if (info.isSymbolicLink()) records.push([path, 'link']);
      else if (info.isDirectory()) visit(path);
      else records.push([path, sha(readFileSync(path, 'utf8'))]);
    }
  }
  visit(home);
  return records;
}
afterEach(() => {
  for (const home of fixtures.splice(0)) {
    const absolute = resolve(home);
    if (
      !absolute.startsWith(`${resolve(tmpdir())}/`) &&
      !absolute.startsWith(`${resolve(tmpdir())}\\`)
    )
      throw new Error('unsafe fixture cleanup');
    if (
      !dirname(absolute)
        .toLowerCase()
        .startsWith(resolve(tmpdir()).toLowerCase()) ||
      !absolute.includes('cthu-promoter-')
    )
      throw new Error('unsafe fixture path');
    rmSync(absolute, { recursive: true, force: true });
  }
});

describe('Hermes native provenance inventory', () => {
  test.each([
    'agent',
    'curator',
    'user',
  ])('links nested native creation by identity and path (%s)', (actor) => {
    const home = fixture();
    const path = skill(home, 'media/example');
    history(home, [event(path, 'example', actor)]);
    const before = snapshot(home);
    const result = scanHermesSkills({ hermesHome: home });
    expect(result.warnings).toEqual([]);
    expect(result.candidates).toHaveLength(1);
    const candidate = result.candidates[0];
    expect(candidate.sourceRelativePath).toBe('media/example');
    expect(candidate.provenance.classification).toBe('recorded-local-creation');
    expect(candidate.provenance.evidence).toEqual({
      ledgerEntryId: 'create-1',
      actor,
      timestamp: '2026-10-18T00:00:00Z',
      sourceRelativePath: 'media/example',
    });
    expect(candidate.fingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(snapshot(home)).toEqual(before);
  });

  test('package support directories stay inside one reviewed package', () => {
    const home = fixture();
    skill(home, 'media/example');
    write(
      join(home, 'skills/media/example/references/SKILL.md'),
      '# Reference',
    );
    write(
      join(home, 'skills/.archive/old/SKILL.md'),
      'invalid archived content',
    );
    write(join(home, 'skills/_org/org/SKILL.md'), 'organization content');
    const result = scanHermesSkills({ hermesHome: home });
    expect(result.candidates.map((row) => row.sourceRelativePath)).toEqual([
      'media/example',
    ]);
    expect(result.candidates[0].files.map((file) => file.path)).toContain(
      'references/SKILL.md',
    );
  });

  test.each([
    'agent',
    'learn',
  ])('management/learning hints remain uncertain without create evidence (%s)', (createdBy) => {
    const home = fixture();
    skill(home, 'productivity/local');
    write(
      join(home, 'skills/.usage.json'),
      JSON.stringify({
        local: {
          created_by: createdBy,
          created_at: '2026-10-01T00:00:00Z',
          use_count: 99,
        },
      }),
    );
    const result = scanHermesSkills({ hermesHome: home });
    expect(result.candidates[0].provenance.classification).toBe(
      'source-uncertain',
    );
    expect(result.candidates[0].action).toContain(
      'Confirm local source + Promote',
    );
    expect(result.candidates[0].provenance.hints.createdBy).toBe(createdBy);
  });

  test('legacy Evolution claims stay visible without becoming native proof', () => {
    const home = fixture();
    skill(home, 'local');
    write(
      join(home, 'skills/local/.hermes-evolution.json'),
      JSON.stringify({ version: 1, kind: 'evolution', skillName: 'local' }),
    );
    const row = scanHermesSkills({ hermesHome: home }).candidates[0];
    expect(row.provenance.classification).toBe('source-uncertain');
    expect(row.warnings).toContain(
      'legacy Evolution marker is an origin claim',
    );
  });

  test('name-only or mismatched-path events cannot establish provenance', () => {
    const home = fixture();
    const path = skill(home, 'media/local');
    const row = event(path, 'local');
    row.after[0].path = join(home, 'skills/other/local/SKILL.md');
    history(home, [row]);
    expect(
      scanHermesSkills({ hermesHome: home }).candidates[0].provenance
        .classification,
    ).toBe('source-uncertain');
  });

  test('a tracked patch retains lineage while unlogged edits need review', () => {
    const home = fixture();
    const path = skill(home, 'local');
    const created = event(path, 'local');
    writeFileSync(path, `${readFileSync(path, 'utf8')}\nA reviewed edit.`);
    history(home, [
      created,
      {
        ...created,
        id: 'patch-1',
        action: 'patch',
        before: created.after,
        after: [{ path, sha256: sha(readFileSync(path, 'utf8')) }],
      },
    ]);
    expect(
      scanHermesSkills({ hermesHome: home }).candidates[0].provenance
        .classification,
    ).toBe('recorded-local-creation');
    writeFileSync(path, `${readFileSync(path, 'utf8')}\nAn unlogged edit.`);
    expect(
      scanHermesSkills({ hermesHome: home }).candidates[0].provenance.reason,
    ).toBe('current-content-not-covered-by-ledger');
  });

  test('later deletion invalidates stale creation evidence', () => {
    const home = fixture();
    const path = skill(home, 'local');
    const created = event(path, 'local');
    history(home, [
      created,
      {
        ...created,
        id: 'delete-1',
        action: 'delete',
        before: created.after,
        after: [],
      },
    ]);
    expect(
      scanHermesSkills({ hermesHome: home }).candidates[0].provenance
        .classification,
    ).toBe('source-uncertain');
  });

  test('malformed provenance is reported without hiding local packages', () => {
    const home = fixture();
    skill(home, 'local');
    write(join(home, 'skills/.curator_ledger.jsonl'), '{bad');
    const result = scanHermesSkills({ hermesHome: home });
    expect(result.candidates[0].provenance.classification).toBe(
      'source-uncertain',
    );
    expect(result.warnings.join(' ')).toContain('invalid event');
  });

  test('missing creation snapshots and broken patch chains require source confirmation', () => {
    const home = fixture();
    const path = skill(home, 'local');
    const created = event(path, 'local');
    history(home, [{ ...created, before: undefined }]);
    expect(
      scanHermesSkills({ hermesHome: home }).candidates[0].provenance
        .classification,
    ).toBe('source-uncertain');
    history(home, [
      created,
      { ...created, id: 'patch-1', action: 'patch', before: [] },
    ]);
    expect(
      scanHermesSkills({ hermesHome: home }).candidates[0].provenance
        .classification,
    ).toBe('source-uncertain');
  });

  test('hard ownership and opt-out exclusions stay outside user-origin review', () => {
    const home = fixture();
    skill(home, 'category/bundled');
    skill(home, 'hub-path');
    skill(home, 'category/installed');
    skill(home, 'category/hermes-agent');
    skill(home, 'category/optout', 'optout', 'sync: false');
    write(
      join(home, 'skills/.bundled_manifest'),
      `bundled:${'a'.repeat(32)}\n`,
    );
    write(
      join(home, 'skills/.hub/lock.json'),
      JSON.stringify({ installed: { foreign: { install_path: 'hub-path' } } }),
    );
    write(
      join(home, 'skills/.usage.json'),
      JSON.stringify({ installed: { created_by: 'installed' } }),
    );
    const result = scanHermesSkills({ hermesHome: home });
    expect(result.candidates).toEqual([]);
    expect(result.excluded.map((row) => row.reason).sort()).toEqual(
      [
        'bundled',
        'hub-managed',
        'hub-or-installed',
        'opted-out',
        'protected',
      ].sort(),
    );
  });

  test('unavailable ownership data blocks selection rather than offering an origin override', () => {
    const home = fixture();
    skill(home, 'local');
    write(join(home, 'skills/.hub/lock.json'), '{bad');
    const result = scanHermesSkills({ hermesHome: home });
    expect(result.candidates).toEqual([]);
    expect(result.excluded[0].reason).toBe('ownership-inventory-unavailable');
  });

  test.each([
    ['skills/.bundled_manifest', 'local-without-hash'],
    [
      'skills/.hub/lock.json',
      JSON.stringify({ installed: { foreign: { install_path: '../local' } } }),
    ],
    [
      'hermes-agent/agent/skill_utils.py',
      'ESSENTIAL_SKILLS = frozenset(load_names())\n',
    ],
  ])('unsupported ownership inventory blocks affected selection (%s)', (relative, content) => {
    const home = fixture();
    skill(home, 'local');
    write(join(home, relative), content);
    const result = scanHermesSkills({ hermesHome: home });
    expect(result.candidates).toEqual([]);
    expect(result.excluded[0].reason).toBe('ownership-inventory-unavailable');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('multiline protected sets and Windows Hub paths preserve ownership', () => {
    const home = fixture();
    skill(home, 'category/protected');
    skill(home, 'category/installed');
    write(
      join(home, 'hermes-agent/agent/skill_utils.py'),
      'ESSENTIAL_SKILLS = frozenset({\n  "protected", # core skill\n})\n',
    );
    write(
      join(home, 'skills/.hub/lock.json'),
      JSON.stringify({
        installed: {
          foreign: { install_path: 'category\\installed' },
        },
      }),
    );
    const result = scanHermesSkills({ hermesHome: home });
    expect(result.warnings).toEqual([]);
    expect(result.candidates).toEqual([]);
    expect(result.excluded.map((row) => row.reason).sort()).toEqual([
      'hub-managed',
      'protected',
    ]);
  });

  test('duplicate names keep distinct relative identities and collision warnings', () => {
    const home = fixture();
    const first = skill(home, 'media/one', 'duplicate');
    skill(home, 'productivity/two', 'duplicate');
    history(home, [event(first, 'duplicate')]);
    const result = scanHermesSkills({ hermesHome: home });
    expect(result.candidates.map((row) => row.sourceRelativePath)).toEqual([
      'media/one',
      'productivity/two',
    ]);
    expect(
      result.candidates.map((row) => row.provenance.classification),
    ).toEqual(['recorded-local-creation', 'source-uncertain']);
    expect(
      result.candidates.every((row) =>
        row.warnings.some((warning) =>
          warning.includes('duplicate Skill name'),
        ),
      ),
    ).toBe(true);
  });

  test('external categories and linked packages stay outside discovery', () => {
    const home = fixture();
    skill(home, 'external/local');
    write(
      join(home, 'config.yaml'),
      'skills:\n  external_dirs:\n    - skills/external\n',
    );
    const outside = join(home, 'outside');
    mkdirSync(outside);
    symlinkSync(
      outside,
      join(home, 'skills/linked'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    const before = snapshot(home);
    const result = scanHermesSkills({ hermesHome: home });
    expect(result.candidates).toEqual([]);
    expect(result.excluded.map((row) => row.reason)).toEqual([
      'external-owned',
      'symbolic-link',
    ]);
    expect(snapshot(home)).toEqual(before);
  });

  test('external directories expand environment variables and ignore the local root', () => {
    const home = fixture();
    skill(home, 'external/local');
    skill(home, 'visible');
    const variable = 'CTHU_PROMOTER_TEST_EXTERNAL';
    const previous = process.env[variable];
    process.env[variable] = join(home, 'skills/external');
    try {
      const paths = [`${'${'}${variable}}`, `$${variable}`];
      if (process.platform === 'win32') paths.push(`%${variable}%`);
      for (const external of paths) {
        write(
          join(home, 'config.yaml'),
          `skills:\n  external_dirs:\n    - '${external}'\n    - skills\n`,
        );
        const result = scanHermesSkills({ hermesHome: home });
        expect(result.candidates.map((row) => row.name)).toEqual(['visible']);
        expect(result.excluded.map((row) => row.reason)).toEqual([
          'external-owned',
        ]);
      }
    } finally {
      if (previous === undefined) delete process.env[variable];
      else process.env[variable] = previous;
    }
  });

  test('links and escaping references inside packages prevent promotion', () => {
    const home = fixture();
    const path = skill(home, 'escaping');
    writeFileSync(
      path,
      `${readFileSync(path, 'utf8')}\n[Shared](../shared.md)`,
    );
    write(join(home, 'skills/shared.md'), 'unselected shared content');
    skill(home, 'linked');
    const outside = join(home, 'outside');
    mkdirSync(outside);
    symlinkSync(
      outside,
      join(home, 'skills/linked/references'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    const result = scanHermesSkills({ hermesHome: home });
    expect(result.candidates).toEqual([]);
    expect(result.excluded.map((row) => row.reason)).toContain(
      'escaping-reference',
    );
    expect(result.excluded.map((row) => row.reason)).toContain(
      'symbolic-link in package',
    );
  });
});
