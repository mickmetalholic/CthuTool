import { Injectable } from '@nestjs/common';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { DesktopBrowserRuntimeService } from '../desktop-runtime/desktop-browser-runtime.service';

@Injectable()
export class BrowserAuthService {
  constructor(private readonly desktopRuntime: DesktopBrowserRuntimeService) {}

  async getAuthStatus(
    siteId: string,
    profileName?: string,
  ): Promise<{
    readonly siteId: string;
    readonly profileName: string;
    readonly available: boolean;
    readonly status: 'available' | 'unavailable' | 'unknown';
    readonly challenge?: {
      readonly action: 'login' | 'verify';
      readonly reason: string;
    };
  }> {
    const runtime = await this.desktopRuntime.getStatus();
    if (!runtime.available) {
      return {
        siteId,
        profileName: profileName ?? 'default',
        available: false,
        status: 'unavailable',
      };
    }

    return {
      siteId,
      profileName: profileName ?? 'default',
      available: true,
      status: 'available',
    };
  }

  async listProfiles(): Promise<
    Array<{
      readonly agentId: string;
      readonly siteId: string;
      readonly profileName: string;
      readonly status: string;
      readonly updatedAt: string;
    }>
  > {
    // Server-side profile mirrors were removed; callers should query status for
    // the operation/site they are about to run.
    return [];
  }

  async getRuntimeStatus(): Promise<{
    readonly available: boolean;
    readonly agentId?: string;
    readonly lastSeenAt?: string;
  }> {
    const runtime = await this.desktopRuntime.getStatus();
    return {
      available: runtime.available,
      agentId: runtime.agentId === 'unknown' ? undefined : runtime.agentId,
      lastSeenAt: runtime.lastSeenAt,
    };
  }
}
