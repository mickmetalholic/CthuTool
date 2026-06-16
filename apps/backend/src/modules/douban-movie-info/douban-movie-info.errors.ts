import { HttpException, HttpStatus } from '@nestjs/common';
import type {
  DoubanMovieInfoErrorBody,
  DoubanMovieInfoErrorCode,
} from './douban-movie-info.types';

const statusByCode: Record<DoubanMovieInfoErrorCode, HttpStatus> = {
  AUTH_REQUIRED: HttpStatus.UNAUTHORIZED,
  BLOCKED: HttpStatus.FORBIDDEN,
  BROWSER_UNAVAILABLE: HttpStatus.SERVICE_UNAVAILABLE,
  CAPTCHA_REQUIRED: HttpStatus.FORBIDDEN,
  INVALID_SUBJECT_ID: HttpStatus.BAD_REQUEST,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  PARSE_FAILED: HttpStatus.UNPROCESSABLE_ENTITY,
  RATE_LIMITED: HttpStatus.TOO_MANY_REQUESTS,
  TIMEOUT: HttpStatus.GATEWAY_TIMEOUT,
};

export class DoubanMovieInfoException extends HttpException {
  constructor(
    readonly code: DoubanMovieInfoErrorCode,
    message: string,
    readonly subjectId?: string,
  ) {
    super(
      {
        code,
        message,
        ...(subjectId ? { subjectId } : {}),
      } satisfies DoubanMovieInfoErrorBody,
      statusByCode[code],
    );
  }
}

export function doubanMovieInfoError(
  code: DoubanMovieInfoErrorCode,
  message: string,
  subjectId?: string,
): DoubanMovieInfoException {
  return new DoubanMovieInfoException(code, message, subjectId);
}
