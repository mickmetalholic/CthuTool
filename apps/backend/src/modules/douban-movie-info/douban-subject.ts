import { doubanMovieInfoError } from './douban-movie-info.errors';

export function normalizeDoubanSubjectInput(input: string): string {
  const value = input.trim();
  if (/^\d+$/.test(value)) {
    return value;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw doubanMovieInfoError(
      'INVALID_SUBJECT_ID',
      'Douban subject input must be a numeric id or movie subject URL',
    );
  }

  if (
    parsed.hostname !== 'movie.douban.com' &&
    parsed.hostname !== 'www.douban.com'
  ) {
    throw doubanMovieInfoError(
      'INVALID_SUBJECT_ID',
      'Douban subject URL must use movie.douban.com or www.douban.com',
    );
  }

  const match = parsed.pathname.match(/\/subject\/(\d+)\/?/);
  if (!match?.[1]) {
    throw doubanMovieInfoError(
      'INVALID_SUBJECT_ID',
      'Douban subject URL must include /subject/<id>/',
    );
  }
  return match[1];
}

export function toDoubanSubjectUrl(subjectId: string): string {
  return `https://movie.douban.com/subject/${subjectId}/`;
}
