import type { BrowserProfileSummary } from '@cthutool/browser-runtime-protocol';
import type { BrowserResourceType } from '@cthutool/config';

export type { BrowserResourceType, BrowserSiteConfig } from '@cthutool/config';

export type BrowserDetectionKind =
  | 'ok'
  | 'login_required'
  | 'rate_limited'
  | 'captcha_required'
  | 'blocked';

export type BrowserDetection = {
  readonly kind: BrowserDetectionKind;
  readonly reason?: string;
};

export type BrowserAuthUsage = {
  readonly profileName?: string;
  readonly status:
    | 'anonymous'
    | 'available'
    | 'missing'
    | 'expired'
    | 'unknown';
  readonly used: boolean;
};

export type BrowserContentRequest = {
  readonly url: string;
  readonly siteId?: string;
  readonly allowedOrigins?: readonly string[];
  readonly profileName?: string;
  readonly authPolicy?: 'anonymous' | 'required';
  readonly requireAuth?: boolean;
  readonly loginUrl?: string;
  readonly verifyUrl?: string;
  readonly includeHtml?: boolean;
  readonly includeText?: boolean;
  readonly includeScreenshot?: boolean;
  readonly blockResources?: readonly BrowserResourceType[];
  readonly timeoutMs?: number;
  readonly waitUntil?: 'domcontentloaded' | 'load' | 'networkidle';
};

export type BrowserCaptureRequest = BrowserContentRequest;

export type BrowserCaptureSnapshot = {
  readonly agentId?: string;
  readonly detection?: BrowserDetection;
  readonly finalUrl: string;
  readonly status?: number;
  readonly title?: string;
  readonly html?: string;
  readonly text?: string;
  readonly screenshot?: Buffer;
};

export type BrowserContentResult = BrowserCaptureSnapshot & {
  readonly capturedAt: string;
  readonly auth: BrowserAuthUsage;
  readonly detection: BrowserDetection;
  readonly diagnostics?: BrowserDiagnosticsSummary;
};

export type BrowserDiagnosticsSummary = {
  readonly id: string;
  readonly summary: string;
};

export type BrowserCaptureProvider = {
  capturePage(request: BrowserCaptureRequest): Promise<BrowserCaptureSnapshot>;
};

export type BrowserAuthBundleMeta = {
  readonly profileName: string;
  readonly source: 'cli-helper' | 'browser-extension' | 'manual';
  readonly createdAt?: string;
  readonly updatedAt: string;
  readonly loginUrl?: string;
  readonly verifyUrl?: string;
  readonly allowedOrigins?: readonly string[];
};

export type BrowserStorageState = {
  readonly cookies: readonly unknown[];
  readonly origins: readonly unknown[];
};

export type BrowserAuthBundle = {
  readonly meta: BrowserAuthBundleMeta;
  readonly storageState: BrowserStorageState;
};

export type BrowserProfileStatus = {
  readonly profileName: string;
  readonly status: 'available' | 'missing' | 'invalid';
  readonly source?: BrowserAuthBundleMeta['source'];
  readonly updatedAt?: string;
};

export type BrowserProfileRegistryEntry = BrowserProfileSummary;

export type BrowserProviderRequest = BrowserCaptureRequest;
export type BrowserProviderSnapshot = BrowserCaptureSnapshot;
export type BrowserProvider = BrowserCaptureProvider;
