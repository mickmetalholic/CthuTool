import { Module } from '@nestjs/common';
import { ObservabilityModule } from '../../../observability';
import { SitesConfigModule } from '../../sites-config/sites-config.module';
import { DesktopBrowserRuntimeModule } from '../desktop-runtime/desktop-browser-runtime.module';
import { BrowserBlockDetector } from './browser-block-detector';
import { BrowserContentService } from './browser-content.service';
import { BrowserDiagnosticsStore } from './browser-diagnostics.store';
import { BrowserTaskRunner } from './browser-task-runner';

@Module({
  imports: [
    DesktopBrowserRuntimeModule,
    ObservabilityModule,
    SitesConfigModule,
  ],
  exports: [BrowserContentService, BrowserDiagnosticsStore],
  providers: [
    BrowserBlockDetector,
    BrowserContentService,
    {
      provide: BrowserDiagnosticsStore,
      useFactory: () =>
        new BrowserDiagnosticsStore({
          diagnosticsDir: './data/browser-diagnostics',
          enabled: true,
        }),
    },
    {
      provide: BrowserTaskRunner,
      useFactory: () =>
        new BrowserTaskRunner({
          defaultDelayMs: 1000,
          defaultTimeoutMs: 30000,
          maxConcurrency: 1,
        }),
    },
  ],
})
export class BrowserContentModule {}
