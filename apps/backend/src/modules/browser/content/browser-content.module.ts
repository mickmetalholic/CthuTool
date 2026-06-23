import { Module } from '@nestjs/common';
import { ObservabilityModule } from '../../../observability';
import { SitesConfigModule } from '../../sites-config/sites-config.module';
import { DesktopBrowserRuntimeModule } from '../desktop-runtime/desktop-browser-runtime.module';
import { BrowserBlockDetector } from './browser-block-detector';
import { BrowserContentService } from './browser-content.service';
import {
  BROWSER_DIAGNOSTICS_STORE_OPTIONS,
  BrowserDiagnosticsStore,
} from './browser-diagnostics.store';
import {
  BROWSER_TASK_RUNNER_OPTIONS,
  BrowserTaskRunner,
} from './browser-task-runner';

@Module({
  imports: [
    DesktopBrowserRuntimeModule,
    ObservabilityModule,
    SitesConfigModule,
  ],
  exports: [BrowserContentService, BrowserDiagnosticsStore],
  providers: [
    {
      provide: BROWSER_DIAGNOSTICS_STORE_OPTIONS,
      useValue: {
        diagnosticsDir: './data/browser-diagnostics',
        enabled: true,
      },
    },
    {
      provide: BROWSER_TASK_RUNNER_OPTIONS,
      useValue: {
        defaultDelayMs: 1000,
        defaultTimeoutMs: 30000,
        maxConcurrency: 1,
      },
    },
    BrowserBlockDetector,
    BrowserContentService,
    BrowserDiagnosticsStore,
    BrowserTaskRunner,
  ],
})
export class BrowserContentModule {}
