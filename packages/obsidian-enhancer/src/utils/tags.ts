export const normalizeTag = (tag: string): string =>
  tag.replace(/^#/, '').trim().toLowerCase();

export const normalizeFolderSegment = (segment: string): string =>
  segment.replace(/^\$/, '').replace(/@.+$/, '').trim().toLowerCase();

export const toTagSegments = (tag: string): string[] =>
  normalizeTag(tag)
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean);
