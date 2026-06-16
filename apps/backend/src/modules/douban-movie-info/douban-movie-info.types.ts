export type DoubanMoviePerson = {
  readonly name: string;
  readonly url?: string;
};

export type DoubanMovieInfo = {
  readonly subjectId: string;
  readonly sourceUrl: string;
  readonly finalUrl: string;
  readonly capturedAt: string;
  readonly title: string;
  readonly originalTitle?: string;
  readonly year?: number;
  readonly rating?: number;
  readonly ratingCount?: number;
  readonly directors: readonly DoubanMoviePerson[];
  readonly writers: readonly DoubanMoviePerson[];
  readonly casts: readonly DoubanMoviePerson[];
  readonly genres: readonly string[];
  readonly countries: readonly string[];
  readonly languages: readonly string[];
  readonly releaseDates: readonly string[];
  readonly runtime?: string;
  readonly runtimeMinutes?: number;
  readonly aliases: readonly string[];
  readonly imdbId?: string;
  readonly summary?: string;
  readonly posterUrl?: string;
};

export type DoubanMovieInfoResponse = {
  readonly movie: DoubanMovieInfo;
};

export type DoubanMovieInfoErrorCode =
  | 'INVALID_SUBJECT_ID'
  | 'AUTH_REQUIRED'
  | 'CAPTCHA_REQUIRED'
  | 'RATE_LIMITED'
  | 'BLOCKED'
  | 'NOT_FOUND'
  | 'BROWSER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'PARSE_FAILED';

export type DoubanMovieInfoErrorBody = {
  readonly code: DoubanMovieInfoErrorCode;
  readonly message: string;
  readonly subjectId?: string;
};

export type DoubanMovieParseInput = {
  readonly capturedAt: string;
  readonly finalUrl: string;
  readonly html: string;
  readonly sourceUrl: string;
  readonly subjectId: string;
};
