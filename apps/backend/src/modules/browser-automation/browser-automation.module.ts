import { Module } from '@nestjs/common';
import { parseBrowserConfiguration } from '../../config/service-configuration';
import { AgentCommandGatewayModule } from '../agent-command-gateway/agent-command-gateway.module';
import { AgentStateModule } from '../agent-state/agent-state.module';
import { BrowserAuthModule } from '../browser-auth/browser-auth.module';
import { SitesConfigModule } from '../sites-config/sites-config.module';
import { AgentBrowserCaptureProvider } from './agent-browser-capture.provider';
import { BrowserAutomationController } from './browser-automation.controller';
import { BROWSER_CAPTURE_PROVIDER } from './browser-automation.tokens';
import { BrowserBlockDetector } from './browser-block-detector';
import { BrowserContentService } from './browser-content.service';
import { BrowserDiagnosticsStore } from './browser-diagnostics.store';
import { BrowserTaskRunner } from './browser-task-runner';

@Module({
  imports: [
    AgentCommandGatewayModule,
    AgentStateModule,
    BrowserAuthModule,
    SitesConfigModule,
  ],
  controllers: [BrowserAutomationController],
  exports: [BrowserAuthModule, BrowserContentService, SitesConfigModule],
  providers: [
    AgentBrowserCaptureProvider,
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
    {
      provide: BROWSER_CAPTURE_PROVIDER,
      useExisting: AgentBrowserCaptureProvider,
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
