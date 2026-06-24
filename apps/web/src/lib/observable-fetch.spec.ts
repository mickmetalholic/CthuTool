import type { WebLogger } from './observability';
import { observableFetch } from './observable-fetch';

describe('observableFetch', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('records successful API correlation metadata', async () => {
    const logger = createLogger();
    global.fetch = vi.fn(
      async () =>
        new Response(null, {
          headers: {
            'x-request-id': 'backend-request-1',
          },
          status: 204,
        }),
    ) as typeof fetch;

    await observableFetch('/api/health?token=secret', {
      action: 'health.check',
      logger,
    });

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'health.check',
        backendRequestId: 'backend-request-1',
        event: 'api.request_succeeded',
        route: '/api/health',
        status: 204,
      }),
    );
  });

  it('records failed API metadata without backend request id', async () => {
    const logger = createLogger();
    global.fetch = vi.fn(
      async () => new Response(null, { status: 503 }),
    ) as typeof fetch;

    await observableFetch('/api/health', {
      action: 'health.check',
      logger,
    });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'health.check',
        backendRequestId: undefined,
        errorCode: 'HTTP_503',
        event: 'api.request_failed',
        route: '/api/health',
        status: 503,
      }),
    );
  });

  it('records network failure metadata', async () => {
    const logger = createLogger();
    global.fetch = vi.fn(async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;

    await expect(
      observableFetch('/api/health', {
        action: 'health.check',
        logger,
      }),
    ).rejects.toThrow('fetch failed');

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'health.check',
        errorCode: 'TypeError',
        event: 'api.request_error',
        route: '/api/health',
      }),
    );
  });
});

function createLogger(): WebLogger {
  return {
    child: vi.fn(() => createLogger()),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };
}
