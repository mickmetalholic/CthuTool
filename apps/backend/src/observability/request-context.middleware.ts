import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
// Nest DI needs runtime class reference; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BackendMetricsService } from '../metrics';
// Nest DI needs runtime class reference; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BackendObservabilityService } from './backend-observability.service';
import {
  createRequestContext,
  REQUEST_ID_HEADER,
  runWithRequestContext,
} from './request-context';

@Injectable()
export class BackendRequestContextMiddleware implements NestMiddleware {
  constructor(
    private readonly observability: BackendObservabilityService,
    private readonly metrics: BackendMetricsService,
  ) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const context = createRequestContext(request);
    response.setHeader(REQUEST_ID_HEADER, context.requestId);

    runWithRequestContext(context, () => {
      response.on('finish', () => {
        const durationMs = Date.now() - context.startedAtMs;
        const status = response.statusCode;
        const errorCode =
          typeof response.locals.errorCode === 'string'
            ? response.locals.errorCode
            : undefined;
        this.observability.record({
          event:
            status >= 500 ? 'http.request_failed' : 'http.request_completed',
          level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
          context,
          details: {
            durationMs,
            errorCode,
            method: context.method,
            path: context.path,
            status,
          },
        });
        this.metrics.recordHttpRequest({
          durationMs,
          method: context.method,
          path: context.path,
          status,
        });
      });
      next();
    });
  }
}
