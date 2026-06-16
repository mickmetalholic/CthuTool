import { doubanMovieInfoError } from './douban-movie-info.errors';
import type {
  DoubanMovieInfo,
  DoubanMovieParseInput,
  DoubanMoviePerson,
} from './douban-movie-info.types';

type JsonLdEntity = {
  readonly '@type'?: string;
  readonly name?: string;
  readonly url?: string;
};

type JsonLdMovie = {
  readonly '@type'?: string;
  readonly actor?: JsonLdEntity | readonly JsonLdEntity[];
  readonly aggregateRating?: {
    readonly ratingCount?: number | string;
    readonly ratingValue?: number | string;
  };
  readonly author?: JsonLdEntity | readonly JsonLdEntity[];
  readonly datePublished?: string;
  readonly description?: string;
  readonly director?: JsonLdEntity | readonly JsonLdEntity[];
  readonly duration?: string;
  readonly genre?: string | readonly string[];
  readonly image?: string;
  readonly name?: string;
  readonly url?: string;
};

const infoLabels = [
  '导演',
  '编剧',
  '主演',
  '类型',
  '制片国家/地区',
  '语言',
  '上映日期',
  '片长',
  '又名',
  'IMDb',
];

export function parseDoubanMovieInfo(
  input: DoubanMovieParseInput,
): DoubanMovieInfo {
  const jsonLd = extractJsonLdMovie(input.html);
  const info = parseInfoPanel(input.html);
  const h1Title = cleanText(extractFirstTagText(input.html, 'h1'));
  const titleText =
    normalizeTitle(jsonLd?.name) ??
    normalizeTitle(metaContent(input.html, 'og:title')) ??
    normalizeTitle(h1Title);
  const year =
    parseYear(extractByClass(input.html, 'year')) ?? parseYear(h1Title);

  const movie: DoubanMovieInfo = {
    aliases: splitList(info['又名']),
    capturedAt: input.capturedAt,
    casts: mergePeople(
      peopleFromJsonLd(jsonLd?.actor),
      peopleFromMeta(input.html, 'video:actor'),
      peopleFromInfo(info['主演']),
    ),
    countries: splitList(info['制片国家/地区']),
    directors: mergePeople(
      peopleFromJsonLd(jsonLd?.director),
      peopleFromMeta(input.html, 'video:director'),
      peopleFromInfo(info['导演']),
    ),
    finalUrl: input.finalUrl,
    genres: unique([
      ...toArray(jsonLd?.genre).map(String),
      ...extractAllPropertyText(input.html, 'v:genre'),
      ...splitList(info['类型']),
    ]),
    imdbId: normalizeImdbId(info.IMDb),
    languages: splitList(info['语言']),
    posterUrl:
      firstNonEmpty(jsonLd?.image, metaContent(input.html, 'og:image')) ??
      extractMainPoster(input.html),
    rating:
      numberOrUndefined(jsonLd?.aggregateRating?.ratingValue) ??
      numberOrUndefined(extractPropertyText(input.html, 'v:average')),
    ratingCount:
      integerOrUndefined(jsonLd?.aggregateRating?.ratingCount) ??
      integerOrUndefined(extractPropertyText(input.html, 'v:votes')),
    releaseDates: unique([
      ...stringToOptionalArray(jsonLd?.datePublished),
      ...extractAllPropertyText(input.html, 'v:initialReleaseDate'),
      ...splitList(info['上映日期']),
    ]),
    runtime:
      normalizeRuntime(jsonLd?.duration) ??
      normalizeRuntime(metaContent(input.html, 'video:duration')) ??
      normalizeRuntime(extractPropertyText(input.html, 'v:runtime')) ??
      normalizeRuntime(info['片长']),
    runtimeMinutes: runtimeMinutes(
      jsonLd?.duration ??
        metaContent(input.html, 'video:duration') ??
        extractPropertyText(input.html, 'v:runtime') ??
        info['片长'],
    ),
    sourceUrl: input.sourceUrl,
    subjectId: input.subjectId,
    summary:
      cleanText(jsonLd?.description) ??
      cleanText(metaContent(input.html, 'og:description')) ??
      cleanText(extractPropertyText(input.html, 'v:summary')),
    title: titleText ?? '',
    originalTitle: extractOriginalTitle(h1Title ?? titleText, year),
    writers: mergePeople(
      peopleFromJsonLd(jsonLd?.author),
      peopleFromInfo(info['编剧']),
    ),
    year,
  };

  if (!movie.title || !looksLikeMoviePage(input.html, jsonLd)) {
    throw doubanMovieInfoError(
      'PARSE_FAILED',
      'Captured page is not a supported Douban movie detail page',
      input.subjectId,
    );
  }

  return removeUndefined(movie);
}

