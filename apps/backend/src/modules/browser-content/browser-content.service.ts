import { Inject, Injectable } from '@nestjs/common';
import { BROWSER_CAPTURE_PROVIDER } from '../browser-agent-capture/browser-agent-capture.tokens';
import { BrowserAutomationError } from '../browser-automation/browser-automation.errors';
import type {
  BrowserAuthUsage,
  BrowserCaptureProvider,
  BrowserCaptureSnapshot,
  BrowserContentRequest,
  BrowserContentResult,
  BrowserSiteConfig,
} from '../browser-automation/browser-automation.types';
// biome-ignore lint/style/useImportType: constructor injection token
import { SitesConfigService } from '../sites-config/sites-config.service';
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserBlockDetector } from './browser-block-detector';
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserDiagnosticsStore } from './browser-diagnostics.store';
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserTaskRunner } from './browser-task-runner';

@Injectable()
export class BrowserContentService {
  constructor(
    @Inject(BROWSER_CAPTURE_PROVIDER)
    private readonly provider: BrowserCaptureProvider,
    private readonly siteConfig: SitesConfigService,
    private readonly taskRunner: BrowserTaskRunner,
    private readonly blockDetector: BrowserBlockDetector,
    private readonly diagnosticsStore: BrowserDiagnosticsStore,
  ) {}

  async getPageContent(
    request: BrowserContentRequest,
  ): Promise<BrowserContentResult> {
    const { site, providerRequest } = this.resolveProviderRequest(request);
    assertAllowedOrigin(
      providerRequest.url,
      providerRequest.allowedOrigins ?? [],
    );

    const snapshot = await this.taskRunner.run(
      `browser:${providerRequest.url}`,
      () => this.provider.capturePage(providerRequest),
      { timeoutMs: providerRequest.timeoutMs },
    );
    const detection = snapshot.detection ?? this.blockDetector.detect(snapshot);
    const diagnostics = await this.saveDiagnosticsIfNeeded(
      detection.kind === 'ok' ? undefined : detection.kind.toUpperCase(),
      detection.reason,
      snapshot,
    );

    return {
      ...snapshot,
      auth: this.resolveAuthUsage(providerRequest, site),
      capturedAt: new Date().toISOString(),
      detection,
      ...(diagnostics ? { diagnostics } : {}),
    };
  }

  private resolveProviderRequest(request: BrowserContentRequest): {
    readonly providerRequest: BrowserContentRequest;
    readonly site?: BrowserSiteConfig;
  } {
    const site = request.siteId
      ? this.siteConfig.getSite(request.siteId)
      : this.siteConfig.resolveForUrl(request.url);
    if (!site && (request.siteId || !request.allowedOrigins)) {
      throw new BrowserAutomationError(
        'SITE_NOT_CONFIGURED',
        request.siteId
          ? `Browser site "${request.siteId}" is not configured`
          : `No browser site is configured for "${new URL(request.url).origin}"`,
      );
    }

    const allowedOrigins = request.allowedOrigins ?? site?.allowedOrigins ?? [];
    const authPolicy =
      request.authPolicy ??
      (request.requireAuth === true
        ? 'required'
        : request.requireAuth === false
          ? 'anonymous'
          : (site?.authPolicy ?? 'anonymous'));
    const profileName =
      request.profileName ??
      (authPolicy === 'required' ? site?.profileName : undefined);

    return {
      providerRequest: {
        ...request,
        allowedOrigins,
        authPolicy,
        blockResources:
          request.blockResources ?? site?.defaultBlockResources ?? undefined,
        loginUrl: site?.loginUrl,
        profileName,
        siteId: site?.siteId ?? request.siteId,
        timeoutMs: request.timeoutMs ?? site?.defaultTimeoutMs,
        verifyUrl: site?.verifyUrl,
      },
      ...(site ? { site } : {}),
    };
  }

  private resolveAuthUsage(
    request: BrowserContentRequest,
    _site: BrowserSiteConfig | undefined,
  ): BrowserAuthUsage {
    if (request.authPolicy === 'required' && request.profileName) {
      return {
        profileName: request.profileName,
        status: 'available',
        used: true,
      };
    }

    if (request.profileName) {
      return {
        profileName: request.profileName,
        status: 'missing',
        used: false,
      };
    }

    return {
      status: 'anonymous',
      used: false,
    };
  }

  private async saveDiagnosticsIfNeeded(
    errorCode: string | undefined,
    summary: string | undefined,
    snapshot: BrowserCaptureSnapshot,
  ) {
    if (!errorCode) {
      return undefined;
    }
    return this.diagnosticsStore.save({
      errorCode,
      finalUrl: snapshot.finalUrl,
      html: snapshot.html,
      screenshot: snapshot.screenshot,
      summary: summary ?? errorCode,
    });
  }
}

export function assertAllowedOrigin(
  url: string,
  allowedOrigins: readonly string[],
): void {
  const origin = new URL(url).origin;
  if (!allowedOrigins.includes(origin)) {
    throw new BrowserAutomationError(
      'ORIGIN_NOT_ALLOWED',
      `URL origin "${origin}" is not allowed`,
      { allowedOrigins },
    );
  }
}
