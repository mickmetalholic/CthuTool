import {
  Global,
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { BackendObservabilityService } from './backend-observability.service';
import { BackendRequestContextMiddleware } from './request-context.middleware';

@Global()
@Module({
  exports: [BackendObservabilityService],
  providers: [BackendObservabilityService, BackendRequestContextMiddleware],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(BackendRequestContextMiddleware).forRoutes('*');
  }
}
