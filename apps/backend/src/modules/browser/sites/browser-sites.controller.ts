import { Controller, Get } from '@nestjs/common';
// Nest DI needs runtime class reference; `import type` strips it and breaks metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { SitesConfigService } from '../../sites-config/sites-config.service';

@Controller('api/browser')
export class BrowserSitesController {
  constructor(private readonly siteConfig: SitesConfigService) {}

  @Get('/sites')
  listSites() {
    return {
      sites: this.siteConfig.listSites(),
    };
  }
}
