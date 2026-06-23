export const WEB_OBSERVABILITY_LEVELS = [
  'debug',
  'info',
  'warn',
  'error',
] as const;

export type WebObservabilityLevel = (typeof WEB_OBSERVABILITY_LEVELS)[number];

export type WebObservabilityDetails = Record<string, unknown>;

export type WebObservabilityEvent = {
  readonly level: WebObservabilityLevel;
  readonly scope: string;
  readonly event: string;
  readonly message: string;
  readonly action?: string;
  readonly backendRequestId?: string;
  readonly durationMs?: number;
  readonly errorCode?: string;
  readonly requestId?: string;
  readonly route?: string;
  readonly status?: number;
  readonly traceId?: string;
  readonly details?: WebObservabilityDetails;
};

export type WebLoggerOptions = {
  readonly console?: WebConsoleSink;
  readonly environment?: 'development' | 'production' | 'test';
  readonly minLevel?: WebObservabilityLevel;
};

export type WebLogger = {
  readonly debug: (input: WebLogInput) => void;
  readonly error: (input: WebLogInput) => void;
  readonly info: (input: WebLogInput) => void;
  readonly warn: (input: WebLogInput) => void;
  readonly child: (scope: string) => WebLogger;
};

export type WebLogInput = Omit<WebObservabilityEvent, 'level' | 'scope'> & {
  readonly scope?: string;
};

type WebConsoleSink = Pick<Console, 'debug' | 'error' | 'info' | 'warn'>;

const LEVEL_WEIGHT: Record<WebObservabilityLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const DEFAULT_MAX_STRING_LENGTH = 400;
const DEFAULT_MAX_ARRAY_ITEMS = 20;
const DEFAULT_MAX_OBJECT_KEYS = 30;
const MAX_REDACTION_DEPTH = 4;

const SENSITIVE_KEY_PATTERN =
  /token|secret|password|cookie|authorization|auth|credential|session|storageState|localStorage|html|screenshot|base64|profilePath|profileDir|inputValue|formValue/i;

const REQUEST_ID_HEADERS = [
  'x-request-id',
  'x-correlation-id',
  'x-trace-id',
  'traceparent',
] as const;

const defaultConsole: WebConsoleSink = {
  debug: (...args) => globalThis.console.debug(...args),
  error: (...args) => globalThis.console.error(...args),
  info: (...args) => globalThis.console.info(...args),
  warn: (...args) => globalThis.console.warn(...args),
};

export function createWebLogger(
  scope: string,
  options: WebLoggerOptions = {},
): WebLogger {
  const environment = options.environment ?? resolveEnvironment();
  const minLevel =
    options.minLevel ?? (environment === 'production' ? 'warn' : 'debug');
  const sink = options.console ?? defaultConsole;

  const emit = (
    level: WebObservabilityLevel,
    input: WebLogInput,
    activeScope = scope,
  ) => {
    if (!shouldEmit(level, minLevel)) {
      return;
    }

    const event = sanitizeEvent({
      ...input,
      level,
      scope: input.scope ?? activeScope,
    });
    sink[level]('[cthutool:web]', event);
  };

  return {
    child: (childScope) =>
      createWebLogger(`${scope}.${childScope}`, {
        console: sink,
        environment,
        minLevel,
      }),
    debug: (input) => emit('debug', input),
    error: (input) => emit('error', input),
    info: (input) => emit('info', input),
    warn: (input) => emit('warn', input),
  };
}

export function recordUiWarning(
  logger: WebLogger,
  input: Omit<WebLogInput, 'event' | 'message'> & {
    readonly event?: string;
    readonly message?: string;
  },
): void {
  logger.warn({
    event: input.event ?? 'ui.warning',
    message: input.message ?? 'Recoverable UI warning',
    ...input,
  });
}

