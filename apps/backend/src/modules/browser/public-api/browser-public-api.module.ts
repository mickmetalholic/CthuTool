import { Module } from '@nestjs/common';
import { SitesConfigModule } from '../../sites-config/sites-config.module';
import { DesktopBrowserRuntimeModule } from '../desktop-runtime/desktop-browser-runtime.module';
import { BrowserPublicApiController } from './browser-public-api.controller';
import { BrowserPublicApiService } from './browser-public-api.service';
import { BrowserSessionRoutingStore } from './browser-session-routing.store';

@Module({
  controllers: [BrowserPublicApiController],
  imports: [DesktopBrowserRuntimeModule, SitesConfigModule],
  providers: [BrowserPublicApiService, BrowserSessionRoutingStore],
})
export class BrowserPublicApiModule {}
