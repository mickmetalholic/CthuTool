import { Injectable, Optional } from '@nestjs/common';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserDiagnosticsStore } from '../browser/content/browser-diagnostics.store';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { DesktopBrowserRuntimeService } from '../browser/desktop-runtime/desktop-browser-runtime.service';

type HealthStatus = {
  status: 'ok';
  service: string;
  timestamp: string;
};

type ReadinessStatus = {
  status: 'ready' | 'degraded';
  service: string;
  checks: {
    browserAgent: {
      agentId: string;
      lastSeenAt?: string;
      status: 'ok' | 'degraded';
    };
    diagnosticsStore: {
      diagnosticsDir?: string;
      enabled: boolean;
      status: 'ok' | 'degraded';
    };
  };
  timestamp: string;
};

@Injectable()
export class HealthService {
  constructor(
    @Optional()
    private readonly desktopRuntime?: DesktopBrowserRuntimeService,
    @Optional()
    private readonly diagnosticsStore?: BrowserDiagnosticsStore,
  ) {}

  getStatus(): HealthStatus {
    return {
      status: 'ok',
      service: 'backend',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness(): Promise<ReadinessStatus> {
    const browser = await this.desktopRuntime?.getStatus();
    const diagnostics = this.diagnosticsStore?.getStatus();
    const browserAgentStatus = browser?.available ? 'ok' : 'degraded';
    const diagnosticsStatus = diagnostics?.enabled ? 'ok' : 'degraded';
    return {
      status:
        browserAgentStatus === 'ok' && diagnosticsStatus === 'ok'
          ? 'ready'
          : 'degraded',
      service: 'backend',
      checks: {
        browserAgent: {
          agentId: browser?.agentId ?? 'unknown',
          ...(browser?.lastSeenAt ? { lastSeenAt: browser.lastSeenAt } : {}),
          status: browserAgentStatus,
        },
        diagnosticsStore: {
          diagnosticsDir: diagnostics?.diagnosticsDir,
          enabled: diagnostics?.enabled ?? false,
          status: diagnosticsStatus,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}
