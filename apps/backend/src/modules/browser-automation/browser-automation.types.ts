export type BrowserResourceType =
  | 'document'
  | 'font'
  | 'image'
  | 'media'
  | 'script'
  | 'stylesheet'
  | 'xhr'
  | 'fetch';

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

export type BrowserProviderRequest = BrowserContentRequest;

export type BrowserProviderSnapshot = {
  readonly agentId?: string;
  readonly detection?: BrowserDetection;
  readonly finalUrl: string;
  readonly status?: number;
  readonly title?: string;
  readonly html?: string;
  readonly text?: string;
  readonly screenshot?: Buffer;
};

export type BrowserContentResult = BrowserProviderSnapshot & {
  readonly capturedAt: string;
  readonly auth: BrowserAuthUsage;
  readonly detection: BrowserDetection;
  readonly diagnostics?: BrowserDiagnosticsSummary;
};

export type BrowserDiagnosticsSummary = {
  readonly id: string;
  readonly summary: string;
};

export type BrowserProvider = {
  capturePage(
    request: BrowserProviderRequest,
  ): Promise<BrowserProviderSnapshot>;
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

export type BrowserSiteConfig = {
  readonly siteId: string;
  readonly displayName: string;
  readonly allowedOrigins: readonly string[];
  readonly authPolicy: 'anonymous' | 'required';
  readonly profileName?: string;
  readonly loginUrl?: string;
  readonly verifyUrl?: string;
  readonly defaultBlockResources?: readonly BrowserResourceType[];
  readonly defaultTimeoutMs?: number;
};

export type BrowserPendingAuthReason =
  | 'missing'
  | 'expired'
  | 'blocked'
  | 'verification_failed';

export type BrowserPendingAuthTask = {
  readonly id: string;
  readonly agentId: string;
  readonly siteId: string;
  readonly profileName: string;
  readonly reason: BrowserPendingAuthReason;
  readonly loginUrl?: string;
  readonly verifyUrl?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type BrowserProfileRegistryEntry = BrowserProfileSummary;

import type { BrowserProfileSummary } from '@cthutool/agent-protocol';
