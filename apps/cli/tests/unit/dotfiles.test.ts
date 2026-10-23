import { afterEach, describe, expect, test } from 'bun:test';
import {
  chmod,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { credentialPath, ensureAuth } from '../../src/domain/dotfiles/auth';
import { diagnose, installEntry } from '../../src/domain/dotfiles/environment';
import {
  assertCompatibleHost,
  resolvePlan,
  validateCatalog,
} from '../../src/domain/dotfiles/model';
import {
  candidateSnapshot,
  normalizeNotion,
  stableList,
} from '../../src/domain/dotfiles/notion-sync';
import {
  NotionClient,
  redactSecrets,
} from '../../src/infra/dotfiles/notion-http';
import {
  privateRead,
  privateWrite,
} from '../../src/infra/dotfiles/private-store';
import {
  digest,
  GENERATED_FILES,
  loadSnapshot,
  MANIFEST,
  readSources,
  resolveSource,
  TRANSACTION,
} from '../../src/infra/dotfiles/source';
import {
  createDotfilesSystem,
  type DotfilesSystem,
} from '../../src/infra/dotfiles/system';
import {
  publishSnapshot,
  recoverTransaction,
  withSourceLock,
} from '../../src/infra/dotfiles/transaction';
import { notionFixture } from '../fixtures/dotfiles/notion-fixture';

const root = resolve(import.meta.dir, '../../../..');
const dirs: string[] = [];
async function temporary() {
  const path = await mkdtemp(join(tmpdir(), 'chc-dotfiles-test-'));
  dirs.push(path);
  return path;
}
afterEach(async () => {
  for (const d of dirs.splice(0)) await rm(d, { recursive: true, force: true });
});
async function testSystem() {
  const home = await temporary();
  const calls: { command: string; args: string[] }[] = [];
  const s: DotfilesSystem = {
    ...createDotfilesSystem(),
    home,
    environment: {
      ...process.env,
      HOME: home,
      XDG_CONFIG_HOME: join(home, '.config'),
      XDG_DATA_HOME: join(home, '.local/share'),
    },
    os: 'linux',
    wsl: false,
    arch: 'x64',
    which: async () => undefined,
    run: async (command, args) => {
      calls.push({ command, args });
      return { code: 0, stdout: '', stderr: '' };
    },
    fetch: async () => {
      throw new Error('Unexpected network');
    },
  };
  return { s, calls };
}
async function sourceCopy() {
  const p = await temporary();
  await cp(join(root, 'dotfiles'), join(p, 'dotfiles'), { recursive: true });
  await cp(join(root, '.chezmoiroot'), join(p, '.chezmoiroot'));
  return p;
}
describe('published model and baseline plans', () => {
  test('five inventory fixtures retain IDs, ordering, owners, platforms, provenance and runtime boundary', async () => {
    const { catalog } = await loadSnapshot(root);
    for (const host of Object.keys(catalog.hosts)) {
      const plan = resolvePlan(catalog, host);
      const fixture = await readFile(
        join(
          root,
          'apps/cli/tests/fixtures/dotfiles/baseline',
          `${host}-inventory.txt`,
        ),
        'utf8',
      );
      const packages = fixture
        .split('PACKAGE:\n')[1]
        .split('SKIPPED:')[0]
        .trim()
        .split('\n')
        .filter(Boolean);
      expect(
        plan.entries
          .filter((e) => e.classification === 'package')
          .map((e) => e.id),
      ).toEqual(packages.map((l) => l.trim().split(' ')[0]));
      for (const line of packages) {
        const e = plan.entries.find((e) => e.id === line.trim().split(' ')[0]);
        expect(e?.platform?.install as string | undefined).toBe(
          /install=(\S+)/.exec(line)?.[1],
        );
        expect(e?.platform?.package).toBe(/pkg=(\S+)/.exec(line)?.[1]);
        expect(e?.provenance).toBe(/src=(\S+)/.exec(line)?.[1]);
      }
      expect(
        plan.entries.every((e) =>
          e.classification === 'runtime' ? !e.platform : !!e.platform?.owner,
        ),
      ).toBe(true);
    }
    expect(() => resolvePlan(catalog, 'unknown')).toThrow('Unknown or unbound');
    expect(() =>
      assertCompatibleHost(catalog, 'windows-desktop', {
        os: 'linux',
        wsl: true,
      }),
    ).toThrow('incompatible');
    expect(() =>
      assertCompatibleHost(catalog, 'linux-ubuntu-server', {
        os: 'linux',
        wsl: true,
      }),
    ).toThrow('incompatible');
    assertCompatibleHost(catalog, 'linux-wsl', { os: 'linux', wsl: true });
  });
  test('strict fields, nested health and dangling references fail before execution', async () => {
    const { catalog } = await loadSnapshot(root);
    const bad = structuredClone(catalog);
    Object.assign(bad.tools.git, { unknown: true });
    expect(() => validateCatalog(bad)).toThrow('unknown');
    const invalid = structuredClone(catalog);
    invalid.hosts['linux-wsl'].toolsets.push('missing');
    expect(() => validateCatalog(invalid)).toThrow('unknown toolset');
    const service = structuredClone(catalog);
    delete service.tools.k3s.platforms.linux?.service;
    expect(() => validateCatalog(service)).toThrow('k3s');
  });
  test('explicit source works outside cwd and rejects digest/interrupted generation', async () => {
    const { s, calls } = await testSystem();
    expect((await resolveSource(s, root)).source).toBe(root);
    expect(calls).toEqual([]);
    const p = await sourceCopy();
    await writeFile(join(p, GENERATED_FILES[0]), 'tools: {}');
    await expect(loadSnapshot(p)).rejects.toThrow('digest');
    await mkdir(join(p, TRANSACTION));
    await expect(loadSnapshot(p)).rejects.toThrow('Interrupted');
  });
  test('doctor and ownership dispatcher are read only or explicit', async () => {
    const { catalog } = await loadSnapshot(root);
    const { s, calls } = await testSystem();
    for (const h of Object.keys(catalog.hosts))
      await diagnose(resolvePlan(catalog, h).entries, s);
    expect(
      calls.some((c) =>
        ['apt-get', 'sudo', 'brew', 'winget'].includes(c.command),
      ),
    ).toBe(false);
    const runtime = resolvePlan(catalog, 'linux-wsl').entries.find(
      (e) => e.classification === 'runtime',
    );
    expect(runtime).toBeDefined();
    if (runtime)
      expect((await installEntry(runtime, s)).status).toBe('external');
    const git = resolvePlan(catalog, 'linux-ubuntu-server').entries[0];
    await installEntry(git, s);
    expect(calls.at(-1)).toEqual({
      command: 'sudo',
      args: ['apt-get', 'install', '-y', '--', 'git'],
    });
    const present = {
      ...s,
      which: async () => '/fake/k3s',
      run: async () => ({ code: 0, stdout: 'k3s v0.0.1', stderr: '' }),
    };
    const k3s = resolvePlan(catalog, 'linux-ubuntu-server').entries.find(
      (e) => e.id === 'k3s',
    );
    if (k3s) expect((await installEntry(k3s, present)).status).toBe('manual');
  });
});
describe('Notion API, shared authentication and private cache', () => {
  test('bounded retries honor Retry-After and do not reflect request secrets', async () => {
    const config = await readSources(root);
    let count = 0;
    const sleeps: number[] = [];
    const client = new NotionClient(
      'FAKE_IDENTIFIABLE_SECRET',
      config,
      async () => {
        count++;
        return new Response('FAKE_IDENTIFIABLE_SECRET', {
          status: 429,
          headers: { 'Retry-After': '1' },
        });
      },
      async (ms) => {
        sleeps.push(ms);
      },
    );
    await expect(client.verify()).rejects.toThrow('Notion HTTP 429');
    expect(count).toBe(4);
    expect(sleeps).toEqual([1000, 1000, 1000]);
    expect(redactSecrets('reflected FAKE_IDENTIFIABLE_SECRET')).not.toContain(
      'FAKE_IDENTIFIABLE_SECRET',
    );
    count = 0;
    const long = new NotionClient(
      'fake',
      config,
      async () => {
        count++;
        return new Response('', {
          status: 429,
          headers: { 'Retry-After': '90' },
        });
      },
      async () => {
        throw new Error('Must not retry early');
      },
    );
    await expect(long.verify()).rejects.toThrow('budget');
    expect(count).toBe(1);
  });
  test('query and relation pagination complete; later failures produce no partial result', async () => {
    const config = await readSources(root);
    let q = 0,
      r = 0;
    const client = new NotionClient('fake', config, async (url) => {
      const u = String(url);
      if (u.includes('/properties/')) expect(u).toContain('/properties/x%3Ay?');
      if (u.includes('/query'))
        return Response.json(
          q++ === 0
            ? {
                results: [
                  {
                    id: 'page',
                    properties: {
                      Tools: {
                        id: 'x%3Ay',
                        type: 'relation',
                        relation: [{ id: 'first' }],
                        has_more: true,
                      },
                    },
                  },
                ],
                has_more: true,
                next_cursor: 'next',
              }
            : { results: [], has_more: false },
        );
      r++;
      return Response.json(
        r === 1
          ? {
              results: [{ relation: { id: 'first' } }],
              has_more: true,
              next_cursor: 'second',
            }
          : { results: [{ relation: { id: 'last' } }], has_more: false },
      );
    });
    const pages = await client.pages('source');
    expect(q).toBe(2);
    expect(r).toBe(2);
    expect(pages[0].properties.Tools.relation).toEqual([
      { id: 'first' },
      { id: 'last' },
    ]);
    let n = 0;
    const failure = new NotionClient('fake', config, async () =>
      ++n === 1
        ? Response.json({ results: [], has_more: true, next_cursor: 'next' })
        : new Response('', { status: 403 }),
    );
    await expect(failure.pages('source')).rejects.toThrow('403');
  });
  test('cache uses 0700/0600, rejects links; replacement failure preserves old cache', async () => {
    const { s } = await testSystem();
    const path = credentialPath(s);
    await privateWrite(path, 'old', s);
    expect((await lstat(path)).mode & 0o777).toBe(0o600);
    expect(
      (await lstat(join(s.home, '.cthutool/credentials'))).mode & 0o777,
    ).toBe(0o700);
    await rm(path);
    await symlink(join(s.home, 'elsewhere'), path);
    await expect(privateWrite(path, 'secret', s)).rejects.toThrow('linked');
    await rm(path);
    await privateWrite(path, 'old', s);
    await chmod(join(s.home, '.cthutool/credentials'), 0o755);
    await expect(privateRead(path, s)).rejects.toThrow('permissions');
  });
  test('auth can clear an unsafe cache or linked leaf without reading it or contacting Notion', async () => {
    const { s } = await testSystem();
    const path = credentialPath(s);
    const clear = () =>
      ensureAuth({
        system: s,
        source: async () => {
          throw new Error('Clear must not resolve a source');
        },
        interactive: true,
        manage: true,
        env: '',
        interaction: {
          hiddenToken: async () => {
            throw new Error('Clear must not prompt for a Token');
          },
          chooseAuth: async () => 'clear',
        },
      });
    await privateWrite(path, 'invalid-cache', s);
    await chmod(path, 0o644);
    expect(await clear()).toEqual({
      cleared: true,
      environmentStillActive: false,
    });
    expect(await privateRead(path, s)).toBeUndefined();
    const target = join(s.home, 'preserved-file');
    await writeFile(target, 'preserve');
    await symlink(target, path);
    expect((await clear()).cleared).toBe(true);
    expect(await readFile(target, 'utf8')).toBe('preserve');
    expect(await privateRead(path, s)).toBeUndefined();
  });
  test('env wins without persistence, entered token verifies every source before save; missing noninteractive never prompts', async () => {
    const { s } = await testSystem();
    let prompts = 0;
    const interaction = {
      hiddenToken: async () => {
        prompts++;
        return 'new-fake-token';
      },
      chooseAuth: async () => 'reuse' as const,
    };
    const urls: string[] = [];
    s.fetch = async (url) => {
      urls.push(String(url));
      return Response.json({ properties: {} });
    };
    await ensureAuth({
      system: s,
      source: async () => root,
      interactive: false,
      interaction,
      env: 'env-fake-token',
    });
    expect(urls).toHaveLength(4);
    expect(await privateRead(credentialPath(s), s)).toBeUndefined();
    await expect(
      ensureAuth({
        system: s,
        source: async () => root,
        interactive: false,
        interaction,
        env: '',
      }),
    ).rejects.toThrow('Token missing');
    expect(prompts).toBe(0);
    await ensureAuth({
      system: s,
      source: async () => root,
      interactive: true,
      interaction,
      env: '',
    });
    expect(prompts).toBe(1);
    const old = await readFile(credentialPath(s), 'utf8');
    s.fetch = async () =>
      new Response('reflected new-fake-token', { status: 403 });
    await expect(
      ensureAuth({
        system: s,
        source: async () => root,
        interactive: true,
        interaction: { ...interaction, chooseAuth: async () => 'replace' },
        manage: true,
        env: '',
      }),
    ).rejects.toThrow('403');
    expect(await readFile(credentialPath(s), 'utf8')).toBe(old);
    await ensureAuth({
      system: s,
      source: async () => {
        throw new Error('No source needed');
      },
      interactive: true,
      interaction: { ...interaction, chooseAuth: async () => 'clear' },
      manage: true,
      env: '',
    });
    expect(await privateRead(credentialPath(s), s)).toBeUndefined();
  });
});
describe('lossless normalization and recoverable publication', () => {
  test('full model round-trip preserves k3s/k9s, relation sets and byte stability', async () => {
    const old = await loadSnapshot(root);
    const f = notionFixture(old.catalog, old.manifest);
    const normalized = normalizeNotion(f.read, old.catalog, f.manifest);
    expect(normalized.catalog).toEqual(old.catalog);
    expect(normalized.catalog.tools.k3s).toEqual(old.catalog.tools.k3s);
    expect(normalized.catalog.tools.k9s).toEqual(old.catalog.tools.k9s);
    const candidate = candidateSnapshot(normalized, f.manifest, old.files);
    for (const pages of Object.values(f.read.pages)) pages.reverse();
    for (const page of f.read.pages.hosts)
      page.properties.Toolsets.relation?.reverse();
    expect(
      candidateSnapshot(
        normalizeNotion(f.read, old.catalog, f.manifest),
        f.manifest,
        old.files,
      ).files,
    ).toEqual(candidate.files);
    expect(stableList(['b', 'a'], ['c', 'a', 'b', 'd'])).toEqual([
      'b',
      'a',
      'c',
      'd',
    ]);
  });
  test('missing/draft/duplicate/rename pages, dangling relations, conflicting structured JSON fail', async () => {
    const old = await loadSnapshot(root);
    for (const mutate of [
      (f: ReturnType<typeof notionFixture>) => {
        f.read.pages.hosts.pop();
      },
      (f: ReturnType<typeof notionFixture>) => {
        f.read.pages.hosts[0].properties.State.select = { name: 'draft' };
      },
      (f: ReturnType<typeof notionFixture>) => {
        f.read.pages.software.push(f.read.pages.software[0]);
      },
      (f: ReturnType<typeof notionFixture>) => {
        f.read.pages.toolsets[0].properties.Software.relation = [
          { id: 'hidden' },
        ];
      },
      (f: ReturnType<typeof notionFixture>) => {
        f.read.pages.software[0].properties['Linux Config'].rich_text = [
          { text: { content: '{"version":1,"value":{"owner":"user"}}' } },
        ];
      },
    ]) {
      const f = notionFixture(old.catalog, old.manifest);
      mutate(f);
      expect(() => normalizeNotion(f.read, old.catalog, f.manifest)).toThrow();
    }
  });
  test('every publication replacement failure restores the complete prior generation', async () => {
    const p = await sourceCopy();
    const old = await loadSnapshot(p);
    const f = notionFixture(old.catalog, old.manifest);
    f.read.pages.software[0].properties.Homepage.url =
      'https://example.invalid/git';
    const candidate = candidateSnapshot(
      normalizeNotion(f.read, old.catalog, f.manifest),
      f.manifest,
      old.files,
    );
    const baseline: Record<string, string> = {
      ...old.files,
      [MANIFEST]: await readFile(join(p, MANIFEST), 'utf8'),
    };
    for (let i = 0; i < 5; i++) {
      await expect(
        withSourceLock(p, () =>
          publishSnapshot(p, candidate.files, baseline, (n) => {
            if (n === i) throw new Error('Injected failure');
          }),
        ),
      ).rejects.toThrow('Injected');
      expect((await loadSnapshot(p)).files).toEqual(old.files);
    }
    await withSourceLock(p, () =>
      publishSnapshot(p, candidate.files, baseline),
    );
    const published = await loadSnapshot(p);
    expect(published.catalog.tools.git.homepage).toBe(
      'https://example.invalid/git',
    );
    expect(await recoverTransaction(p)).toBe(false);
  });
  test('unvalidated allowlist and active writer are rejected', async () => {
    const p = await sourceCopy();
    await expect(
      publishSnapshot(p, { '../escape': 'bad' }, {}),
    ).rejects.toThrow('allowlist');
    await withSourceLock(p, async () => {
      await expect(withSourceLock(p, async () => {})).rejects.toThrow('busy');
    });
    expect(digest('known')).toHaveLength(64);
  });
});

test('private cache replacement fault leaves the previous Token and no temporary file', async () => {
  const { s } = await testSystem();
  const path = credentialPath(s);
  await privateWrite(path, 'old-value', s);
  await expect(
    privateWrite(path, 'new-value', s, async () => {
      throw new Error('Injected rename failure');
    }),
  ).rejects.toThrow('Injected');
  expect(await privateRead(path, s)).toBe('old-value');
  const { readdir } = await import('node:fs/promises');
  expect(await readdir(join(s.home, '.cthutool/credentials'))).toEqual([
    'notion.json',
  ]);
});
test('interrupted generation recovery is local, and refuses later user edits without losing materials', async () => {
  const p = await sourceCopy();
  const old = await loadSnapshot(p);
  const baseline: Record<string, string> = {
    ...old.files,
    [MANIFEST]: await readFile(join(p, MANIFEST), 'utf8'),
  };
  const after: Record<string, string> = {
    ...baseline,
    [GENERATED_FILES[0]]: `${baseline[GENERATED_FILES[0]]}\n# candidate\n`,
  };
  const dir = join(p, TRANSACTION);
  await mkdir(dir);
  const paths = [...GENERATED_FILES, MANIFEST];
  const items = [];
  for (const [i, path] of paths.entries()) {
    await writeFile(join(dir, `${i}.before`), baseline[path]);
    items.push({
      path,
      before: digest(baseline[path]),
      after: digest(after[path]),
    });
  }
  await writeFile(
    join(dir, 'journal.json'),
    JSON.stringify({ version: 1, items }),
  );
  await writeFile(join(p, GENERATED_FILES[0]), after[GENERATED_FILES[0]]);
  await writeFile(join(p, GENERATED_FILES[1]), 'new user edit');
  await expect(recoverTransaction(p)).rejects.toThrow('local edits');
  expect(await readFile(join(p, GENERATED_FILES[0]), 'utf8')).toBe(
    after[GENERATED_FILES[0]],
  );
  await writeFile(join(p, GENERATED_FILES[1]), baseline[GENERATED_FILES[1]]);
  expect(await withSourceLock(p, () => recoverTransaction(p))).toBe(true);
  expect((await loadSnapshot(p)).files).toEqual(old.files);
});
test('platform dispatch covers declarative managers, external owners and trusted official installers', async () => {
  const { catalog } = await loadSnapshot(root);
  const { s, calls } = await testSystem();
  for (const method of [
    'apt',
    'brew',
    'brew-cask',
    'winget',
    'powershell-gallery',
  ] as const) {
    const found = Object.entries(catalog.tools)
      .flatMap(([id, software]) =>
        Object.entries(software.platforms).map(([os, platform]) => ({
          id,
          software,
          platform,
          os,
        })),
      )
      .find(
        (e) =>
          e.platform.owner === 'dot' &&
          e.platform.install === method &&
          !e.platform.handler,
      );
    expect(found).toBeDefined();
    if (!found) continue;
    calls.length = 0;
    await installEntry(
      { ...found, classification: 'package', provenance: 'test' },
      s,
    );
    expect(calls[0].command).toBe(
      {
        apt: 'sudo',
        brew: 'brew',
        'brew-cask': 'brew',
        winget: 'winget',
        'powershell-gallery': 'pwsh',
      }[method],
    );
  }
  for (const handler of [
    'docker-engine',
    'oh-my-zsh',
    'codex-cli',
    'claude-code',
  ] as const) {
    const found = Object.entries(catalog.tools)
      .flatMap(([id, software]) =>
        Object.values(software.platforms).map((platform) => ({
          id,
          software,
          platform,
        })),
      )
      .find((e) => e.platform.handler === handler);
    expect(found).toBeDefined();
    if (!found) continue;
    calls.length = 0;
    s.fetch = async () => new Response('# fixture installer');
    await installEntry(
      { ...found, classification: 'package', provenance: 'test' },
      s,
    );
    expect(calls.length).toBeGreaterThan(0);
  }
});

test('cached 401 offers one replacement; repeated rejection preserves cache; environment failure never falls back', async () => {
  const { s } = await testSystem();
  await privateWrite(
    credentialPath(s),
    JSON.stringify({ version: 1, token: 'old-fake-token' }),
    s,
  );
  const old = await readFile(credentialPath(s), 'utf8');
  let prompts = 0;
  s.fetch = async () => new Response('', { status: 401 });
  const interaction = {
    hiddenToken: async () => {
      prompts++;
      return 'new-fake-token';
    },
    chooseAuth: async () => 'reuse' as const,
  };
  await expect(
    ensureAuth({
      system: s,
      source: async () => root,
      interactive: true,
      interaction,
      env: '',
    }),
  ).rejects.toThrow('401');
  expect(prompts).toBe(1);
  expect(await readFile(credentialPath(s), 'utf8')).toBe(old);
  prompts = 0;
  await expect(
    ensureAuth({
      system: s,
      source: async () => root,
      interactive: true,
      interaction,
      env: 'environment-fake-token',
    }),
  ).rejects.toThrow('401');
  expect(prompts).toBe(0);
});
test('direct API fixture → diff → gated pull → offline validate → expanded host plan', async () => {
  const { runCommand } = await import('citty');
  const { spyOn } = await import('bun:test');
  const { createDotfilesCommand } = await import(
    '../../src/command/dotfiles.command'
  );
  const source = await sourceCopy();
  await cp(join(root, 'package.json'), join(source, 'package.json'));
  const old = await loadSnapshot(source);
  const fixture = notionFixture(old.catalog, old.manifest);
  fixture.manifest.alignmentReviewed = false;
  await writeFile(
    join(source, MANIFEST),
    `${JSON.stringify(fixture.manifest, null, 2)}\n`,
  );
  const { s, calls } = await testSystem();
  const sources = await readSources(source);
  const requests: string[] = [];
  s.run = async (command, args) => {
    calls.push({ command, args });
    return { code: 0, stdout: `${source}\n`, stderr: '' };
  };
  s.fetch = async (url, init) => {
    const path = String(url).split('/v1/')[1];
    requests.push(`${init?.method} ${path}`);
    if (path === 'users/me') return Response.json({});
    for (const group of ['software', 'toolsets', 'hosts'] as const) {
      if (path === `data_sources/${sources.sources[group]}`)
        return Response.json(fixture.read.schemas[group]);
      if (path === `data_sources/${sources.sources[group]}/query`)
        return Response.json({
          results: fixture.read.pages[group],
          has_more: false,
        });
    }
    throw new Error('Unexpected API request');
  };
  await privateWrite(
    credentialPath(s),
    JSON.stringify({ version: 1, token: 'fixture-api-token' }),
    s,
  );
  const command = createDotfilesCommand({
    system: s,
    isTty: () => false,
    auth: {
      hiddenToken: async () => {
        throw new Error('Must not prompt');
      },
      chooseAuth: async () => undefined,
    },
  });
  async function invoke(args: string[]) {
    let output = '';
    const previous = process.exitCode;
    const writer = spyOn(process.stdout, 'write').mockImplementation((s) => {
      output += String(s);
      return true;
    });
    try {
      await runCommand(command, {
        rawArgs: [
          'notion',
          ...args,
          '--source',
          source,
          '--json',
          '--no-interactive',
        ],
      });
      return { value: JSON.parse(output), exitCode: process.exitCode };
    } finally {
      writer.mockRestore();
      process.exitCode = previous;
    }
  }
  const before = await readFile(join(source, GENERATED_FILES[0]), 'utf8');
  expect((await invoke(['diff'])).value.result.hasChanges).toBe(false);
  expect(await readFile(join(source, GENERATED_FILES[0]), 'utf8')).toBe(before);
  fixture.read.pages.software[0].properties.Homepage.url =
    'https://example.invalid/reviewed-git';
  expect((await invoke(['diff'])).value.result.hasChanges).toBe(true);
  const blocked = await invoke(['pull']);
  expect(blocked.value.ok).toBe(false);
  expect(blocked.value.error.message).toContain('alignment');
  expect(await readFile(join(source, GENERATED_FILES[0]), 'utf8')).toBe(before);
  fixture.manifest.alignmentReviewed = true;
  await writeFile(
    join(source, MANIFEST),
    `${JSON.stringify(fixture.manifest, null, 2)}\n`,
  );
  expect((await invoke(['pull'])).value.result.published).toBe(true);
  const published = await loadSnapshot(source);
  expect(
    resolvePlan(published.catalog, 'linux-ubuntu-server').entries.find(
      (e) => e.id === 'git',
    )?.software.homepage,
  ).toBe('https://example.invalid/reviewed-git');
  const retiredPage = fixture.read.pages.hosts.find(
    (p) => p.id === fixture.ids.hosts.get('linux-wsl'),
  );
  if (!retiredPage) throw new Error('Fixture host missing');
  retiredPage.properties.State.select = { name: 'retired' };
  expect((await invoke(['pull'])).value.error.message).toContain(
    '--allow-retire',
  );
  expect(
    (await invoke(['pull', '--allow-retire', 'hosts:linux-wsl'])).value.result
      .published,
  ).toBe(true);
  expect(
    (await loadSnapshot(source)).catalog.hosts['linux-wsl'],
  ).toBeUndefined();
  expect(
    calls.every((c) => c.command === 'git' && c.args[0] === 'rev-parse'),
  ).toBe(true);
  expect(
    requests.every(
      (p) =>
        p.startsWith('GET ') || (p.endsWith('/query') && p.startsWith('POST ')),
    ),
  ).toBe(true);
});

test('Windows npm runs under the selected Node with literal argv and the same npm prefix', async () => {
  const { resolveNodeCommand } = await import('../../src/infra/node-command');
  const p = await temporary();
  const node = join(p, 'node.exe');
  const npm = join(p, 'node_modules/npm/bin/npm-cli.js');
  await mkdir(join(p, 'node_modules/npm/bin'), { recursive: true });
  await writeFile(npm, '// fixture');
  expect(
    resolveNodeCommand(
      'npm',
      ['install', '-g', 'C:\\path with spaces\\repo'],
      'win32',
      node,
    ),
  ).toEqual({
    command: node,
    args: [npm, 'install', '-g', 'C:\\path with spaces\\repo'],
  });
  expect(resolveNodeCommand('git', ['status'], 'win32', node)).toEqual({
    command: 'git',
    args: ['status'],
  });
});

test('k3s fresh install retains pinned service/kubeconfig policy and never overwrites existing cluster material', async () => {
  const { catalog } = await loadSnapshot(root);
  const e = resolvePlan(catalog, 'linux-ubuntu-server').entries.find(
    (e) => e.id === 'k3s',
  );
  if (!e?.platform?.service) throw new Error('Missing baseline service');
  const policy = e.platform.service;
  const { s, calls } = await testSystem();
  let installed = false;
  let written = '';
  const placeholder = join(s.home, 'placeholder');
  await writeFile(placeholder, 'fixture');
  const info = await lstat(placeholder);
  Object.assign(info, { uid: 0, gid: 555, mode: 0o100640 });
  const notFound = () => {
    throw Object.assign(new Error('absent'), { code: 'ENOENT' });
  };
  s.files = {
    stat: async (path) =>
      installed && path === policy.kubeconfig.path ? info : notFound(),
    readText: async () => 'ID=ubuntu\n',
    access: async () => {},
  };
  s.which = async (command) =>
    installed && command === 'k3s' ? '/fake/k3s' : undefined;
  s.fetch = async () => new Response('# official installer fixture');
  s.run = async (command, args) => {
    calls.push({ command, args });
    if (
      command === 'sudo' &&
      args.includes(`INSTALL_K3S_VERSION=${e.platform?.version}`)
    )
      installed = true;
    if (command === 'sudo' && args.at(-1) === policy.config_path)
      written = await readFile(args.at(-2) as string, 'utf8');
    return {
      code: 0,
      stderr: '',
      stdout:
        command === 'id'
          ? args[0] === '-u'
            ? '0\n'
            : 'k3s-admin\n'
          : command === 'getent'
            ? 'k3s-admin:x:555:\n'
            : '',
    };
  };
  expect((await installEntry(e, s)).status).toBe('installed');
  expect(written).toContain('write-kubeconfig-group: k3s-admin');
  expect(written).toContain('traefik');
  expect(
    calls.some((c) =>
      c.args.includes(`INSTALL_K3S_VERSION=${e.platform?.version}`),
    ),
  ).toBe(true);
  expect(
    calls.some((c) => c.args.includes('apply') || c.args.includes('uninstall')),
  ).toBe(false);
  installed = false;
  s.files.stat = async () => info;
  const count = calls.length;
  await expect(installEntry(e, s)).rejects.toThrow('Existing cluster');
  expect(calls).toHaveLength(count);
});
test('official releases enforce architecture/checksum and preserve an installed different version', async () => {
  const { catalog } = await loadSnapshot(root);
  const entry = resolvePlan(catalog, 'linux-ubuntu-server').entries.find(
    (e) => e.id === 'k9s',
  );
  if (!entry?.platform?.release) throw new Error('Missing release');
  const e = structuredClone(entry);
  const { s, calls } = await testSystem();
  const body = new TextEncoder().encode('fixture tarball');
  if (!e.platform?.release) throw new Error('Missing cloned release');
  e.platform.release.artifacts.amd64 = {
    url: 'https://example.invalid/k9s.tgz',
    sha256: digest(body),
  };
  s.fetch = async () => new Response(body);
  s.run = async (command, args) => {
    calls.push({ command, args });
    if (command === 'tar')
      await writeFile(join(args[3], 'k9s'), 'binary fixture');
    return { code: 0, stdout: '', stderr: '' };
  };
  expect((await installEntry(e, s)).status).toBe('installed');
  expect(calls.at(-1)?.command).toBe('sudo');
  calls.length = 0;
  s.fetch = async () => new Response('wrong archive');
  await expect(installEntry(e, s)).rejects.toThrow('checksum');
  expect(calls).toHaveLength(0);
  s.which = async () => '/fake/k9s';
  s.run = async () => ({ code: 0, stdout: 'Version: v0.51.00', stderr: '' });
  expect((await installEntry(e, s)).status).toBe('manual');
});

test('init tooling reports installation choices, detected versions and reuse without reinstalling', async () => {
  const { ensureDotfilesTools } = await import(
    '../../src/infra/dotfiles/tooling'
  );
  const { s, calls } = await testSystem();
  const messages: string[] = [];
  const installed = new Set(['brew']);
  s.os = 'darwin';
  s.which = async (c) => (installed.has(c) ? `/fake/${c}` : undefined);
  s.run = async (command, args) => {
    calls.push({ command, args });
    if (command === 'brew') installed.add(args[1]);
    return {
      code: 0,
      stdout: args[0] === '--version' ? `${command} fixture-version\n` : '',
      stderr: '',
    };
  };
  const previous = process.env.PATH;
  try {
    const fresh = await ensureDotfilesTools(s, (message) =>
      messages.push(message),
    );
    expect(fresh.map((t) => t.status)).toEqual(['installed', 'installed']);
    expect(fresh[0]).toMatchObject({
      tool: 'chezmoi',
      version: 'chezmoi fixture-version',
      path: '/fake/chezmoi',
      installer: 'Homebrew',
    });
    expect(messages).toContain(
      'chezmoi: not found; installing with Homebrew...',
    );
    expect(messages.some((m) => m.includes('installed successfully'))).toBe(
      true,
    );
    messages.length = 0;
    const reused = await ensureDotfilesTools(s, (message) =>
      messages.push(message),
    );
    expect(reused.map((t) => t.status)).toEqual(['reused', 'reused']);
    expect(
      messages.some((m) => m.includes('reusing existing installation')),
    ).toBe(true);
    expect(calls.filter((c) => c.command === 'brew')).toEqual([
      { command: 'brew', args: ['install', 'chezmoi'] },
      { command: 'brew', args: ['install', 'mise'] },
    ]);
  } finally {
    process.env.PATH = previous;
  }
});
test('init tooling reports the selected installer before a failed installation', async () => {
  const { ensureDotfilesTools } = await import(
    '../../src/infra/dotfiles/tooling'
  );
  const { s } = await testSystem();
  s.os = 'windows';
  const messages: string[] = [];
  s.run = async () => ({
    code: 1,
    stdout: '',
    stderr: 'fixture installer failed',
  });
  const previous = process.env.PATH;
  try {
    await expect(
      ensureDotfilesTools(s, (m) => messages.push(m)),
    ).rejects.toThrow('fixture installer failed');
    expect(messages).toEqual([
      'Checking chezmoi...',
      'chezmoi: not found; installing with winget...',
    ]);
  } finally {
    process.env.PATH = previous;
  }
});
test('Windows ACL failure stops credential replacement before any new secret is written', async () => {
  const { s, calls } = await testSystem();
  const path = credentialPath(s);
  await privateWrite(path, 'previous-cache', s);
  s.os = 'windows';
  s.run = async (command, args) => {
    calls.push({ command, args });
    return { code: 1, stdout: '', stderr: 'ACL denied' };
  };
  await expect(privateWrite(path, 'new-secret', s)).rejects.toThrow(
    'ACL denied',
  );
  expect(await readFile(path, 'utf8')).toBe('previous-cache');
  expect(calls[0].args.join(' ')).toContain('SetAccessRuleProtection');
  expect(calls[0].args.join(' ')).not.toContain('new-secret');
});
test('pull requires the writable root checkout and rejects wrong packages and linked generated files', async () => {
  const { writableSource } = await import('../../src/infra/dotfiles/source');
  const { realpath } = await import('node:fs/promises');
  const p = await realpath(await sourceCopy());
  const { s } = await testSystem();
  s.run = async () => ({ code: 0, stdout: p, stderr: '' });
  await writeFile(join(p, 'package.json'), '{"name":"other"}');
  await expect(writableSource(p, s)).rejects.toThrow('Not a CthuTool');
  await writeFile(join(p, 'package.json'), '{"name":"cthutool"}');
  await writableSource(p, s);
  const generated = join(p, GENERATED_FILES[0]);
  await rm(generated);
  const external = join(await temporary(), 'packages.yaml');
  await writeFile(external, 'tools: {}');
  await symlink(external, generated);
  await expect(writableSource(p, s)).rejects.toThrow('Linked');
  s.run = async () => ({ code: 128, stdout: '', stderr: 'not a Git checkout' });
  await expect(writableSource(p, s)).rejects.toThrow('Git checkout');
});

test('Notion overload status 529 retries within the same bounded policy', async () => {
  const config = await readSources(root);
  let requests = 0;
  const delays: number[] = [];
  const client = new NotionClient(
    'fake-overload-token',
    config,
    async () =>
      ++requests < 4
        ? new Response('', { status: 529, headers: { 'Retry-After': '0' } })
        : Response.json({}),
    async (ms) => {
      delays.push(ms);
    },
  );
  await client.request('users/me');
  expect(requests).toBe(4);
  expect(delays).toEqual([0, 0, 0]);
});

test('reviewed snapshots reject missing page references and malformed continuity metadata before planning', async () => {
  const source = await sourceCopy();
  const old = await loadSnapshot(source);
  const fixture = notionFixture(old.catalog, old.manifest);
  fixture.manifest.generation = 1;
  const first = Object.keys(fixture.manifest.identities.software)[0];
  delete fixture.manifest.identities.software[first];
  await writeFile(join(source, MANIFEST), JSON.stringify(fixture.manifest));
  await expect(loadSnapshot(source)).rejects.toThrow('references');
  await writeFile(
    join(source, MANIFEST),
    JSON.stringify({ ...old.manifest, identities: 'invalid' }),
  );
  await expect(loadSnapshot(source)).rejects.toThrow('manifest/schema');
});

test('retired page tombstones survive a later draft transition with incomplete fields', async () => {
  const old = await loadSnapshot(root);
  const fixture = notionFixture(old.catalog, old.manifest);
  const page = fixture.ids.hosts.get('linux-wsl');
  if (!page) throw new Error('Fixture host missing');
  const catalog = structuredClone(old.catalog);
  delete catalog.hosts['linux-wsl'];
  fixture.manifest.identities.hosts[page].state = 'retired';
  const row = fixture.read.pages.hosts.find((p) => p.id === page);
  if (!row) throw new Error('Fixture row missing');
  row.properties = {
    State: { id: 'state', type: 'select', select: { name: 'draft' } },
  };
  const normalized = normalizeNotion(fixture.read, catalog, fixture.manifest);
  expect(normalized.identities.hosts[page]).toEqual({
    key: 'linux-wsl',
    state: 'retired',
  });
});

test('bound source remains authoritative when chezmoi is unavailable and distro aliases get a user command link', async () => {
  const source = await sourceCopy();
  const { s } = await testSystem();
  await mkdir(join(s.home, '.config/chezmoi'), { recursive: true });
  await writeFile(
    join(s.home, '.config/chezmoi/chezmoi.toml'),
    `sourceDir = ${JSON.stringify(source)}\n[data.local]\nhost = "linux-ubuntu-server"\n`,
  );
  expect((await resolveSource(s)).source).toBe(
    await (await import('node:fs/promises')).realpath(source),
  );
  const { catalog } = await loadSnapshot(root);
  const fd = resolvePlan(catalog, 'linux-ubuntu-server').entries.find(
    (e) => e.id === 'fd',
  );
  if (!fd) throw new Error('Missing fd fixture');
  s.which = async (command) =>
    command === 'fdfind' ? '/fixture/bin/fdfind' : undefined;
  expect((await installEntry(fd, s)).status).toBe('available');
  const { readlink } = await import('node:fs/promises');
  expect(await readlink(join(s.home, '.local/bin/fd'))).toBe(
    '/fixture/bin/fdfind',
  );
});
