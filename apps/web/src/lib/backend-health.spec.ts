import { loadBackendHealth } from './backend-health';
import type { WebLogger } from './observability';

describe('backend health API observability', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('loads backend health through observable API diagnostics', async () => {
    const logger = createLogger();
    global.fetch = vi.fn(async () =>
      Response.json(
        {
          service: 'backend',
          status: 'ok',
          timestamp: '2026-06-24T00:00:00.000Z',
        },
        {
          headers: { 'x-request-id': 'backend-request-1' },
          status: 200,
        },
      ),
    ) as typeof fetch;

    await expect(
      loadBackendHealth({
        baseUrl: 'https://backend.example.test',
        logger,
      }),
    ).resolves.toEqual({
      checkedAt: '2026-06-24T00:00:00.000Z',
      httpStatus: 200,
      service: 'backend',
      status: 'ok',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      new URL('https://backend.example.test/health'),
      expect.objectContaining({ cache: 'no-store' }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'backend.health.check',
        backendRequestId: 'backend-request-1',
        event: 'api.request_succeeded',
        route: '/health',
        status: 200,
      }),
    );
  });

  it('reports network failure through observable API diagnostics', async () => {
    const logger = createLogger();
    global.fetch = vi.fn(async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;

    await expect(
      loadBackendHealth({
        baseUrl: 'https://backend.example.test',
        logger,
      }),
    ).resolves.toEqual({
      errorCode: 'TypeError',
      status: 'unavailable',
    });

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'backend.health.check',
        errorCode: 'TypeError',
        event: 'api.request_error',
        route: '/health',
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
