export type BrowserAutomationErrorCode =
  | 'AUTH_STATE_MISSING'
  | 'AUTH_PROFILE_REQUIRED'
  | 'AUTH_PROFILE_EXPIRED'
  | 'BROWSER_AGENT_COMMAND_FAILED'
  | 'BROWSER_UNAVAILABLE'
  | 'AGENT_NOT_AVAILABLE'
  | 'BLOCKED'
  | 'INVALID_AUTH_BUNDLE'
  | 'NAVIGATION_TIMEOUT'
  | 'ORIGIN_NOT_ALLOWED'
  | 'SITE_NOT_CONFIGURED'
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
