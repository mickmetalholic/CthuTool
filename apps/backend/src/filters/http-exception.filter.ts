import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

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
    const body =
      exceptionBody && typeof exceptionBody === 'object'
        ? {
            ...(exceptionBody as Record<string, unknown>),
            timestamp: new Date().toISOString(),
          }
        : {
            code: status === HttpStatus.NOT_FOUND ? 'NOT_FOUND' : 'HTTP_ERROR',
            message:
              status === HttpStatus.NOT_FOUND
                ? 'Route not found'
                : 'Request failed',
            timestamp: new Date().toISOString(),
          };

    response.status(status).json(body);
  }
}
