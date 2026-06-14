import { Body, Controller, Get, Post } from '@nestjs/common';
// biome-ignore lint/style/useImportType: constructor injection token
import { SitesConfigService } from '../sites-config/sites-config.service';
import type {
  BrowserPendingAuthReason,
  BrowserProfileRegistryEntry,
} from './browser-automation.types';
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserPendingAuthTaskService } from './browser-pending-auth-task.service';
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserProfileRegistryService } from './browser-profile-registry.service';

@Controller('api/browser')
export class BrowserAutomationController {
  constructor(
    private readonly siteConfig: SitesConfigService,
    private readonly profileRegistry: BrowserProfileRegistryService,
    private readonly pendingAuthTasks: BrowserPendingAuthTaskService,
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
      profiles: this.profileRegistry.list(),
    };
  }

  @Get('/pending-auth-tasks')
  listPendingAuthTasks() {
    return {
      tasks: this.pendingAuthTasks.list(),
    };
  }

  @Post('/profiles')
  reportProfile(@Body() body: BrowserProfileRegistryEntry) {
    const profile = this.profileRegistry.upsert(body);
    if (profile.status === 'verified') {
      this.pendingAuthTasks.resolve(
        profile.agentId,
        profile.siteId,
        profile.profileName,
      );
    }
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
      task: this.pendingAuthTasks.upsert(body),
    };
  }
}
