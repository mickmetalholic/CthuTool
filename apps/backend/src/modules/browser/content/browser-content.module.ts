import { Module } from '@nestjs/common';
import { parseBrowserConfiguration } from '../../../config/service-configuration';
import { SitesConfigModule } from '../../sites-config/sites-config.module';
import { DesktopBrowserRuntimeModule } from '../desktop-runtime/desktop-browser-runtime.module';
import { BrowserBlockDetector } from './browser-block-detector';
import { BrowserContentService } from './browser-content.service';
import { BrowserDiagnosticsStore } from './browser-diagnostics.store';
import { BrowserTaskRunner } from './browser-task-runner';

@Module({
  imports: [DesktopBrowserRuntimeModule, SitesConfigModule],
  exports: [BrowserContentService],
  providers: [
    BrowserBlockDetector,
    BrowserContentService,
    {
      provide: BrowserDiagnosticsStore,
      useFactory: () =>
        new BrowserDiagnosticsStore({
          diagnosticsDir: getBrowserConfig().diagnosticsDir,
          enabled: true,
        }),
    },
    {
      provide: BrowserTaskRunner,
      useFactory: () => {
        const config = getBrowserConfig();
        return new BrowserTaskRunner({
          defaultDelayMs: config.defaultDelayMs,
          defaultTimeoutMs: config.defaultTimeoutMs,
          maxConcurrency: config.maxConcurrency,
        });
      },
    },
  ],
})
export class BrowserContentModule {}

function getBrowserConfig() {
  const result = parseBrowserConfiguration(process.env);
  if (result.isErr()) {
    throw result.error;
  }
  return result.value;
}
