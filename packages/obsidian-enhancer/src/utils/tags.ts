const normalizeComparableSegment = (segment: string): string =>
  segment
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const normalizeTag = (tag: string): string =>
  tag
    .replace(/^#/, '')
    .split('/')
    .map((segment) => normalizeComparableSegment(segment))
    .filter(Boolean)
    .join('/');

export const normalizeFolderSegment = (segment: string): string =>
  normalizeComparableSegment(segment.replace(/^\$/, '').replace(/@.+$/, ''));

export const toTagSegments = (tag: string): string[] =>
  normalizeTag(tag)
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean);
