import { HttpException, HttpStatus } from '@nestjs/common';

export type BrowserPublicApiErrorCode =
  | 'BROWSER_UNAVAILABLE'
  | 'AUTH_PROFILE_REQUIRED'
  | 'AUTH_PROFILE_EXPIRED'
  | 'INVALID_BROWSER_REQUEST'
  | 'BROWSER_SESSION_NOT_FOUND'
  | 'BROWSER_SESSION_EXPIRED'
  | 'BROWSER_ACTION_FAILED';

const statusByCode: Record<BrowserPublicApiErrorCode, HttpStatus> = {
  AUTH_PROFILE_EXPIRED: HttpStatus.UNAUTHORIZED,
  AUTH_PROFILE_REQUIRED: HttpStatus.UNAUTHORIZED,
  BROWSER_ACTION_FAILED: HttpStatus.UNPROCESSABLE_ENTITY,
  BROWSER_SESSION_EXPIRED: HttpStatus.NOT_FOUND,
  BROWSER_SESSION_NOT_FOUND: HttpStatus.NOT_FOUND,
  BROWSER_UNAVAILABLE: HttpStatus.SERVICE_UNAVAILABLE,
  INVALID_BROWSER_REQUEST: HttpStatus.BAD_REQUEST,
};

export class BrowserPublicApiException extends HttpException {
  constructor(
    readonly code: BrowserPublicApiErrorCode,
    message: string,
    readonly metadata?: Record<string, unknown>,
  ) {
    super(
      {
        code,
        message,
        ...(metadata ? { metadata } : {}),
      },
      statusByCode[code],
    );
  }
}

export function browserPublicApiError(
  code: BrowserPublicApiErrorCode,
  message: string,
  metadata?: Record<string, unknown>,
): BrowserPublicApiException {
  return new BrowserPublicApiException(code, message, metadata);
}
