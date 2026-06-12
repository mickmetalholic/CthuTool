import { Module } from '@nestjs/common';
import { parseBrowserConfiguration } from '../../config/service-configuration';
import { BrowserAuthStateStore } from './browser-auth-state.store';
import { BrowserBlockDetector } from './browser-block-detector';
import { BrowserContentService } from './browser-content.service';
import { BrowserDiagnosticsStore } from './browser-diagnostics.store';
import { BrowserTaskRunner } from './browser-task-runner';
import { BROWSER_PROVIDER } from './browser-automation.tokens';
import { LocalPlaywrightProvider } from './local-playwright.provider';

@Module({
  exports: [BrowserAuthStateStore, BrowserContentService],
  providers: [
    BrowserBlockDetector,
    BrowserContentService,
    {
      provide: BrowserAuthStateStore,
      useFactory: () =>
        new BrowserAuthStateStore({
          authStateDir: getBrowserConfig().authStateDir,
        }),
    },
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
    {
      provide: BROWSER_PROVIDER,
      useFactory: () => {
        const config = getBrowserConfig();
        return new LocalPlaywrightProvider({
          dataDir: config.dataDir,
          headless: config.headless,
        });
      },
    },
  ],
})
export class BrowserAutomationModule {}

function getBrowserConfig() {
  const result = parseBrowserConfiguration(process.env);
  if (result.isErr()) {
    throw result.error;
  }
  return result.value;
}