export function recordUiError(
  logger: WebLogger,
  error: unknown,
  input: Omit<WebLogInput, 'details' | 'event' | 'message'> & {
    readonly details?: WebObservabilityDetails;
    readonly event?: string;
    readonly message?: string;
  } = {},
): void {
  const normalized = normalizeError(error);
  logger.error({
    event: input.event ?? 'ui.error',
    message: input.message ?? normalized.message,
    ...input,
    details: {
      ...input.details,
      errorName: normalized.name,
    },
    errorCode: input.errorCode ?? normalized.name,
  });
}

export function sanitizeEvent(
  event: WebObservabilityEvent,
): WebObservabilityEvent {
  return stripUndefined({
    ...event,
    action: sanitizeScalar(event.action),
    backendRequestId: sanitizeScalar(event.backendRequestId),
    details: event.details ? redactDetails(event.details) : undefined,
    durationMs: sanitizeNumber(event.durationMs),
    errorCode: sanitizeScalar(event.errorCode),
    event: sanitizeRequiredScalar(event.event, 'unknown.event'),
    message: sanitizeRequiredScalar(event.message, 'No diagnostic message'),
    requestId: sanitizeScalar(event.requestId),
    route: sanitizeRoute(event.route),
    scope: sanitizeRequiredScalar(event.scope, 'web.unknown'),
    status: sanitizeNumber(event.status),
    traceId: sanitizeScalar(event.traceId),
  });
}

export function redactDetails(
  details: WebObservabilityDetails,
): WebObservabilityDetails {
  return redactValue(details, 0) as WebObservabilityDetails;
}

export function extractBackendRequestId(
  response: Response,
): string | undefined {
  for (const header of REQUEST_ID_HEADERS) {
    const value = response.headers.get(header);
    if (value) {
      return sanitizeScalar(value);
    }
  }
  return undefined;
}

export function normalizeError(error: unknown): {
  readonly message: string;
  readonly name: string;
} {
  if (error instanceof Error) {
    return {
      message: sanitizeRequiredScalar(error.message, 'Unexpected error'),
      name: sanitizeRequiredScalar(error.name, 'Error'),
    };
  }
  return {
    message: 'Unexpected error',
    name: 'UnknownError',
  };
}

function shouldEmit(
  level: WebObservabilityLevel,
  minLevel: WebObservabilityLevel,
): boolean {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[minLevel];
}

function resolveEnvironment(): 'development' | 'production' | 'test' {
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  if (process.env.NODE_ENV === 'test') {
    return 'test';
  }
  return 'development';
}

function redactValue(value: unknown, depth: number): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    return sanitizeScalar(value);
  }
  if (typeof value === 'number') {
    return sanitizeNumber(value);
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value instanceof Error) {
    return {
      message: sanitizeScalar(value.message),
      name: sanitizeScalar(value.name),
    };
  }
  if (depth >= MAX_REDACTION_DEPTH) {
    return '[Truncated]';
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, DEFAULT_MAX_ARRAY_ITEMS)
      .map((item) => redactValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, childValue] of Object.entries(value).slice(
      0,
      DEFAULT_MAX_OBJECT_KEYS,
    )) {
      output[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? '[Redacted]'
        : redactValue(childValue, depth + 1);
    }
    return output;
  }
  return String(value);
}

function sanitizeRequiredScalar(value: string, fallback: string): string {
  return sanitizeScalar(value) ?? fallback;
}

function sanitizeScalar(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return undefined;
  }
  return normalized.length > DEFAULT_MAX_STRING_LENGTH
    ? `${normalized.slice(0, DEFAULT_MAX_STRING_LENGTH)}...`
    : normalized;
}

function sanitizeRoute(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const url = new URL(value, 'https://cthutool.local');
    return sanitizeScalar(url.pathname);
  } catch {
    return sanitizeScalar(value.split('?')[0]);
  }
}

function sanitizeNumber(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value)
    : undefined;
}

function stripUndefined<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as T;
}
