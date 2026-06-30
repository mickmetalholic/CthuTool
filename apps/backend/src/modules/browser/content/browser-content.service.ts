import { Injectable, Optional } from '@nestjs/common';
// Nest DI needs runtime class reference; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BackendObservabilityService } from '../../../observability';
// biome-ignore lint/style/useImportType: constructor injection token
import { SitesConfigService } from '../../sites-config/sites-config.service';
// biome-ignore lint/style/useImportType: constructor injection token
import { DesktopBrowserRuntimeService } from '../desktop-runtime/desktop-browser-runtime.service';
import { BrowserWorkflowError } from '../shared/browser.errors';
import type {
  BrowserAuthUsage,
  BrowserCaptureSnapshot,
  BrowserContentRequest,
  BrowserContentResult,
  BrowserSiteConfig,
} from '../shared/browser.types';
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserBlockDetector } from './browser-block-detector';
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserDiagnosticsStore } from './browser-diagnostics.store';
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserTaskRunner } from './browser-task-runner';

@Injectable()
export class BrowserContentService {
  constructor(
    private readonly desktopRuntime: DesktopBrowserRuntimeService,
    private readonly siteConfig: SitesConfigService,
    private readonly taskRunner: BrowserTaskRunner,
    private readonly blockDetector: BrowserBlockDetector,
    private readonly diagnosticsStore: BrowserDiagnosticsStore,
    @Optional()
    private readonly observability?: BackendObservabilityService,
  ) {}

  async getPageContent(
    request: BrowserContentRequest,
  ): Promise<BrowserContentResult> {
    const { site, runtimeOptions } = this.resolveProviderRequest(request);
    try {
      assertAllowedOrigin(
        runtimeOptions.url,
        runtimeOptions.allowedOrigins ?? [],
      );
    } catch (error) {
      this.observability?.record({
        event: 'browser.content_origin_rejected',
        level: 'warn',
        details: {
          errorCode:
            error instanceof BrowserWorkflowError
              ? error.code
              : 'ORIGIN_REJECTED',
          siteId: site?.siteId ?? request.siteId,
          url: runtimeOptions.url,
        },
      });
      throw error;
    }

    this.observability?.record({
      event: 'browser.content_request_resolved',
      details: {
        authPolicy: runtimeOptions.authPolicy,
        includeHtml: runtimeOptions.includeHtml,
        includeScreenshot: runtimeOptions.includeScreenshot,
        includeText: runtimeOptions.includeText,
        siteId: site?.siteId ?? runtimeOptions.siteId,
        timeoutMs: runtimeOptions.timeoutMs,
        url: runtimeOptions.url,
      },
    });
    const snapshot = await this.taskRunner.run(
      `browser:${runtimeOptions.url}`,
      () => this.captureViaRuntime(runtimeOptions),
      { timeoutMs: runtimeOptions.timeoutMs },
    );
    const detection = snapshot.detection ?? this.blockDetector.detect(snapshot);
    const diagnostics = await this.saveDiagnosticsIfNeeded(
      detection.kind === 'ok' ? undefined : detection.kind.toUpperCase(),
      detection.reason,
      snapshot,
    );
    this.observability?.record({
      event:
        detection.kind === 'ok'
          ? 'browser.content_completed'
          : 'browser.content_detected',
      level: detection.kind === 'ok' ? 'info' : 'warn',
      details: {
        detectionKind: detection.kind,
        diagnosticsId: diagnostics?.id,
        finalUrl: snapshot.finalUrl,
        siteId: site?.siteId ?? runtimeOptions.siteId,
        status: snapshot.status,
        summary: diagnostics?.summary ?? detection.reason,
      },
    });

    return {
      ...snapshot,
      auth: this.resolveAuthUsage(runtimeOptions, site),
      capturedAt: new Date().toISOString(),
      detection,
      ...(diagnostics ? { diagnostics } : {}),
    };
  }

  private async captureViaRuntime(
    request: BrowserContentRequest,
  ): Promise<BrowserCaptureSnapshot> {
    const result = await this.desktopRuntime.capturePage({
      authPolicy: request.authPolicy as 'anonymous' | 'required' | undefined,
      blockResources: request.blockResources,
      includeHtml: request.includeHtml,
      includeScreenshot: request.includeScreenshot,
      includeText: request.includeText,
      loginUrl: request.loginUrl,
      profileName: request.profileName,
      siteId: request.siteId,
      timeoutMs: request.timeoutMs,
      url: request.url,
      verifyUrl: request.verifyUrl,
      waitUntil: request.waitUntil as
        | 'domcontentloaded'
        | 'load'
        | 'networkidle'
        | undefined,
    });

    if (result.ok) {
      return {
        agentId: undefined,
        detection: result.value.detection,
        finalUrl: result.value.finalUrl,
        html: result.value.html,
        screenshot: result.value.screenshotBase64
          ? Buffer.from(result.value.screenshotBase64, 'base64')
          : undefined,
        status: result.value.status,
        text: result.value.text,
        title: result.value.title,
      };
    }

    if ('challenge' in result) {
      throw new BrowserWorkflowError(
        'AUTH_PROFILE_REQUIRED',
        `${result.challenge.reason === 'profile_expired' ? 'Browser profile expired' : 'Browser login required'} for site "${result.challenge.siteId}"`,
        {
          action: result.challenge.action,
          challenge: result.challenge,
          reason: result.challenge.reason,
          siteId: result.challenge.siteId,
          profileName: result.challenge.profileName,
        },
      );
    }

    throw new BrowserWorkflowError(
      result.code === 'AGENT_NOT_AVAILABLE'
        ? 'BROWSER_UNAVAILABLE'
        : 'BROWSER_AGENT_COMMAND_FAILED',
      result.error,
    );
  }

  private resolveProviderRequest(request: BrowserContentRequest): {
    readonly runtimeOptions: BrowserContentRequest;
    readonly site?: BrowserSiteConfig;
  } {
    const site = request.siteId
      ? this.siteConfig.getSite(request.siteId)
      : this.siteConfig.resolveForUrl(request.url);
    if (!site && (request.siteId || !request.allowedOrigins)) {
      this.observability?.record({
        event: 'browser.content_site_not_configured',
        level: 'warn',
        details: {
          errorCode: 'SITE_NOT_CONFIGURED',
          siteId: request.siteId,
          url: request.url,
        },
      });
      throw new BrowserWorkflowError(
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
      runtimeOptions: {
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
    throw new BrowserWorkflowError(
      'ORIGIN_NOT_ALLOWED',
      `URL origin "${origin}" is not allowed`,
      { allowedOrigins },
    );
  }
}
