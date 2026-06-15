import { Module } from '@nestjs/common';
import { BrowserAuthModule } from '../browser-auth/browser-auth.module';
import { BrowserContentModule } from '../browser-content/browser-content.module';
import { SitesConfigModule } from '../sites-config/sites-config.module';
import { BrowserAutomationController } from './browser-automation.controller';

@Module({
  imports: [BrowserAuthModule, BrowserContentModule, SitesConfigModule],
  controllers: [BrowserAutomationController],
  exports: [BrowserAuthModule, BrowserContentModule, SitesConfigModule],
})
export class BrowserAutomationModule {}
