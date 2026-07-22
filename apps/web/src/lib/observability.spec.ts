import {
  createWebClientEventReporter,
  createWebLogger,
  redactDetails,
  sanitizeEvent,
} from './observability';

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
    expect(sink.warn).toHaveBeenCalledWith(
      '[cthutool:web]',
      expect.objectContaining({ source: 'cthutool.web' }),
    );
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
        launchEndpoint: 'http://127.0.0.1:4567',
        launchTicket: 'ticket-value',
        screenshotBase64: 'abc123',
      }),
    ).toEqual({
      cookie: '[Redacted]',
      html: '[Redacted]',
      nested: {
        safe: 'kept',
        token: '[Redacted]',
      },
      launchEndpoint: '[Redacted]',
      launchTicket: '[Redacted]',
      screenshotBase64: '[Redacted]',
    });
  });

  it('removes bridge fragments and bearer values from scalar telemetry', () => {
    expect(
      sanitizeEvent({
        event: 'agent.bridge_failed',
        level: 'warn',
        message:
          'Open https://app.example.com/agent#endpoint=http://127.0.0.1:4123&ticket=super-secret with Bearer session-secret',
        scope: 'web.agent',
      }).message,
    ).toBe(
      'Open https://app.example.com/agent#[Redacted] with Bearer [Redacted]',
    );
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
      source: 'cthutool.web',
    });
  });

  it('reports sanitized warn and error events to the configured backend endpoint', () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 202 }));
    const reporter = createWebClientEventReporter({
      endpoint: 'http://localhost:3000/api/client-events',
      fetch: fetchImpl as typeof fetch,
    });
    const logger = createWebLogger('web.test', {
      clientEventReporter: reporter,
      console: createSink(),
      environment: 'test',
    });

    logger.warn({
      details: {
        safe: 'visible',
        token: 'secret',
      },
      event: 'ui.warning',
      message: 'warning',
      route: '/projects?token=secret',
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:3000/api/client-events',
      expect.objectContaining({
        body: expect.any(String),
        keepalive: true,
        method: 'POST',
      }),
    );
    const [, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(JSON.parse(init.body as string)).toEqual(
      expect.objectContaining({
        details: {
          safe: 'visible',
          token: '[Redacted]',
        },
        event: 'ui.warning',
        level: 'warn',
        route: '/projects',
        source: 'cthutool.web',
      }),
    );
  });

  it('does not report events below the remote reporter threshold', () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 202 }));
    const reporter = createWebClientEventReporter({
      endpoint: 'http://localhost:3000/api/client-events',
      fetch: fetchImpl as typeof fetch,
      minLevel: 'error',
    });
    reporter.report({
      event: 'ui.warning',
      level: 'warn',
      message: 'warning',
      scope: 'web.test',
    });

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('swallows client event reporter failures', () => {
    const reporter = createWebClientEventReporter({
      endpoint: 'http://localhost:3000/api/client-events',
      fetch: vi.fn(async () => {
        throw new TypeError('network failed');
      }) as typeof fetch,
    });

    expect(() =>
      reporter.report({
        event: 'ui.error',
        level: 'error',
        message: 'failed',
        scope: 'web.test',
      }),
    ).not.toThrow();
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
