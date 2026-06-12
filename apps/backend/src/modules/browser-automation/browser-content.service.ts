import { Inject, Injectable } from '@nestjs/common';
import { BrowserAutomationError } from './browser-automation.errors';
import type {
  BrowserAuthUsage,
  BrowserContentRequest,
  BrowserContentResult,
  BrowserProvider,
  BrowserProviderSnapshot,
} from './browser-automation.types';
import { BrowserAuthStateStore } from './browser-auth-state.store';
import { BrowserBlockDetector } from './browser-block-detector';
import { BrowserDiagnosticsStore } from './browser-diagnostics.store';
import { BrowserTaskRunner } from './browser-task-runner';
import { BROWSER_PROVIDER } from './browser-automation.tokens';

@Injectable()
export class BrowserContentService {
  constructor(
    @Inject(BROWSER_PROVIDER)
    private readonly provider: BrowserProvider,
    private readonly authStateStore: BrowserAuthStateStore,
    private readonly taskRunner: BrowserTaskRunner,
    private readonly blockDetector: BrowserBlockDetector,
    private readonly diagnosticsStore: BrowserDiagnosticsStore,
  ) {}

  async getPageContent(
    request: BrowserContentRequest,
  ): Promise<BrowserContentResult> {
    assertAllowedOrigin(request.url, request.allowedOrigins);

    const { auth, storageState } = await this.resolveAuth(request);
    const snapshot = await this.taskRunner.run(
      `browser:${request.url}`,
      () =>
        this.provider.capturePage({
          ...request,
          storageState,
        }),
      { timeoutMs: request.timeoutMs },
    );
    const detection = this.blockDetector.detect(snapshot);
    const diagnostics = await this.saveDiagnosticsIfNeeded(
      detection.kind === 'ok' ? undefined : detection.kind.toUpperCase(),
      detection.reason,
      snapshot,
    );

    return {
      ...snapshot,
      auth,
      capturedAt: new Date().toISOString(),
      detection,
      ...(diagnostics ? { diagnostics } : {}),
    };
  }

  private async resolveAuth(
    request: BrowserContentRequest,
  ): Promise<{ auth: BrowserAuthUsage; storageState?: unknown }> {
    if (!request.profileName) {
      return {
        auth: { status: 'anonymous', used: false },
      };
    }

    const hasProfile = await this.authStateStore.hasProfile(
      request.profileName,
    );
    if (!hasProfile) {
      if (request.requireAuth === true) {
        throw new BrowserAutomationError(
          'AUTH_STATE_MISSING',
          `Browser auth profile "${request.profileName}" is required but missing`,
        );
      }
      return {
        auth: {
          profileName: request.profileName,
          status: 'missing',
          used: false,
        },
      };
    }

    return {
      auth: {
        profileName: request.profileName,
        status: 'available',
        used: true,
      },
      storageState: await this.authStateStore.readStorageState(
        request.profileName,
      ),
    };
  }

  private async saveDiagnosticsIfNeeded(
    errorCode: string | undefined,
    summary: string | undefined,
    snapshot: BrowserProviderSnapshot,
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
