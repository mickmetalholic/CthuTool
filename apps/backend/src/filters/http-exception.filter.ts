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

    response.status(status).json({
      code: status === HttpStatus.NOT_FOUND ? 'NOT_FOUND' : 'HTTP_ERROR',
      message:
        status === HttpStatus.NOT_FOUND ? 'Route not found' : 'Request failed',
      timestamp: new Date().toISOString(),
    });
  }
}
