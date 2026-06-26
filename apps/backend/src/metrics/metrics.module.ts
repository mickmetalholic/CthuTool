import { Global, Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { BackendMetricsService } from './metrics.service';

@Global()
@Module({
  controllers: [MetricsController],
  exports: [BackendMetricsService],
  providers: [BackendMetricsService],
})
export class MetricsModule {}