function extractJsonLdMovie(html: string): JsonLdMovie | undefined {
  for (const script of matchAll(
    html,
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const parsed = JSON.parse(decodeHtml(script[1] ?? '').trim()) as unknown;
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      const movie = candidates.find((candidate): candidate is JsonLdMovie =>
        Boolean(
          candidate &&
            typeof candidate === 'object' &&
            '@type' in candidate &&
            String(candidate['@type']).toLowerCase().includes('movie'),
        ),
      );
      if (movie) return movie;
    } catch {}
  }
  return undefined;
}

function parseInfoPanel(html: string): Record<string, string> {
  const infoMatch = html.match(
    /<[^>]+\bid=["']info["'][^>]*>([\s\S]*?)<\/div>/i,
  );
  if (!infoMatch?.[1]) return {};
  const text = decodeHtml(
    infoMatch[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>|<\/span>|<\/a>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');

  const result: Record<string, string> = {};
  for (const label of infoLabels) {
    const value = extractInfoValue(text, label);
    if (value) result[label] = value;
  }
  return result;
}

function extractInfoValue(text: string, label: string): string | undefined {
  const current = `${escapeRegExp(label)}\\s*:`;
  const next = infoLabels
    .filter((candidate) => candidate !== label)
    .map((candidate) => `${escapeRegExp(candidate)}\\s*:`)
    .join('|');
  const match = text.match(
    new RegExp(`${current}\\s*([\\s\\S]*?)(?=\\n?(?:${next})|$)`),
  );
  return cleanText(match?.[1]);
}

function metaContent(html: string, property: string): string | undefined {
  const pattern = new RegExp(
    `<meta\\b(?=[^>]*(?:property|name)=["']${escapeRegExp(property)}["'])(?=[^>]*content=["']([^"']*)["'])[^>]*>`,
    'i',
  );
  return decodeHtml(html.match(pattern)?.[1] ?? '');
}

function extractPropertyText(
  html: string,
  property: string,
): string | undefined {
  return extractAllPropertyText(html, property)[0];
}

function extractAllPropertyText(html: string, property: string): string[] {
  const pattern = new RegExp(
    `<[^>]+property=["']${escapeRegExp(property)}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`,
    'gi',
  );
  return unique(
    matchAll(html, pattern)
      .map((match) => stripHtml(match[1] ?? ''))
      .filter((value): value is string => Boolean(value)),
  );
}

function extractFirstTagText(html: string, tag: string): string | undefined {
  const match = html.match(
    new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'),
  );
  return stripHtml(match?.[1] ?? '');
}

function extractByClass(html: string, className: string): string | undefined {
  const match = html.match(
    new RegExp(
      `<[^>]+class=["'][^"']*\\b${escapeRegExp(className)}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`,
      'i',
    ),
  );
  return stripHtml(match?.[1] ?? '');
}

function extractMainPoster(html: string): string | undefined {
  const block = html.match(
    /<[^>]+\bid=["']mainpic["'][^>]*>([\s\S]*?)<\/[^>]+>/i,
  )?.[1];
  if (!block) return undefined;
  return block.match(/<img\b[^>]+src=["']([^"']+)["']/i)?.[1];
}

function normalizeTitle(value: string | undefined): string | undefined {
  return cleanText(value)
    ?.replace(/\s*\(\d{4}\)\s*$/, '')
    .trim();
}

function extractOriginalTitle(
  title: string | undefined,
  year: number | undefined,
): string | undefined {
  const value = normalizeTitle(title);
  if (!value) return undefined;
  const withoutYear = year
    ? value.replace(new RegExp(`\\(?${year}\\)?`), '').trim()
    : value;
  const match = withoutYear.match(
    /[\u4e00-\u9fff]\s+([A-Za-z0-9][A-Za-z0-9 :'&.,!?-]+)$/,
  );
  return cleanText(match?.[1]);
}

function looksLikeMoviePage(
  html: string,
  jsonLd: JsonLdMovie | undefined,
): boolean {
  return Boolean(
    jsonLd ||
      /property=["']v:average["']/i.test(html) ||
      /\bid=["']info["']/i.test(html),
  );
}

function peopleFromJsonLd(
  value: JsonLdEntity | readonly JsonLdEntity[] | undefined,
): DoubanMoviePerson[] {
  return toArray(value)
    .map((item) =>
      item && typeof item === 'object'
        ? removeUndefined({
            name: cleanText(item.name) ?? '',
            url: cleanText(item.url),
          })
        : { name: '' },
    )
    .filter((person) => person.name);
}

function peopleFromMeta(html: string, property: string): DoubanMoviePerson[] {
  return matchAll(
    html,
    new RegExp(
      `<meta\\b(?=[^>]*property=["']${escapeRegExp(property)}["'])(?=[^>]*content=["']([^"']+)["'])[^>]*>`,
      'gi',
    ),
  )
    .map((match) => ({ name: cleanText(match[1]) ?? '' }))
    .filter((person) => person.name);
}

function peopleFromInfo(value: string | undefined): DoubanMoviePerson[] {
  return splitList(value).map((name) => ({ name }));
}

function mergePeople(
  ...groups: readonly DoubanMoviePerson[][]
): DoubanMoviePerson[] {
  const seen = new Set<string>();
  return groups.flat().filter((person) => {
    if (!person.name || seen.has(person.name)) return false;
    seen.add(person.name);
    return true;
  });
}

function splitList(value: string | undefined): string[] {
  if (!value) return [];
  return unique(
    value
      .split(/\s*\/\s*|\n|、/)
      .map((item) => cleanText(item))
      .filter((item): item is string => Boolean(item)),
  );
}

function normalizeRuntime(value: string | undefined): string | undefined {
  const clean = cleanText(value);
  if (!clean) return undefined;
  const minutes = runtimeMinutes(clean);
  return minutes ? `${minutes}分钟` : clean;
}

function runtimeMinutes(value: string | undefined): number | undefined {
  const clean = cleanText(value);
  if (!clean) return undefined;
  const iso = clean.match(/^P(?:T)?(?:(\d+)H)?(?:(\d+)M)?$/i);
  if (iso) {
    return Number(iso[1] ?? 0) * 60 + Number(iso[2] ?? 0);
  }
  const numeric = clean.match(/\d+/)?.[0];
  return numeric ? Number(numeric) : undefined;
}

function parseYear(value: string | undefined): number | undefined {
  const match = value?.match(/\b(19|20)\d{2}\b/);
  return match?.[0] ? Number(match[0]) : undefined;
}

function normalizeImdbId(value: string | undefined): string | undefined {
  return cleanText(value)?.match(/tt\d+/i)?.[0];
}

function numberOrUndefined(value: unknown): number | undefined {
  const number =
    typeof value === 'number' ? value : Number(cleanText(String(value ?? '')));
  return Number.isFinite(number) ? number : undefined;
}

function integerOrUndefined(value: unknown): number | undefined {
  const text = cleanText(String(value ?? ''))?.replace(/[^\d]/g, '');
  return text ? Number(text) : undefined;
}

function toArray<T>(value: T | readonly T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? [...(value as readonly T[])] : [value as T];
}

function stringToOptionalArray(value: string | undefined): string[] {
  const clean = cleanText(value);
  return clean ? [clean] : [];
}

function firstNonEmpty(
  ...values: readonly (string | undefined)[]
): string | undefined {
  return values.map(cleanText).find(Boolean);
}

function cleanText(value: string | undefined): string | undefined {
  const clean = decodeHtml(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean || undefined;
}

function stripHtml(value: string): string | undefined {
  return cleanText(value.replace(/<[^>]*>/g, ''));
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const clean = cleanText(value);
    if (!clean || seen.has(clean)) return false;
    seen.add(clean);
    return true;
  });
}

function matchAll(value: string, pattern: RegExp): RegExpMatchArray[] {
  return [...value.matchAll(pattern)];
}

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
