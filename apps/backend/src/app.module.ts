import { Module } from '@nestjs/common';
import { BrowserAutomationModule } from './modules/browser-automation/browser-automation.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [BrowserAutomationModule, HealthModule],
})
export class AppModule {}
