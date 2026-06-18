import { Module } from '@nestjs/common';
import { SitesConfigService } from './sites-config.service';

@Module({
  exports: [SitesConfigService],
  providers: [
    {
      provide: SitesConfigService,
      useFactory: () =>
        SitesConfigService.create({
          sitesFilePath: process.env.BROWSER_SITES_CONFIG_FILE,
        }),
    },
  ],
})
export class SitesConfigModule {}
