import type { WebLogger } from './observability';
import { observableFetch } from './observable-fetch';

export type BackendHealthSummary = {
  readonly checkedAt?: string;
  readonly errorCode?: string;
  readonly httpStatus?: number;
  readonly service?: string;
  readonly status: 'ok' | 'unavailable';
};

const DEFAULT_BACKEND_URL = 'http://localhost:3000';

export async function loadBackendHealth(
  options: { readonly baseUrl?: string; readonly logger?: WebLogger } = {},
): Promise<BackendHealthSummary> {
  const baseUrl =
    options.baseUrl ??
    process.env.CTHUTOOL_BACKEND_URL ??
    process.env.NEXT_PUBLIC_CTHUTOOL_BACKEND_URL ??
    DEFAULT_BACKEND_URL;

  try {
    const response = await observableFetch(new URL('/health', baseUrl), {
      action: 'backend.health.check',
      cache: 'no-store',
      logger: options.logger,
      route: '/health',
    });
    if (!response.ok) {
      return {
        errorCode: `HTTP_${response.status}`,
        httpStatus: response.status,
        status: 'unavailable',
      };
    }

    const body = (await response.json()) as {
      readonly service?: unknown;
      readonly status?: unknown;
      readonly timestamp?: unknown;
    };
    return {
      checkedAt:
        typeof body.timestamp === 'string' ? body.timestamp : undefined,
      httpStatus: response.status,
      service: typeof body.service === 'string' ? body.service : undefined,
      status: body.status === 'ok' ? 'ok' : 'unavailable',
    };
  } catch (error) {
    return {
      errorCode: error instanceof Error ? error.name : 'UnknownError',
      status: 'unavailable',
    };
  }
}
