import { Module } from '@nestjs/common';
import { AgentRegistryModule } from './modules/agent-registry/agent-registry.module';
import { BrowserAutomationModule } from './modules/browser-automation/browser-automation.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [AgentRegistryModule, BrowserAutomationModule, HealthModule],
})
export class AppModule {}
