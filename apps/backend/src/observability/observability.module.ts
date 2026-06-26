import {
  Global,
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { MetricsModule } from '../metrics';
import { BackendObservabilityService } from './backend-observability.service';
import { ClientEventsController } from './client-events.controller';
import { ClientEventsService } from './client-events.service';
import { BackendRequestContextMiddleware } from './request-context.middleware';

@Global()
@Module({
  controllers: [ClientEventsController],
  imports: [MetricsModule],
  exports: [BackendObservabilityService],
  providers: [
    BackendObservabilityService,
    BackendRequestContextMiddleware,
    ClientEventsService,
  ],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(BackendRequestContextMiddleware).forRoutes('*');
  }
}
