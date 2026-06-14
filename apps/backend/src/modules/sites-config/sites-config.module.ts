import { Module } from '@nestjs/common';
import { parseBrowserConfiguration } from '../../config/service-configuration';
import { SitesConfigService } from './sites-config.service';

@Module({
  exports: [SitesConfigService],
  providers: [
    {
      provide: SitesConfigService,
      useFactory: () =>
        SitesConfigService.create({
          sitesFilePath: getBrowserConfig().sitesConfigFile,
        }),
    },
  ],
})
export class SitesConfigModule {}

function getBrowserConfig() {
  const result = parseBrowserConfiguration(process.env);
  if (result.isErr()) {
    throw result.error;
  }
  return result.value;
}
