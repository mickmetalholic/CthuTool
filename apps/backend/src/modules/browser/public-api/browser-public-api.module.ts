import { Module } from '@nestjs/common';
import { AgentRegistryModule } from '../../agent/registry/agent-registry.module';
import { OperatorAccessModule } from '../../operator-access/operator-access.module';
import { SitesConfigModule } from '../../sites-config/sites-config.module';
import { DesktopBrowserRuntimeModule } from '../desktop-runtime/desktop-browser-runtime.module';
import { BrowserPublicApiController } from './browser-public-api.controller';
import { BrowserPublicApiService } from './browser-public-api.service';
import { BrowserSessionRoutingStore } from './browser-session-routing.store';

@Module({
  controllers: [BrowserPublicApiController],
  imports: [
    AgentRegistryModule,
    OperatorAccessModule,
    DesktopBrowserRuntimeModule,
    SitesConfigModule,
  ],
  providers: [BrowserPublicApiService, BrowserSessionRoutingStore],
})
export class BrowserPublicApiModule {}
