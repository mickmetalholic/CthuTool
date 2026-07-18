import { describe, expect, test } from 'bun:test';
import { cp, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const skillRoot = join(
  repoRoot,
  'codex',
  'plugins',
  'cthu-codex',
  'skills',
  'notion-maintain-album',
);
const resolverPath = join(skillRoot, 'scripts', 'resolve-album.mjs');
const fixtureRoot = join(
  repoRoot,
  'apps',
  'cli',
  'tests',
  'fixtures',
  'album-metadata',
);

async function loadResolver(path = resolverPath) {
  return await import(
    `${pathToFileURL(path).href}?t=${Date.now()}-${Math.random()}`
  );
}

async function fixture(name: string) {
  return JSON.parse(await readFile(join(fixtureRoot, name), 'utf8'));
}

function response(value: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(value), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...init.headers },
  });
}

describe('Notion album metadata resolver', () => {
  test('classifies only supported canonical source and Notion URLs', async () => {
    const { classifyInputUrl } = await loadResolver();
    expect(
      classifyInputUrl(
        'https://musicbrainz.org/release-group/AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA?foo=1',
      ),
    ).toMatchObject({
      kind: 'musicbrainz-release-group',
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      canonicalUrl:
        'https://musicbrainz.org/release-group/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    });
    expect(
      classifyInputUrl(
        'https://musicbrainz.org/release/cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      ).kind,
    ).toBe('musicbrainz-release');
    expect(
      classifyInputUrl('https://www.discogs.com/master/302-Paranoid')
        .canonicalUrl,
    ).toBe('https://www.discogs.com/master/302');
    expect(
      classifyInputUrl(
        'https://app.notion.com/p/e50b0eeaf5f14a858c93c5442c0f9d66',
      ),
    ).toMatchObject({
      kind: 'notion-album',
      id: 'e50b0eea-f5f1-4a85-8c93-c5442c0f9d66',
    });
    expect(classifyInputUrl('https://www.discogs.com/release/302').kind).toBe(
      'unsupported',
    );
  });

  test('parses add, completion, and check-only operations', async () => {
    const { parseOperationInput } = await loadResolver();
    expect(
      parseOperationInput('添加 Paranoid by Black Sabbath').operation,
    ).toBe('add');
    expect(
      parseOperationInput('补全 The Black Parade 的元信息').operation,
    ).toBe('complete');
    expect(
      parseOperationInput('检查 MusicBrainz 和 Discogs 是否匹配').operation,
    ).toBe('check');
  });

  test('normalizes Unicode, punctuation, and Genre option spellings deterministically', async () => {
    const { normalizeText, normalizeGenres } = await loadResolver();
    expect(normalizeText('  Motörhead & Friends ’ Live  ')).toBe(
      'motorhead and friends live',
    );
    const master = await fixture('discogs-master.json');
    expect(normalizeGenres(master, ['rock', 'Heavy   Metal'])).toEqual({
      selected: ['rock', 'Heavy   Metal', 'Doom Metal'],
      missing: ['Doom Metal'],
    });
  });

  test('selects a clear Release Group and blocks near ties and conflicts', async () => {
    const { scoreReleaseGroupCandidate, selectRecommended } =
      await loadResolver();
    const search = await fixture('musicbrainz-search.json');
    const scored = search['release-groups'].map((candidate: unknown) =>
      scoreReleaseGroupCandidate(candidate, {
        title: 'Paranoid',
        artist: 'Black Sabbath',
        year: 1970,
      }),
    );
    expect(selectRecommended(scored)).toMatchObject({
      status: 'recommended',
      recommended: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
    });

    const ambiguous = await fixture('musicbrainz-ambiguous.json');
    const tied = ambiguous['release-groups'].map((candidate: unknown) =>
      scoreReleaseGroupCandidate(candidate, {
        title: 'Signals',
        artist: 'Example Artist',
      }),
    );
    expect(selectRecommended(tied)).toMatchObject({ status: 'ambiguous' });
  });

  test('preserves partial date precision without making it writable', async () => {
    const { dateEvidence } = await loadResolver();
    const group = await fixture('musicbrainz-partial-date.json');
    expect(dateEvidence(group['first-release-date'])).toEqual({
      value: '1984-07',
      precision: 'month',
      writable: false,
    });
    expect(dateEvidence('1970-09-18')).toEqual({
      value: '1970-09-18',
      precision: 'day',
      writable: true,
    });
  });

  test('converts a concrete Release to its Release Group and ignores edition date', async () => {
    const release = await fixture('musicbrainz-release.json');
    const group = await fixture('musicbrainz-release-group.json');
    const urls: string[] = [];
    const resolver = await loadResolver();
    const client = resolver.createAlbumMetadataResolver({
      musicBrainzIntervalMs: 0,
      fetchFn: async (url: URL) => {
        urls.push(String(url));
        return String(url).includes('/release/cccccccc-')
          ? response(release)
          : response(group);
      },
    });
    const converted = await client.releaseToReleaseGroup(release.id);
    expect(converted.releaseGroup.id).toBe(group.id);
    expect(converted.ignoredEditionDate).toBe('2016-01-22');
    expect(converted.releaseGroup['first-release-date']).toBe('1970-09-18');
    expect(urls).toHaveLength(2);
  });

  test('prefers a direct Discogs Master relationship and validates it', async () => {
    const group = await fixture('musicbrainz-release-group.json');
    const master = await fixture('discogs-master.json');
    const resolver = await loadResolver();
    const client = resolver.createAlbumMetadataResolver({
      fetchFn: async () => response(master),
    });
    const result = await client.resolveDiscogs(group, {
      title: 'Paranoid',
      artist: 'Black Sabbath',
      year: 1970,
    });
    expect(result).toMatchObject({
      status: 'direct',
      master: { id: 302 },
      conflicts: [],
    });
  });

  test('uses authenticated Master-only search fallback and fetches the winner', async () => {
    const search = {
      results: [
        {
          id: 302,
          type: 'master',
          title: 'Black Sabbath - Paranoid',
          artist: 'Black Sabbath',
          year: 1970,
        },
      ],
    };
    const master = await fixture('discogs-master.json');
    const requests: Array<{ url: string; authorization?: string }> = [];
    const resolver = await loadResolver();
    const client = resolver.createAlbumMetadataResolver({
      discogsToken: 'test-token',
      fetchFn: async (url: URL, init: RequestInit) => {
        const headers = init.headers as Record<string, string>;
        requests.push({
          url: String(url),
          authorization: headers.Authorization,
        });
        return String(url).includes('/database/search')
          ? response(search)
          : response(master);
      },
    });
    const result = await client.resolveDiscogs(
      { relations: [] },
      { title: 'Paranoid', artist: 'Black Sabbath', year: 1970 },
    );
    expect(result).toMatchObject({ status: 'searched', master: { id: 302 } });
    expect(requests[0]?.url).toContain('type=master');
    expect(
      requests.every(
        (request) => request.authorization === 'Discogs token=test-token',
      ),
    ).toBe(true);
  });

  test('uses a direct Discogs Master as search seed when title and artist are absent', async () => {
    const search = await fixture('musicbrainz-search.json');
    const group = await fixture('musicbrainz-release-group.json');
    const master = await fixture('discogs-master.json');
    const resolver = await loadResolver();
    const client = resolver.createAlbumMetadataResolver({
      musicBrainzIntervalMs: 0,
      fetchFn: async (url: URL) => {
        const value = String(url);
        if (value.includes('api.discogs.com/masters/302'))
          return response(master);
        if (value.includes('/release-group/aaaaaaaa-')) return response(group);
        return response(search);
      },
    });
    const result = await client.resolve({
      operation: 'add',
      urls: [
        {
          kind: 'discogs-master',
          id: 302,
          canonicalUrl: 'https://www.discogs.com/master/302',
        },
      ],
    });
    expect(result.input).toMatchObject({
      title: 'Paranoid',
      artist: 'Black Sabbath',
      year: 1970,
    });
    expect(result.musicBrainz.releaseGroup.id).toBe(group.id);
    expect(result.discogs).toMatchObject({
      status: 'direct',
      master: { id: 302 },
    });
  });

  test('honors bounded retry and Discogs rate-limit headers', async () => {
    const master = await fixture('discogs-master.json');
    const sleeps: number[] = [];
    let calls = 0;
    const resolver = await loadResolver();
    const client = resolver.createAlbumMetadataResolver({
      maxRetries: 1,
      sleepFn: async (ms: number) => {
        sleeps.push(ms);
      },
      fetchFn: async () => {
        calls += 1;
        if (calls === 1)
          return response(
            { message: 'slow down' },
            { status: 429, headers: { 'retry-after': '2' } },
          );
        return response(master, {
          headers: {
            'x-discogs-ratelimit-remaining': '0',
            'x-discogs-ratelimit-reset': '3',
          },
        });
      },
    });
    await client.lookupDiscogsMaster(302);
    expect(calls).toBe(2);
    expect(sleeps).toEqual([2000, 3000]);
  });

  test('resolves Album duplicates, Artist identities, previews, and stale plans', async () => {
    const {
      buildFieldPreview,
      findAlbumTarget,
      isPlanStale,
      resolveArtistRelations,
    } = await loadResolver();
    const groupUrl =
      'https://musicbrainz.org/release-group/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const existing = {
      id: 'album-1',
      properties: { Name: 'Paranoid', 'MusicBrainz Release Group': groupUrl },
      artistNames: ['Black Sabbath'],
    };
    expect(
      findAlbumTarget([existing], {
        title: 'Paranoid',
        artists: ['Black Sabbath'],
        musicBrainzReleaseGroup: groupUrl,
      }),
    ).toMatchObject({ status: 'target', page: { id: 'album-1' } });

    const artist = {
      id: 'person-1',
      properties: { Name: 'Black Sabbath', 'MusicBrainz Artist': '' },
    };
    const artistResolution = resolveArtistRelations(
      [{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'Black Sabbath' }],
      [artist],
    );
    expect(artistResolution).toMatchObject({
      blocked: false,
      resolved: [{ person: { id: 'person-1' }, via: 'exact-name' }],
    });
    expect(artistResolution.updates).toHaveLength(1);

    expect(
      buildFieldPreview(
        { Name: 'Paranoid', 'Release Date': '' },
        { Name: 'Paranoid!', 'Release Date': '1970-09-18' },
        { Name: groupUrl, 'Release Date': groupUrl },
      ),
    ).toEqual([
      expect.objectContaining({ field: 'Name', action: 'replace-blocked' }),
      expect.objectContaining({ field: 'Release Date', action: 'fill' }),
    ]);
    expect(isPlanStale({ options: ['Rock'] }, { options: ['Rock'] })).toBe(
      false,
    );
    expect(
      isPlanStale({ options: ['Rock'] }, { options: ['Rock', 'Metal'] }),
    ).toBe(true);
  });

  test('validates live schema contracts and strips personal fields from writes', async () => {
    const { buildAlbumMutationPayload, validateSchemaContract } =
      await loadResolver();
    const peopleId = '0beb941d-d073-4079-a207-c8126201d1eb';
    const album = {
      Name: 'title',
      Artist: { type: 'relation', data_source_id: peopleId },
      'Release Date': 'date',
      'Release Type': 'select',
      Genre: 'multi_select',
      'MusicBrainz Release Group': 'url',
      'Discogs Master': 'url',
      Status: 'status',
      'Listened Date': 'date',
      Score: 'number',
      Rating: 'formula',
    };
    expect(
      validateSchemaContract(album, { 'MusicBrainz Artist': 'url' }, peopleId),
    ).toEqual({ ok: true, errors: [] });
    expect(
      validateSchemaContract(
        { ...album, Genre: 'select' },
        { 'MusicBrainz Artist': 'rich_text' },
        peopleId,
      ),
    ).toMatchObject({ ok: false });
    expect(
      buildAlbumMutationPayload({
        Name: 'Paranoid',
        Status: 'Listened',
        'Listened Date': '2026-07-18',
        Score: 10,
        Rating: '★★★★★',
        'Release Type': 'Album',
      }),
    ).toEqual({ Name: 'Paranoid', 'Release Type': 'Album' });
  });

  test('runs from an installed plugin path with skill-local references intact', async () => {
    const installRoot = await mkdtemp(join(tmpdir(), 'cthu-album-plugin-'));
    await cp(join(repoRoot, 'codex', 'plugins', 'cthu-codex'), installRoot, {
      recursive: true,
    });
    const installedSkill = join(installRoot, 'skills', 'notion-maintain-album');
    const installedResolver = join(
      installedSkill,
      'scripts',
      'resolve-album.mjs',
    );
    const installed = await loadResolver(installedResolver);
    expect(installed.normalizeText('The Black Parade')).toBe(
      'the black parade',
    );
    expect(
      await readFile(
        join(installedSkill, 'references', 'schema-and-matching.md'),
        'utf8',
      ),
    ).toContain('MusicBrainz Release Group');
  });
});
