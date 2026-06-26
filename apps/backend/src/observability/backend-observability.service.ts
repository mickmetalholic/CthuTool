import { Inject, Injectable, Optional } from '@nestjs/common';
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

export type BackendStructuredLogRecord = {
  readonly service: 'backend';
  readonly source: 'cthutool.backend';
  readonly level: BackendObservabilityEventLevel;
  readonly event: string;
  readonly message: string;
  readonly timestamp: string;
  readonly requestId?: string;
  readonly traceId?: string;
  readonly parentId?: string;
  readonly startedAt?: string;
  readonly method?: string;
  readonly path?: string;
  readonly status?: number;
  readonly durationMs?: number;
  readonly errorCode?: string;
  readonly commandId?: string;
  readonly operation?: string;
  readonly details?: Record<string, unknown>;
};

export type BackendObservabilitySink = {
  readonly stdout: (line: string) => void;
  readonly stderr: (line: string) => void;
};

const PROMOTED_DETAIL_KEYS = new Set([
  'commandId',
  'durationMs',
  'errorCode',
  'method',
  'operation',
  'path',
  'status',
]);

const defaultSink: BackendObservabilitySink = {
  stderr: (line) => process.stderr.write(`${line}\n`),
  stdout: (line) => process.stdout.write(`${line}\n`),
};

export const BACKEND_OBSERVABILITY_SINK = 'BACKEND_OBSERVABILITY_SINK';

@Injectable()
export class BackendObservabilityService {
  private readonly sink: BackendObservabilitySink;

  constructor(
    @Optional()
    @Inject(BACKEND_OBSERVABILITY_SINK)
    sink?: BackendObservabilitySink,
  ) {
    this.sink = sink ?? defaultSink;
  }

  record(input: BackendObservabilityEvent): void {
    const record = createBackendStructuredLogRecord(input);
    const line = JSON.stringify(record);

    if (record.level === 'info') {
      this.sink.stdout(line);
      return;
    }
    this.sink.stderr(line);
  }
}

export function createBackendStructuredLogRecord(
  input: BackendObservabilityEvent,
): BackendStructuredLogRecord {
  const context = input.context ?? getCurrentRequestContext();
  const details = normalizeDetails(input.details);
  const promoted = promoteDetails(details);
  return stripUndefined({
    service: 'backend',
    source: 'cthutool.backend',
    level: input.level ?? 'info',
    event: sanitizeString(input.event, 'backend.event'),
    message: sanitizeString(input.message, 'backend observability event'),
    timestamp: new Date().toISOString(),
    requestId: context?.requestId,
    traceId: context?.traceId,
    parentId: context?.parentId,
    startedAt: context?.startedAt,
    method: promoted.method ?? context?.method,
    path: promoted.path ?? context?.path,
    status: promoted.status,
    durationMs: promoted.durationMs,
    errorCode: promoted.errorCode,
    commandId: promoted.commandId,
    operation: promoted.operation,
    details: Object.keys(promoted.details).length
      ? promoted.details
      : undefined,
  });
}

function normalizeDetails(
  details: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!details) {
    return {};
  }
  const redacted = redactDetails(details);
  return isRecord(redacted) ? redacted : {};
}

function promoteDetails(details: Record<string, unknown>): {
  readonly commandId?: string;
  readonly details: Record<string, unknown>;
  readonly durationMs?: number;
  readonly errorCode?: string;
  readonly method?: string;
  readonly operation?: string;
  readonly path?: string;
  readonly status?: number;
} {
  const remaining: Record<string, unknown> = {};
  let commandId: string | undefined;
  let durationMs: number | undefined;
  let errorCode: string | undefined;
  let method: string | undefined;
  let operation: string | undefined;
  let path: string | undefined;
  let status: number | undefined;

  for (const [key, value] of Object.entries(details)) {
    if (!PROMOTED_DETAIL_KEYS.has(key)) {
      remaining[key] = value;
      continue;
    }
    if (key === 'commandId') {
      commandId = scalarString(value);
      continue;
    }
    if (key === 'durationMs') {
      durationMs = scalarNumber(value);
      continue;
    }
    if (key === 'errorCode') {
      errorCode = scalarString(value);
      continue;
    }
    if (key === 'method') {
      method = scalarString(value);
      continue;
    }
    if (key === 'operation') {
      operation = scalarString(value);
      continue;
    }
    if (key === 'path') {
      path = scalarString(value);
      continue;
    }
    if (key === 'status') {
      status = scalarNumber(value);
    }
  }

  return {
    commandId,
    details: remaining,
    durationMs,
    errorCode,
    method,
    operation,
    path,
    status,
  };
}

function scalarString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

function scalarNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return undefined;
}

function sanitizeString(value: string | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value : fallback;
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
