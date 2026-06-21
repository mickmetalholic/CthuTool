import type {
  BrowserAction,
  BrowserActionResult,
  BrowserDetection,
} from '@cthutool/browser-runtime-protocol';

export type DesktopBrowserRuntimeOperation =
  | 'capturePage'
  | 'createSession'
  | 'runActions'
  | 'closeSession'
  | 'openLogin'
  | 'verifyProfile'
  | 'getStatus'
  | 'getDiagnostics';

export type InteractionChallengeReason =
  | 'login_required'
  | 'profile_expired'
  | 'profile_missing'
  | 'verification_failed'
  | 'captcha_required'
  | 'blocked'
  | 'rate_limited';

export type InteractionChallenge = {
  readonly siteId: string;
  readonly profileName: string;
  readonly action: 'login' | 'verify';
  readonly reason: InteractionChallengeReason;
  readonly loginUrl?: string;
  readonly verifyUrl?: string;
};

export type DesktopBrowserRuntimeStatus = {
  readonly agentId: string;
  readonly available: boolean;
  readonly lastSeenAt?: string;
};

export type DesktopBrowserRuntimeResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly challenge: InteractionChallenge }
  | {
      readonly ok: false;
      readonly error: string;
      readonly code?: string;
    };

export type DesktopBrowserCaptureResult = {
  readonly finalUrl: string;
  readonly status?: number;
  readonly title?: string;
  readonly html?: string;
  readonly text?: string;
  readonly screenshotBase64?: string;
  readonly detection: BrowserDetection;
  readonly capturedAt: string;
};

export type DesktopBrowserSessionMetadata = {
  readonly agentId: string;
  readonly sessionId: string;
  readonly siteId: string;
  readonly profileName?: string;
  readonly createdAt: string;
  readonly expiresAt: string;
};

export type DesktopBrowserAction = BrowserAction;
export type DesktopBrowserActionResult = BrowserActionResult;

export type DesktopBrowserRunActionsResult = {
  readonly sessionId: string;
  readonly actionResults: readonly DesktopBrowserActionResult[];
  readonly capturedAt: string;
};

export type DesktopBrowserProfileStatus = {
  readonly profileName: string;
  readonly status: 'available' | 'missing' | 'invalid' | 'expired';
  readonly updatedAt?: string;
};

export type DesktopBrowserRuntimeDiagnostics = {
  readonly agentId: string;
  readonly online: boolean;
  readonly capabilities: readonly string[];
  readonly lastSeenAt?: string;
};
