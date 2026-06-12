export type BrowserAutomationErrorCode =
  | 'AUTH_STATE_MISSING'
  | 'BROWSER_UNAVAILABLE'
  | 'BLOCKED'
  | 'INVALID_AUTH_BUNDLE'
  | 'NAVIGATION_TIMEOUT'
  | 'ORIGIN_NOT_ALLOWED'
  | 'PAGE_PARSE_FAILED';

export class BrowserAutomationError extends Error {
  constructor(
    readonly code: BrowserAutomationErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'BrowserAutomationError';
  }
}
