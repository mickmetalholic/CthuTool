import { Module } from '@nestjs/common';

import { StorageModule } from '../storage/storage.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  imports: [StorageModule],
  providers: [DashboardService],
})
export class DashboardModule {}
