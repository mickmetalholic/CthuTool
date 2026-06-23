import {
  createWebLogger,
  extractBackendRequestId,
  normalizeError,
  type WebLogger,
  type WebObservabilityDetails,
} from './observability';

export type ObservableFetchOptions = RequestInit & {
  readonly action: string;
  readonly details?: WebObservabilityDetails;
  readonly logger?: WebLogger;
  readonly route?: string;
};

const defaultApiLogger = createWebLogger('web.api');

export async function observableFetch(
  input: RequestInfo | URL,
  options: ObservableFetchOptions,
): Promise<Response> {
  const {
    action,
    details,
    logger = defaultApiLogger,
    route,
    ...init
  } = options;
  const startedAt = performance.now();
  const requestRoute = route ?? routeFromRequest(input);

  try {
    const response = await fetch(input, init);
    const durationMs = performance.now() - startedAt;
    const backendRequestId = extractBackendRequestId(response);
    const event = response.ok ? 'api.request_succeeded' : 'api.request_failed';
    const message = response.ok
      ? 'API request completed'
      : 'API request failed';
    const payload = {
      action,
      backendRequestId,
      details,
      durationMs,
      event,
      message,
      route: requestRoute,
      status: response.status,
    };

    if (response.ok) {
      logger.info(payload);
    } else {
      logger.warn({
        ...payload,
        errorCode: `HTTP_${response.status}`,
      });
    }

    return response;
  } catch (error) {
    const durationMs = performance.now() - startedAt;
    const normalized = normalizeError(error);
    logger.error({
      action,
      details,
      durationMs,
      errorCode: normalized.name,
      event: 'api.request_error',
      message: normalized.message,
      route: requestRoute,
    });
    throw error;
  }
}

function routeFromRequest(input: RequestInfo | URL): string | undefined {
  if (typeof input === 'string') {
    return normalizeRoute(input);
  }
  if (input instanceof URL) {
    return input.pathname;
  }
  return normalizeRoute(input.url);
}

function normalizeRoute(value: string): string {
  try {
    return new URL(value, 'https://cthutool.local').pathname;
  } catch {
    return value.split('?')[0] ?? value;
  }
}
