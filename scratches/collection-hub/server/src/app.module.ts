import { Module } from '@nestjs/common';

import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { ImportsModule } from './imports/imports.module';

@Module({
  imports: [DashboardModule, HealthModule, ImportsModule],
})
export class AppModule {}
