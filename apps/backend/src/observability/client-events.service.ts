import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';
// Nest DI needs runtime class reference; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BackendObservabilityService } from './backend-observability.service';
import {
  getCurrentRequestContext,
  isValidObservabilityId,
} from './request-context';

export type ClientObservabilitySource =
  | 'cthutool.cli'
  | 'cthutool.desktop'
  | 'cthutool.web';

export type ClientObservabilityLevel = 'debug' | 'info' | 'warn' | 'error';

export type ClientObservabilityEvent = {
  readonly source: ClientObservabilitySource;
  readonly level: ClientObservabilityLevel;
  readonly event: string;
  readonly message: string;
  readonly action?: string;
  readonly backendRequestId?: string;
  readonly details?: Record<string, unknown>;
  readonly durationMs?: number;
  readonly errorCode?: string;
  readonly requestId?: string;
  readonly route?: string;
  readonly scope?: string;
  readonly status?: number;
  readonly timestamp?: string;
  readonly traceId?: string;
};

export type ClientEventAcceptedResponse = {
  readonly accepted: true;
  readonly requestId?: string;
};

const CLIENT_SOURCES = new Set<ClientObservabilitySource>([
  'cthutool.cli',
  'cthutool.desktop',
  'cthutool.web',
]);
const CLIENT_LEVELS = new Set<ClientObservabilityLevel>([
  'debug',
  'info',
  'warn',
  'error',
]);
const MAX_PAYLOAD_BYTES = 16 * 1024;
const MAX_STRING_LENGTH = 400;
const MAX_DETAILS_DEPTH = 4;
const MAX_DETAILS_KEYS = 30;
const MAX_ARRAY_ITEMS = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_EVENTS = 120;
const SENSITIVE_KEY_PATTERN =
  /token|secret|password|cookie|authorization|auth|credential|session|storageState|localStorage|html|screenshot|base64|profilePath|profileDir|inputValue|formValue/i;

type RateLimitBucket = {
  readonly resetAt: number;
  count: number;
};

@Injectable()
export class ClientEventsService {
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(private readonly observability: BackendObservabilityService) {}

  accept(
    body: unknown,
    request: Pick<Request, 'ip'> & {
      readonly socket?: { readonly remoteAddress?: string };
    },
  ): ClientEventAcceptedResponse {
    assertPayloadSize(body);
    const event = parseClientEvent(body);
    this.assertWithinRateLimit(event.source, remoteAddress(request));

    this.observability.record({
      event: 'client.event_received',
      level: mapClientLevel(event.level),
      message: event.message,
      details: {
        action: event.action,
        backendRequestId: event.backendRequestId,
        clientEvent: event.event,
        clientLevel: event.level,
        clientRequestId: event.requestId,
        clientSource: event.source,
        clientTimestamp: event.timestamp,
        clientTraceId: event.traceId,
        details: event.details,
        durationMs: event.durationMs,
        errorCode: event.errorCode,
        route: event.route,
        scope: event.scope,
        status: event.status,
      },
    });

    return {
      accepted: true,
      requestId: getCurrentRequestContext()?.requestId,
    };
  }

  private assertWithinRateLimit(
    source: ClientObservabilitySource,
    address: string,
  ): void {
    const now = Date.now();
    const key = `${source}:${address}`;
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW_MS,
      });
      return;
    }
    current.count += 1;
    if (current.count <= RATE_LIMIT_MAX_EVENTS) {
      return;
    }
    throw new HttpException(
      {
        code: 'CLIENT_EVENT_RATE_LIMITED',
        message: 'Client event rate limit exceeded',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

function assertPayloadSize(value: unknown): void {
  const size = Buffer.byteLength(JSON.stringify(value), 'utf8');
  if (size <= MAX_PAYLOAD_BYTES) {
    return;
  }
  throw new HttpException(
    {
      code: 'CLIENT_EVENT_PAYLOAD_TOO_LARGE',
      message: 'Client event payload exceeds the maximum size',
    },
    HttpStatus.PAYLOAD_TOO_LARGE,
  );
}

function parseClientEvent(value: unknown): ClientObservabilityEvent {
  if (!isRecord(value)) {
    throw invalidEvent('Client event body must be a JSON object');
  }

  const source = value.source;
  const level = value.level;
  if (!isClientSource(source)) {
    throw invalidEvent('Client event source is not supported');
  }
  if (!isClientLevel(level)) {
    throw invalidEvent('Client event level is not supported');
  }

  return stripUndefined({
    source,
    level,
    event: requiredString(value.event, 'Client event name is required'),
    message: requiredString(value.message, 'Client event message is required'),
    action: optionalString(value.action),
    backendRequestId: optionalObservabilityId(value.backendRequestId),
    details: isRecord(value.details)
      ? sanitizeDetails(value.details, 0)
      : undefined,
    durationMs: optionalNumber(value.durationMs),
    errorCode: optionalString(value.errorCode),
    requestId: optionalObservabilityId(value.requestId),
    route: sanitizeRoute(value.route),
    scope: optionalString(value.scope),
    status: optionalInteger(value.status),
    timestamp: optionalString(value.timestamp),
    traceId: optionalObservabilityId(value.traceId),
  });
}

function invalidEvent(message: string): HttpException {
  return new HttpException(
    {
      code: 'CLIENT_EVENT_INVALID',
      message,
    },
    HttpStatus.BAD_REQUEST,
  );
}

function isClientSource(value: unknown): value is ClientObservabilitySource {
  return typeof value === 'string' && CLIENT_SOURCES.has(value as never);
}

function isClientLevel(value: unknown): value is ClientObservabilityLevel {
  return typeof value === 'string' && CLIENT_LEVELS.has(value as never);
}

function requiredString(value: unknown, message: string): string {
  const normalized = optionalString(value);
  if (!normalized) {
    throw invalidEvent(message);
  }
  return normalized;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return undefined;
  }
  return normalized.length > MAX_STRING_LENGTH
    ? `${normalized.slice(0, MAX_STRING_LENGTH)}...`
    : normalized;
}

function optionalObservabilityId(value: unknown): string | undefined {
  const normalized = optionalString(value);
  return normalized && isValidObservabilityId(normalized)
    ? normalized
    : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value)
    : undefined;
}

function optionalInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value)
    ? value
    : undefined;
}

function sanitizeRoute(value: unknown): string | undefined {
  const normalized = optionalString(value);
  if (!normalized) {
    return undefined;
  }
  try {
    return optionalString(
      new URL(normalized, 'https://cthutool.local').pathname,
    );
  } catch {
    return normalized.split('?')[0];
  }
}

function sanitizeDetails(
  value: Record<string, unknown>,
  depth: number,
): Record<string, unknown> {
  if (depth >= MAX_DETAILS_DEPTH) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, MAX_DETAILS_KEYS)
      .map(([key, child]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key)
          ? '[redacted]'
          : sanitizeDetailValue(child, depth + 1),
      ]),
  );
}

function sanitizeDetailValue(value: unknown, depth: number): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    return optionalString(value);
  }
  if (typeof value === 'number') {
    return optionalNumber(value);
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeDetailValue(item, depth + 1));
  }
  if (isRecord(value)) {
    return sanitizeDetails(value, depth);
  }
  return String(value);
}

function mapClientLevel(
  level: ClientObservabilityLevel,
): 'info' | 'warn' | 'error' {
  return level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info';
}

function remoteAddress(
  request: Pick<Request, 'ip'> & {
    readonly socket?: { readonly remoteAddress?: string };
  },
): string {
  return request.ip || request.socket?.remoteAddress || 'unknown';
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
