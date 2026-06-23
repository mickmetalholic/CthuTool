import { Injectable, Logger } from '@nestjs/common';
import { redactDetails } from './redaction';
import {
  type BackendRequestContext,
  getCurrentRequestContext,
} from './request-context';

export type BackendObservabilityEventLevel = 'info' | 'warn' | 'error';

export type BackendObservabilityEvent = {
  readonly event: string;
  readonly level?: BackendObservabilityEventLevel;
  readonly message?: string;
  readonly context?: BackendRequestContext;
  readonly details?: Record<string, unknown>;
};

@Injectable()
export class BackendObservabilityService {
  private readonly logger = new Logger('BackendObservability');

  record(input: BackendObservabilityEvent): void {
    const level = input.level ?? 'info';
    const payload = {
      event: input.event,
      service: 'backend',
      timestamp: new Date().toISOString(),
      ...(input.context ?? getCurrentRequestContext() ?? {}),
      ...(input.details ? { details: redactDetails(input.details) } : {}),
    };

    if (level === 'error') {
      this.logger.error(
        input.message ?? 'backend observability event',
        payload,
      );
      return;
    }
    if (level === 'warn') {
      this.logger.warn(input.message ?? 'backend observability event', payload);
      return;
    }
    this.logger.log(input.message ?? 'backend observability event', payload);
  }
}
