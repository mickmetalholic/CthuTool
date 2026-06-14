import { Body, Controller, Get, Post } from '@nestjs/common';
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserAuthService } from '../browser-auth/browser-auth.service';
// biome-ignore lint/style/useImportType: constructor injection token
import { SitesConfigService } from '../sites-config/sites-config.service';
import type {
  BrowserPendingAuthReason,
  BrowserProfileRegistryEntry,
} from './browser-automation.types';

@Controller('api/browser')
export class BrowserAutomationController {
  constructor(
    private readonly siteConfig: SitesConfigService,
    private readonly browserAuth: BrowserAuthService,
  ) {}

  @Get('/sites')
  listSites() {
    return {
      sites: this.siteConfig.listSites(),
    };
  }

  @Get('/profiles')
  listProfiles() {
    return {
      profiles: this.browserAuth.listProfiles(),
    };
  }

  @Get('/pending-auth-tasks')
  listPendingAuthTasks() {
    return {
      tasks: this.browserAuth.listPendingAuthTasks(),
    };
  }

  @Post('/profiles')
  reportProfile(@Body() body: BrowserProfileRegistryEntry) {
    const profile = this.browserAuth.reportProfile(body);
    return {
      profile,
    };
  }

  @Post('/pending-auth-tasks')
  reportPendingAuthTask(
    @Body()
    body: {
      readonly agentId: string;
      readonly siteId: string;
      readonly profileName: string;
      readonly reason: BrowserPendingAuthReason;
      readonly loginUrl?: string;
      readonly verifyUrl?: string;
    },
  ) {
    return {
      task: this.browserAuth.reportPendingAuthTask(body),
    };
  }
}
