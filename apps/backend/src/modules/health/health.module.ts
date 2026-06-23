import { Module } from '@nestjs/common';
import { BrowserContentModule } from '../browser/content/browser-content.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [BrowserContentModule],
  providers: [HealthService],
  controllers: [HealthController],
})
export class HealthModule {}
