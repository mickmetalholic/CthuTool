#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

export const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org/ws/2';
export const DISCOGS_BASE_URL = 'https://api.discogs.com';
export const DEFAULT_USER_AGENT =
  'CthuCodexNotionAlbum/0.1 (+https://github.com/mickmetalholic/CthuTool)';
export const RELEASE_GROUP_TYPES = [
  'Album',
  'Single',
  'EP',
  'Broadcast',
  'Other',
];
export const PERSONAL_ALBUM_FIELDS = new Set([
  'Status',
  'Listened Date',
  'Score',
  'Rating',
]);

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const EDITION_WORDS = new Set([
  'anniversary',
  'deluxe',
  'edition',
  'expanded',
  'remaster',
  'remastered',
  'reissue',
]);

function canonicalUuid(value) {
  return String(value ?? '').toLowerCase();
}

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/&/g, ' and ')
    .replace(/[’'`]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en-US');
}

export function normalizeOption(value) {
  return normalizeText(value);
}

export function canonicalMusicBrainzUrl(kind, id) {
  return `https://musicbrainz.org/${kind}/${canonicalUuid(id)}`;
}

export function canonicalDiscogsMasterUrl(id) {
  return `https://www.discogs.com/master/${Number(id)}`;
}

export function classifyInputUrl(input) {
  let url;
  try {
    url = new URL(String(input ?? '').trim());
  } catch {
    return { kind: 'unsupported', input: String(input ?? '') };
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  const pathname = decodeURIComponent(url.pathname).replace(/\/+$/, '');

  if (hostname === 'musicbrainz.org') {
    const releaseGroup = new RegExp(`^/release-group/(${UUID})$`, 'i').exec(pathname);
    if (releaseGroup) {
      const id = canonicalUuid(releaseGroup[1]);
      return {
        kind: 'musicbrainz-release-group',
        id,
        canonicalUrl: canonicalMusicBrainzUrl('release-group', id),
      };
    }
    const release = new RegExp(`^/release/(${UUID})$`, 'i').exec(pathname);
    if (release) {
      const id = canonicalUuid(release[1]);
      return {
        kind: 'musicbrainz-release',
        id,
        canonicalUrl: canonicalMusicBrainzUrl('release', id),
      };
    }
  }

  if (hostname === 'discogs.com') {
    const master = /^\/(?:[^/]+\/)?master\/(\d+)(?:-[^/]*)?$/i.exec(pathname);
    if (master) {
      const id = Number(master[1]);
      return {
        kind: 'discogs-master',
        id,
        canonicalUrl: canonicalDiscogsMasterUrl(id),
      };
    }
  }

  if (hostname === 'app.notion.com' || hostname.endsWith('.notion.site') || hostname === 'notion.so') {
    const match = /([0-9a-f]{32})(?:$|\/)/i.exec(pathname.replaceAll('-', ''));
    if (match) {
      const raw = match[1].toLowerCase();
      const id = `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
      return { kind: 'notion-album', id, canonicalUrl: url.origin + url.pathname };
    }
  }

  return { kind: 'unsupported', input: String(input ?? '') };
}

export function parseOperationInput(input) {
  const raw = typeof input === 'string' ? input.trim() : String(input?.raw ?? '').trim();
  const requested = typeof input === 'object' ? input.operation : undefined;
  let operation = requested;
  if (!['add', 'complete', 'check'].includes(operation)) {
    if (/(检查|核对|是否.{0,4}(匹配|一致)|check|audit|reconcile|match)/iu.test(raw)) {
      operation = 'check';
    } else if (/(补全|完善|填充缺失|complete|fill missing)/iu.test(raw)) {
      operation = 'complete';
    } else {
      operation = 'add';
    }
  }
  const urls = [...raw.matchAll(/https?:\/\/[^\s<>]+/giu)].map((match) =>
    match[0].replace(/[),.;，。；]+$/, ''),
  );
  const classifiedUrls = urls.map(classifyInputUrl);
  return {
    operation,
    raw,
    title: typeof input === 'object' ? input.title?.trim() || undefined : undefined,
    artist: typeof input === 'object' ? input.artist?.trim() || undefined : undefined,
    year: typeof input === 'object' && Number.isInteger(input.year) ? input.year : undefined,
    urls: classifiedUrls,
  };
}

function schemaProperty(schema, name) {
  return schema?.properties?.[name] ?? schema?.[name];
}

function schemaType(property) {
  if (typeof property === 'string') return property.toLowerCase();
  return String(property?.type ?? property?.kind ?? '').toLowerCase();
}

export function validateSchemaContract(albumSchema, peopleSchema, expectedPeopleDataSourceId) {
  const errors = [];
  const albumTypes = {
    Name: 'title',
    Artist: 'relation',
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
  for (const [name, expected] of Object.entries(albumTypes)) {
    const property = schemaProperty(albumSchema, name);
    const actual = schemaType(property).replace('-', '_');
    if (!property) errors.push(`Album.${name} is missing`);
    else if (actual !== expected) errors.push(`Album.${name} expected ${expected}, found ${actual || 'unknown'}`);
  }
  const artist = schemaProperty(albumSchema, 'Artist');
  const relationTarget =
    artist?.data_source_id ??
    artist?.dataSourceId ??
    artist?.dataSourceUrl ??
    artist?.relation?.data_source_id ??
    artist?.relation?.dataSourceId;
  const normalizedRelationTarget = String(relationTarget ?? '').replace(
    /^collection:\/\//,
    '',
  );
  if (expectedPeopleDataSourceId && !normalizedRelationTarget) {
    errors.push('Album.Artist relation target is unavailable');
  } else if (
    expectedPeopleDataSourceId &&
    normalizedRelationTarget !== expectedPeopleDataSourceId
  ) {
    errors.push(
      `Album.Artist targets ${normalizedRelationTarget}, expected ${expectedPeopleDataSourceId}`,
    );
  }
  const musicBrainzArtist = schemaProperty(peopleSchema, 'MusicBrainz Artist');
  if (!musicBrainzArtist) errors.push('People Vault.MusicBrainz Artist is missing');
  else if (schemaType(musicBrainzArtist) !== 'url') {
    errors.push(`People Vault.MusicBrainz Artist expected url, found ${schemaType(musicBrainzArtist) || 'unknown'}`);
  }
  return { ok: errors.length === 0, errors };
}

export function buildAlbumMutationPayload(values) {
  return Object.fromEntries(
    Object.entries(values ?? {}).filter(
      ([name, value]) => !PERSONAL_ALBUM_FIELDS.has(name) && value !== undefined,
    ),
  );
}

export function dateEvidence(value) {
  const date = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return { value: date, precision: 'day', writable: true };
  if (/^\d{4}-\d{2}$/.test(date)) return { value: date, precision: 'month', writable: false };
  if (/^\d{4}$/.test(date)) return { value: date, precision: 'year', writable: false };
  return { value: undefined, precision: 'unknown', writable: false };
}

function tokens(value) {
  return new Set(normalizeText(value).split(' ').filter(Boolean));
}

function tokenSimilarity(left, right) {
  const a = tokens(left);
  const b = tokens(right);
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

function hasEditionQualifier(value) {
  return [...tokens(value)].some((token) => EDITION_WORDS.has(token));
}

function candidateArtists(candidate) {
  const credit = candidate['artist-credit'] ?? candidate.artistCredit ?? [];
  return credit.map((entry) => entry?.artist?.name ?? entry?.name).filter(Boolean);
}

function candidateYear(candidate) {
  const date = candidate['first-release-date'] ?? candidate.firstReleaseDate ?? candidate.year;
  const match = /^(\d{4})/.exec(String(date ?? ''));
  return match ? Number(match[1]) : undefined;
}

export function scoreReleaseGroupCandidate(candidate, query) {
  const evidence = [];
  const conflicts = [];
  let score = 0;
  const titleSimilarity = tokenSimilarity(query.title, candidate.title);
  if (normalizeText(query.title) === normalizeText(candidate.title)) {
    score += 40;
    evidence.push('exact normalized title');
  } else {
    score += Math.round(titleSimilarity * 24);
    evidence.push(`title token similarity ${titleSimilarity.toFixed(2)}`);
  }

  const artists = candidateArtists(candidate);
  const artistSimilarity = Math.max(0, ...artists.map((artist) => tokenSimilarity(query.artist, artist)));
  if (!query.artist) {
    conflicts.push('artist input is required for search selection');
  } else if (artists.some((artist) => normalizeText(artist) === normalizeText(query.artist))) {
    score += 30;
    evidence.push('exact normalized artist');
  } else {
    score += Math.round(artistSimilarity * 18);
    conflicts.push(`artist mismatch: ${artists.join(', ') || 'missing'}`);
  }

  const primaryType = candidate['primary-type'] ?? candidate.primaryType;
  if (primaryType && RELEASE_GROUP_TYPES.includes(primaryType)) {
    score += 10;
    evidence.push(`primary type ${primaryType}`);
  } else if (primaryType) {
    evidence.push(`new primary type ${primaryType}`);
  }

  const year = candidateYear(candidate);
  if (query.year && year === query.year) {
    score += 10;
    evidence.push(`year ${year}`);
  } else if (query.year && year && year !== query.year) {
    conflicts.push(`year mismatch: requested ${query.year}, candidate ${year}`);
  }

  const upstreamScore = Number(candidate.score ?? 0);
  score += Math.round(Math.max(0, Math.min(100, upstreamScore)) / 10);
  evidence.push(`MusicBrainz search score ${upstreamScore}`);

  if (hasEditionQualifier(candidate.title) !== hasEditionQualifier(query.title)) {
    conflicts.push('edition qualifier mismatch');
  }

  return {
    id: candidate.id,
    canonicalUrl: candidate.id ? canonicalMusicBrainzUrl('release-group', candidate.id) : undefined,
    title: candidate.title,
    artists,
    primaryType,
    firstReleaseDate: candidate['first-release-date'] ?? candidate.firstReleaseDate,
    score,
    eligible: conflicts.length === 0,
    evidence,
    conflicts,
    raw: candidate,
  };
}

export function scoreDiscogsCandidate(candidate, query) {
  const evidence = [];
  const conflicts = [];
  let score = 0;
  const title = candidate.title ?? '';
  const artist = candidate.artist ?? candidate.artists?.map((value) => value.name).join(', ') ?? '';
  const plainTitle = title.includes(' - ') ? title.slice(title.indexOf(' - ') + 3) : title;
  const titleSimilarity = tokenSimilarity(query.title, plainTitle);
  if (normalizeText(query.title) === normalizeText(plainTitle)) {
    score += 40;
    evidence.push('exact normalized title');
  } else {
    score += Math.round(titleSimilarity * 24);
  }
  if (normalizeText(query.artist) === normalizeText(artist)) {
    score += 30;
    evidence.push('exact normalized artist');
  } else {
    score += Math.round(tokenSimilarity(query.artist, artist) * 18);
    conflicts.push(`artist mismatch: ${artist || 'missing'}`);
  }
  const type = String(candidate.type ?? 'master').toLowerCase();
  if (type === 'master') score += 10;
  else conflicts.push(`Discogs object is ${type}, not master`);
  const year = Number(candidate.year) || undefined;
  if (query.year && year === query.year) {
    score += 10;
    evidence.push(`year ${year}`);
  } else if (query.year && year && query.year !== year) {
    conflicts.push(`year mismatch: MusicBrainz ${query.year}, Discogs ${year}`);
  }
  return {
    id: Number(candidate.id),
    canonicalUrl: candidate.id ? canonicalDiscogsMasterUrl(candidate.id) : undefined,
    title: plainTitle,
    artist,
    year,
    score,
    eligible: conflicts.length === 0,
    evidence,
    conflicts,
    raw: candidate,
  };
}

export function selectRecommended(candidates, { threshold = 80, margin = 8 } = {}) {
  const ranked = [...candidates].sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));
  const eligible = ranked.filter((candidate) => candidate.eligible);
  const first = eligible[0];
  const second = eligible[1];
  const scoreMargin = first ? first.score - (second?.score ?? 0) : 0;
  if (!first || first.score < threshold || (second && scoreMargin < margin)) {
    return {
      status: 'ambiguous',
      recommended: undefined,
      scoreMargin,
      candidates: ranked,
      conflicts: !first
        ? ['no conflict-free candidate']
        : first.score < threshold
          ? [`top score ${first.score} is below ${threshold}`]
          : [`top score margin ${scoreMargin} is below ${margin}`],
    };
  }
  return { status: 'recommended', recommended: first, scoreMargin, candidates: ranked, conflicts: [] };
}

export function extractDiscogsMasterUrls(releaseGroup) {
  const relations = releaseGroup.relations ?? releaseGroup['url-relations'] ?? [];
  const masters = new Map();
  for (const relation of relations) {
    const resource = relation?.url?.resource ?? relation?.resource;
    const classified = classifyInputUrl(resource);
    if (classified.kind === 'discogs-master') masters.set(classified.id, classified.canonicalUrl);
  }
  return [...masters.entries()].map(([id, canonicalUrl]) => ({ id, canonicalUrl }));
}

export function normalizeGenres(master, existingOptions = []) {
  const existing = new Map(existingOptions.map((option) => [normalizeOption(option), option]));
  const values = [...(master.genres ?? []), ...(master.styles ?? [])]
    .map((value) => String(value).trim().replace(/\s+/g, ' '))
    .filter(Boolean);
  const seen = new Set();
  const selected = [];
  const missing = [];
  for (const value of values) {
    const key = normalizeOption(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const current = existing.get(key);
    selected.push(current ?? value);
    if (!current) missing.push(value);
  }
  return { selected, missing };
}

function retryDelayMs(response, attempt) {
  const retryAfter = Number(response.headers.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter >= 0) return Math.min(retryAfter * 1000, 10_000);
  return Math.min(500 * 2 ** attempt, 4_000);
}

function discogsResetDelayMs(response) {
  const remainingHeader = response.headers.get('x-discogs-ratelimit-remaining');
  if (remainingHeader === null || Number(remainingHeader) > 0) return 0;
  const reset = Number(response.headers.get('x-discogs-ratelimit-reset'));
  return Number.isFinite(reset) && reset > 0 ? Math.min(reset * 1000, 10_000) : 1000;
}

export function createAlbumMetadataResolver({
  fetchFn = globalThis.fetch,
  sleepFn = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  userAgent = DEFAULT_USER_AGENT,
  musicBrainzIntervalMs = 1100,
  discogsToken = process.env.DISCOGS_TOKEN,
  maxRetries = 2,
} = {}) {
  if (typeof fetchFn !== 'function') throw new TypeError('fetchFn is required');
  let lastMusicBrainzRequestAt = 0;
  let musicBrainzQueue = Promise.resolve();

  async function fetchJson(url, { service, auth = false } = {}) {
    const headers = { Accept: 'application/json', 'User-Agent': userAgent };
    if (auth && discogsToken) headers.Authorization = `Discogs token=${discogsToken}`;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const response = await fetchFn(url, { headers });
      if (response.ok) {
        if (service === 'discogs') {
          const delay = discogsResetDelayMs(response);
          if (delay > 0) await sleepFn(delay);
        }
        return await response.json();
      }
      if (![429, 503].includes(response.status) || attempt === maxRetries) {
        const body = await response.text().catch(() => '');
        throw new Error(`${service ?? 'metadata'} request failed (${response.status}): ${body.slice(0, 160)}`);
      }
      await sleepFn(retryDelayMs(response, attempt));
    }
  }

  function musicBrainzRequest(path, params = {}) {
    const run = async () => {
      const wait = Math.max(0, musicBrainzIntervalMs - (Date.now() - lastMusicBrainzRequestAt));
      if (wait > 0) await sleepFn(wait);
      lastMusicBrainzRequestAt = Date.now();
      const url = new URL(`${MUSICBRAINZ_BASE_URL}/${path}`);
      url.searchParams.set('fmt', 'json');
      for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
      return await fetchJson(url, { service: 'musicbrainz' });
    };
    const result = musicBrainzQueue.then(run, run);
    musicBrainzQueue = result.catch(() => undefined);
    return result;
  }

  async function searchReleaseGroups({ title, artist, year, limit = 5 }) {
    if (!title || !artist) throw new Error('MusicBrainz search requires title and artist');
    const escape = (value) => `"${String(value).replaceAll('"', '\\"')}"`;
    const query = [`releasegroup:${escape(title)}`, `artist:${escape(artist)}`];
    if (year) query.push(`firstreleasedate:${year}`);
    const body = await musicBrainzRequest('release-group', { query: query.join(' AND '), limit });
    return body['release-groups'] ?? [];
  }

  async function lookupReleaseGroup(id) {
    return await musicBrainzRequest(`release-group/${canonicalUuid(id)}`, {
      inc: 'artist-credits+url-rels',
    });
  }

  async function lookupRelease(id) {
    return await musicBrainzRequest(`release/${canonicalUuid(id)}`, {
      inc: 'release-groups+artist-credits',
    });
  }

  async function releaseToReleaseGroup(id) {
    const release = await lookupRelease(id);
    const group = release['release-group'];
    if (!group?.id) throw new Error(`MusicBrainz Release ${id} has no Release Group`);
    return {
      release: {
        id: release.id,
        title: release.title,
        date: release.date,
        canonicalUrl: canonicalMusicBrainzUrl('release', release.id),
      },
      releaseGroup: await lookupReleaseGroup(group.id),
      ignoredEditionDate: release.date,
    };
  }

  async function lookupDiscogsMaster(id) {
    return await fetchJson(`${DISCOGS_BASE_URL}/masters/${Number(id)}`, {
      service: 'discogs',
      auth: Boolean(discogsToken),
    });
  }

  async function searchDiscogsMasters({ title, artist, year, limit = 5 }) {
    if (!discogsToken) {
      return { status: 'blocked', conflicts: ['Discogs search fallback requires DISCOGS_TOKEN'], results: [] };
    }
    const url = new URL(`${DISCOGS_BASE_URL}/database/search`);
    url.searchParams.set('type', 'master');
    url.searchParams.set('release_title', title);
    url.searchParams.set('artist', artist);
    if (year) url.searchParams.set('year', String(year));
    url.searchParams.set('per_page', String(limit));
    const body = await fetchJson(url, { service: 'discogs', auth: true });
    return { status: 'ok', results: (body.results ?? []).filter((item) => item.type === 'master') };
  }

  async function resolveMusicBrainz(input) {
    const urls = input.urls ?? [];
    const directGroup = urls.find((url) => url.kind === 'musicbrainz-release-group');
    if (directGroup) {
      const releaseGroup = await lookupReleaseGroup(directGroup.id);
      return { status: 'direct', releaseGroup, conversion: undefined, candidates: [] };
    }
    const directRelease = urls.find((url) => url.kind === 'musicbrainz-release');
    if (directRelease) {
      const conversion = await releaseToReleaseGroup(directRelease.id);
      return { status: 'converted-release', releaseGroup: conversion.releaseGroup, conversion, candidates: [] };
    }
    const rawCandidates = await searchReleaseGroups(input);
    const candidates = rawCandidates.map((candidate) => scoreReleaseGroupCandidate(candidate, input));
    const selection = selectRecommended(candidates);
    if (!selection.recommended) return { ...selection, releaseGroup: undefined };
    return {
      ...selection,
      releaseGroup: await lookupReleaseGroup(selection.recommended.id),
    };
  }

  async function resolve(input) {
    const directDiscogs = (input.urls ?? []).find((url) => url.kind === 'discogs-master');
    let discogsSeed;
    let enriched = { ...input };
    if (directDiscogs && (!input.title || !input.artist)) {
      discogsSeed = await lookupDiscogsMaster(directDiscogs.id);
      enriched = {
        ...input,
        title: input.title || discogsSeed.title,
        artist:
          input.artist ||
          discogsSeed.artists?.map((artist) => artist.name).filter(Boolean).join(', '),
        year: input.year || (Number(discogsSeed.year) || undefined),
      };
    }
    const musicBrainz = await resolveMusicBrainz(enriched);
    let discogs;
    if (musicBrainz.releaseGroup) {
      const artists = candidateArtists(musicBrainz.releaseGroup);
      const year = candidateYear(musicBrainz.releaseGroup);
      if (discogsSeed) {
        const candidate = scoreDiscogsCandidate(
          { ...discogsSeed, type: 'master' },
          { title: musicBrainz.releaseGroup.title, artist: artists.join(', '), year },
        );
        discogs = {
          status: candidate.eligible ? 'direct' : 'conflict',
          master: discogsSeed,
          candidate,
          relationships: extractDiscogsMasterUrls(musicBrainz.releaseGroup),
          conflicts: candidate.conflicts,
        };
      } else {
        discogs = await resolveDiscogs(
          musicBrainz.releaseGroup,
          { title: musicBrainz.releaseGroup.title, artist: artists.join(', '), year },
          directDiscogs,
        );
      }
    }
    return { input: enriched, musicBrainz, discogs };
  }

  async function resolveDiscogs(releaseGroup, query, directUrl) {
    const relationships = extractDiscogsMasterUrls(releaseGroup);
    const requested = directUrl?.kind === 'discogs-master' ? [directUrl] : relationships;
    if (requested.length === 1) {
      const master = await lookupDiscogsMaster(requested[0].id);
      const scored = scoreDiscogsCandidate({ ...master, type: 'master' }, query);
      return {
        status: scored.eligible ? 'direct' : 'conflict',
        master,
        candidate: scored,
        relationships,
        conflicts: scored.conflicts,
      };
    }
    if (requested.length > 1) {
      return { status: 'ambiguous', relationships: requested, conflicts: ['multiple Discogs Master relationships'] };
    }
    const search = await searchDiscogsMasters(query);
    if (search.status !== 'ok') return { ...search, relationships };
    const candidates = search.results.map((candidate) => scoreDiscogsCandidate(candidate, query));
    const selection = selectRecommended(candidates, { threshold: 78, margin: 8 });
    if (!selection.recommended) return { ...selection, relationships };
    const master = await lookupDiscogsMaster(selection.recommended.id);
    return { ...selection, status: 'searched', master, relationships };
  }

  return {
    searchReleaseGroups,
    lookupReleaseGroup,
    lookupRelease,
    releaseToReleaseGroup,
    lookupDiscogsMaster,
    searchDiscogsMasters,
    resolveMusicBrainz,
    resolveDiscogs,
    resolve,
  };
}

function propertyValue(row, name) {
  return row?.properties?.[name] ?? row?.[name];
}

export function findAlbumTarget(rows, identity) {
  const canonicalGroup = identity.musicBrainzReleaseGroup;
  const canonicalMaster = identity.discogsMaster;
  const byGroup = rows.filter((row) => propertyValue(row, 'MusicBrainz Release Group') === canonicalGroup);
  if (byGroup.length === 1) return { status: 'target', reason: 'musicbrainz-release-group', page: byGroup[0] };
  if (byGroup.length > 1) return { status: 'blocked', reason: 'duplicate-release-group', candidates: byGroup };
  const byMaster = rows.filter((row) => canonicalMaster && propertyValue(row, 'Discogs Master') === canonicalMaster);
  if (byMaster.length === 1) return { status: 'target', reason: 'discogs-master', page: byMaster[0] };
  if (byMaster.length > 1) return { status: 'blocked', reason: 'duplicate-discogs-master', candidates: byMaster };
  const byTitleArtist = rows.filter((row) =>
    normalizeText(propertyValue(row, 'Name')) === normalizeText(identity.title) &&
    (row.artistNames ?? []).some((artist) => identity.artists.some((expected) => normalizeText(expected) === normalizeText(artist))),
  );
  return byTitleArtist.length > 0
    ? { status: 'clarification', reason: 'title-artist-candidate', candidates: byTitleArtist }
    : { status: 'new' };
}

export function resolveArtistRelations(credits, people) {
  const resolved = [];
  const updates = [];
  const conflicts = [];
  for (const credit of credits) {
    const url = canonicalMusicBrainzUrl('artist', credit.id);
    const urlMatches = people.filter((person) => propertyValue(person, 'MusicBrainz Artist') === url);
    if (urlMatches.length === 1) {
      resolved.push({ credit, person: urlMatches[0], via: 'musicbrainz-artist' });
      continue;
    }
    if (urlMatches.length > 1) {
      conflicts.push({ credit, reason: 'duplicate MusicBrainz Artist URL', candidates: urlMatches });
      continue;
    }
    const nameMatches = people.filter((person) => normalizeText(propertyValue(person, 'Name')) === normalizeText(credit.name));
    if (nameMatches.length !== 1) {
      conflicts.push({ credit, reason: nameMatches.length === 0 ? 'artist missing' : 'ambiguous exact artist name', candidates: nameMatches });
      continue;
    }
    const existingUrl = propertyValue(nameMatches[0], 'MusicBrainz Artist');
    if (existingUrl && existingUrl !== url) {
      conflicts.push({ credit, reason: 'conflicting MusicBrainz Artist URL', candidates: nameMatches });
      continue;
    }
    resolved.push({ credit, person: nameMatches[0], via: 'exact-name' });
    updates.push({ page: nameMatches[0], value: url });
  }
  return { resolved, updates, conflicts, blocked: conflicts.length > 0 };
}

export function buildFieldPreview(current, proposed, authorities, replaceApprovals = []) {
  const approved = new Set(replaceApprovals);
  return Object.keys(proposed).map((field) => {
    const oldValue = current?.[field];
    const newValue = proposed[field];
    let action = oldValue === undefined || oldValue === null || oldValue === '' ? 'fill' : 'keep';
    if (oldValue === undefined && current == null) action = 'create';
    if (oldValue !== undefined && oldValue !== null && oldValue !== '' && JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      action = approved.has(field) ? 'replace' : 'replace-blocked';
    }
    return { field, current: oldValue, proposed: newValue, action, authorityUrl: authorities?.[field] };
  });
}

export function stablePlanFingerprint(value) {
  const normalize = (item) => {
    if (Array.isArray(item)) return item.map(normalize);
    if (item && typeof item === 'object') {
      return Object.fromEntries(Object.keys(item).sort().map((key) => [key, normalize(item[key])]));
    }
    return item;
  };
  return JSON.stringify(normalize(value));
}

export function isPlanStale(plannedState, currentState) {
  return stablePlanFingerprint(plannedState) !== stablePlanFingerprint(currentState);
}

async function runCli() {
  const argument = process.argv.slice(2).join(' ').trim();
  let payload;
  if (argument) {
    payload = JSON.parse(argument);
  } else {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  const input = parseOperationInput(payload);
  const resolver = createAlbumMetadataResolver();
  const result = await resolver.resolve(input);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runCli().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
