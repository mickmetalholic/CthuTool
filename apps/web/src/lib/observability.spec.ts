import { createWebLogger, redactDetails, sanitizeEvent } from './observability';

describe('web observability logger', () => {
  it('filters debug and info in production by default', () => {
    const sink = createSink();
    const logger = createWebLogger('web.test', {
      console: sink,
      environment: 'production',
    });

    logger.debug({ event: 'debug.event', message: 'debug' });
    logger.info({ event: 'info.event', message: 'info' });
    logger.warn({ event: 'warn.event', message: 'warn' });

    expect(sink.debug).not.toHaveBeenCalled();
    expect(sink.info).not.toHaveBeenCalled();
    expect(sink.warn).toHaveBeenCalledTimes(1);
  });

  it('redacts sensitive diagnostic details', () => {
    expect(
      redactDetails({
        cookie: 'session=value',
        html: '<html>secret</html>',
        nested: {
          token: 'abc',
          safe: 'kept',
        },
        screenshotBase64: 'abc123',
      }),
    ).toEqual({
      cookie: '[Redacted]',
      html: '[Redacted]',
      nested: {
        safe: 'kept',
        token: '[Redacted]',
      },
      screenshotBase64: '[Redacted]',
    });
  });

  it('sanitizes route and bounded string fields', () => {
    expect(
      sanitizeEvent({
        event: 'api.request_failed',
        level: 'warn',
        message: 'failed',
        route: 'https://example.com/api/items?token=secret',
        scope: 'web.api',
      }),
    ).toMatchObject({
      route: '/api/items',
    });
  });
});

function createSink() {
  return {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };
}
