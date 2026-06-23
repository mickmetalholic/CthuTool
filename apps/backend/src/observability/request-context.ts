import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { AgentObservabilityMetadata } from '@cthutool/agent-protocol';
import type { Request } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';
export const TRACE_ID_HEADER = 'x-trace-id';
export const PARENT_ID_HEADER = 'x-parent-id';
export const ACCEPTED_REQUEST_ID_HEADERS = [
  REQUEST_ID_HEADER,
  'x-correlation-id',
] as const;

const OBSERVABILITY_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

export type BackendRequestContext = {
  readonly requestId: string;
  readonly traceId?: string;
  readonly parentId?: string;
  readonly method: string;
  readonly path: string;
  readonly startedAt: string;
  readonly startedAtMs: number;
};

const requestContextStorage = new AsyncLocalStorage<BackendRequestContext>();

export function getCurrentRequestContext(): BackendRequestContext | undefined {
  return requestContextStorage.getStore();
}

export function runWithRequestContext<T>(
  context: BackendRequestContext,
  callback: () => T,
): T {
  return requestContextStorage.run(context, callback);
}

export function createRequestContext(request: Request): BackendRequestContext {
  const requestId =
    firstValidHeader(request, ACCEPTED_REQUEST_ID_HEADERS) ?? randomUUID();
  const traceId = firstValidHeader(request, [TRACE_ID_HEADER]);
  const parentId = firstValidHeader(request, [PARENT_ID_HEADER]);
  return {
    requestId,
    ...(traceId ? { traceId } : {}),
    ...(parentId ? { parentId } : {}),
    method: request.method,
    path: request.originalUrl ?? request.url,
    startedAt: new Date().toISOString(),
    startedAtMs: Date.now(),
  };
}

export function currentObservabilityMetadata(input: {
  readonly commandId?: string;
  readonly operation?: string;
}): AgentObservabilityMetadata {
  const context = getCurrentRequestContext();
  return {
    ...(context?.requestId ? { requestId: context.requestId } : {}),
    ...(context?.traceId ? { traceId: context.traceId } : {}),
    ...(context?.parentId ? { parentId: context.parentId } : {}),
    ...(input.commandId ? { commandId: input.commandId } : {}),
    ...(input.operation ? { operation: input.operation } : {}),
  };
}

export function isValidObservabilityId(value: string): boolean {
  return OBSERVABILITY_ID_PATTERN.test(value);
}

function firstValidHeader(
  request: Request,
  headers: readonly string[],
): string | undefined {
  for (const header of headers) {
    const value = request.header(header);
    if (value && isValidObservabilityId(value)) {
      return value;
    }
  }
  return undefined;
}
