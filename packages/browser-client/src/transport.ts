import { BrowserClientError } from './errors';
import type {
  BrowserClientFetch,
  BrowserClientFetchInit,
  BrowserClientFetchResponse,
  BrowserClientHeaders,
} from './types';

export type BrowserHttpTransportOptions = {
  readonly baseUrl: string;
  readonly headers?: BrowserClientHeaders;
  readonly fetch?: BrowserClientFetch;
  readonly signal?: AbortSignal;
};

type RequestOptions = {
  readonly method: 'DELETE' | 'GET' | 'POST';
  readonly path: string;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
};

export class BrowserHttpTransport {
  private readonly baseUrl: string;
  private readonly headers: BrowserClientHeaders;
  private readonly fetchImpl: BrowserClientFetch;
  private readonly signal?: AbortSignal;

  constructor(options: BrowserHttpTransportOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.headers = options.headers ?? {};
    this.fetchImpl = options.fetch ?? getGlobalFetch();
    this.signal = options.signal;
  }

  async requestJson<T>(options: RequestOptions): Promise<T> {
    const init = this.createFetchInit(options);
    let response: BrowserClientFetchResponse;

    try {
      response = await this.fetchImpl(this.createUrl(options.path), init);
    } catch (error) {
      throw new BrowserClientError({
        cause: error,
        code: 'TRANSPORT_ERROR',
        message: `Browser API request failed: ${formatUnknownError(error)}`,
      });
    }

    if (!response.ok) {
      throw await createBackendError(response);
    }

    const text = await response.text();
    if (text.length === 0) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch (error) {
      throw new BrowserClientError({
        cause: error,
        code: 'MALFORMED_RESPONSE',
        message: 'Browser API response was not valid JSON',
        status: response.status,
      });
    }
  }

  private createFetchInit(options: RequestOptions): BrowserClientFetchInit {
    return {
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      headers: {
        accept: 'application/json',
        ...(options.body === undefined
          ? {}
          : { 'content-type': 'application/json' }),
        ...this.headers,
      },
      method: options.method,
      signal: options.signal ?? this.signal,
    };
  }

  private createUrl(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
}

async function createBackendError(
  response: Awaited<ReturnType<BrowserClientFetch>>,
): Promise<BrowserClientError> {
  const text = await response.text();
  const body = parseOptionalJson(text);
  const details = normalizeBackendError(body);

  return new BrowserClientError({
    code: details.code,
    message: details.message,
    metadata: details.metadata,
    status: response.status,
  });
}

function normalizeBackendError(value: unknown): {
  readonly code: string;
  readonly message: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
} {
  if (!isRecord(value)) {
    return { code: 'BACKEND_ERROR', message: 'Browser API request failed' };
  }

  const nested = isRecord(value.error) ? value.error : value;
  const code =
    readString(nested.code) ??
    readString(value.code) ??
    readString(value.error) ??
    'BACKEND_ERROR';
  const message =
    readString(nested.message) ??
    readString(value.message) ??
    'Browser API request failed';
  const metadata = isRecord(nested.metadata)
    ? nested.metadata
    : isRecord(nested.details)
      ? nested.details
      : undefined;

  return { code, message, metadata };
}

function parseOptionalJson(text: string): unknown {
  if (text.trim().length === 0) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (trimmed.length === 0) {
    throw new BrowserClientError({
      code: 'MALFORMED_RESPONSE',
      message: 'Browser client baseUrl must not be empty',
    });
  }
  return trimmed.replace(/\/+$/, '');
}

function getGlobalFetch(): BrowserClientFetch {
  if (typeof globalThis.fetch !== 'function') {
    throw new BrowserClientError({
      code: 'TRANSPORT_ERROR',
      message: 'No fetch implementation is available',
    });
  }
  return globalThis.fetch as unknown as BrowserClientFetch;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
