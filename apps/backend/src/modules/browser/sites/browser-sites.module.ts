import { Module } from '@nestjs/common';
import { SitesConfigModule } from '../../sites-config/sites-config.module';
import { BrowserSitesController } from './browser-sites.controller';

@Module({
  controllers: [BrowserSitesController],
  imports: [SitesConfigModule],
})
export class BrowserSitesModule {}
