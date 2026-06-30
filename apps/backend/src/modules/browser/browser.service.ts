import { Injectable } from '@nestjs/common';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserAuthService } from './auth/browser-auth.service';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserContentService } from './content/browser-content.service';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { DesktopBrowserRuntimeService } from './desktop-runtime/desktop-browser-runtime.service';
import type {
  DesktopBrowserProfileStatus,
  DesktopBrowserRuntimeDiagnostics,
  DesktopBrowserRuntimeResult,
} from './desktop-runtime/desktop-browser-runtime.types';
import type {
  BrowserContentRequest,
  BrowserContentResult,
} from './shared/browser.types';

@Injectable()
export class BrowserService {
  constructor(
    private readonly content: BrowserContentService,
    private readonly auth: BrowserAuthService,
    private readonly runtime: DesktopBrowserRuntimeService,
  ) {}

  async getPageContent(
    request: BrowserContentRequest,
  ): Promise<BrowserContentResult> {
    return this.content.getPageContent(request);
  }

  async getAuthStatus(siteId: string, profileName?: string) {
    return this.auth.getAuthStatus(siteId, profileName);
  }

  async getRuntimeStatus() {
    return this.auth.getRuntimeStatus();
  }

  async getDiagnostics(): Promise<DesktopBrowserRuntimeDiagnostics> {
    return this.runtime.getDiagnostics();
  }

  async openLogin(options: {
    readonly siteId: string;
    readonly profileName: string;
    readonly loginUrl?: string;
    readonly timeoutMs?: number;
  }): Promise<DesktopBrowserRuntimeResult<DesktopBrowserProfileStatus>> {
    return this.runtime.openLogin(options);
  }

  async verifyProfile(options: {
    readonly siteId: string;
    readonly profileName: string;
    readonly verifyUrl?: string;
    readonly timeoutMs?: number;
  }): Promise<DesktopBrowserRuntimeResult<DesktopBrowserProfileStatus>> {
    return this.runtime.verifyProfile(options);
  }
}
