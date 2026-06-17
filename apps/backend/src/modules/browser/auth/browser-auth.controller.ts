import { Controller, Get } from '@nestjs/common';
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserAuthService } from './browser-auth.service';

@Controller('api/browser')
export class BrowserAuthController {
  constructor(private readonly browserAuth: BrowserAuthService) {}

  @Get('/profiles')
  async listProfiles() {
    const profiles = await this.browserAuth.listProfiles();
    return { profiles };
  }

  @Get('/pending-auth-tasks')
  async listPendingAuthTasks() {
    const tasks = await this.browserAuth.listPendingAuthTasks();
    return { tasks };
  }

  @Get('/auth-status')
  async getAuthStatus() {
    return this.browserAuth.getRuntimeStatus();
  }
}
