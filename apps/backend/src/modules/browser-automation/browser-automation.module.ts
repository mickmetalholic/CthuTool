import { Module } from '@nestjs/common';
import { parseBrowserConfiguration } from '../../config/service-configuration';
import { AgentRegistryModule } from '../agent-registry/agent-registry.module';
import { AgentBrowserProvider } from './agent-browser.provider';
import { BrowserAutomationController } from './browser-automation.controller';
import { BROWSER_PROVIDER } from './browser-automation.tokens';
import { BrowserBlockDetector } from './browser-block-detector';
import { BrowserContentService } from './browser-content.service';
import { BrowserDiagnosticsStore } from './browser-diagnostics.store';
import { BrowserPendingAuthTaskService } from './browser-pending-auth-task.service';
import { BrowserProfileRegistryService } from './browser-profile-registry.service';
import { BrowserSiteConfigService } from './browser-site-config.service';
import { BrowserStateProjectionService } from './browser-state-projection.service';
import { BrowserStateSnapshotListener } from './browser-state-snapshot-listener';
import { BrowserTaskRunner } from './browser-task-runner';

@Module({
  imports: [AgentRegistryModule],
  controllers: [BrowserAutomationController],
  exports: [
    BrowserContentService,
    BrowserPendingAuthTaskService,
    BrowserProfileRegistryService,
    BrowserSiteConfigService,
  ],
  providers: [
    AgentBrowserProvider,
    BrowserBlockDetector,
    BrowserContentService,
    BrowserPendingAuthTaskService,
    BrowserProfileRegistryService,
    BrowserStateProjectionService,
    BrowserStateSnapshotListener,
    {
      provide: BrowserSiteConfigService,
      useFactory: () =>
        BrowserSiteConfigService.create({
          sitesFilePath: getBrowserConfig().sitesConfigFile,
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
      useExisting: AgentBrowserProvider,
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
