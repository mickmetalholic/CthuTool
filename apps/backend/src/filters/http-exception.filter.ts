import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { getCurrentRequestContext } from '../observability';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionBody =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const requestContext = getCurrentRequestContext();
    const body: Record<string, unknown> =
      status === HttpStatus.NOT_FOUND
        ? {
            code: 'NOT_FOUND',
            message: 'Route not found',
            ...(requestContext ? { requestId: requestContext.requestId } : {}),
            timestamp: new Date().toISOString(),
          }
        : exceptionBody && typeof exceptionBody === 'object'
          ? {
              ...(exceptionBody as Record<string, unknown>),
              ...(requestContext
                ? { requestId: requestContext.requestId }
                : {}),
              timestamp: new Date().toISOString(),
            }
          : {
              code:
                status === HttpStatus.NOT_FOUND ? 'NOT_FOUND' : 'HTTP_ERROR',
              message:
                status === HttpStatus.NOT_FOUND
                  ? 'Route not found'
                  : 'Request failed',
              ...(requestContext
                ? { requestId: requestContext.requestId }
                : {}),
              timestamp: new Date().toISOString(),
            };

    if (typeof body.code === 'string' && response.locals) {
      response.locals.errorCode = body.code;
    }
    response.status(status).json(body);
  }
}
