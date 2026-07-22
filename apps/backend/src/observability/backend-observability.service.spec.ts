import {
  BackendObservabilityService,
  type BackendObservabilitySink,
  createBackendStructuredLogRecord,
} from './backend-observability.service';

describe('BackendObservabilityService', () => {
  it('writes info events as JSON lines to stdout', () => {
    const sink = createSink();
    const service = new BackendObservabilityService(sink);

    service.record({
      event: 'http.request_completed',
      message: 'Request completed',
      context: {
        method: 'GET',
        path: '/health',
        requestId: 'req-1',
        startedAt: '2026-01-01T00:00:00.000Z',
        startedAtMs: 1,
        traceId: 'trace-1',
      },
      details: {
        durationMs: 12,
        status: 200,
      },
    });

    expect(sink.stderr).not.toHaveBeenCalled();
    expect(sink.stdout).toHaveBeenCalledTimes(1);
    const record = parseRecord(sink.stdout.mock.calls[0]?.[0]);
    expect(record).toMatchObject({
      service: 'backend',
      source: 'cthutool.backend',
      level: 'info',
      event: 'http.request_completed',
      message: 'Request completed',
      requestId: 'req-1',
      traceId: 'trace-1',
      method: 'GET',
      path: '/health',
      status: 200,
      durationMs: 12,
    });
    expect(typeof record.timestamp).toBe('string');
  });

  it('writes warnings and errors to stderr', () => {
    const sink = createSink();
    const service = new BackendObservabilityService(sink);

    service.record({ event: 'warn.event', level: 'warn' });
    service.record({ event: 'error.event', level: 'error' });

    expect(sink.stdout).not.toHaveBeenCalled();
    expect(sink.stderr).toHaveBeenCalledTimes(2);
    expect(parseRecord(sink.stderr.mock.calls[0]?.[0])).toMatchObject({
      level: 'warn',
      event: 'warn.event',
    });
    expect(parseRecord(sink.stderr.mock.calls[1]?.[0])).toMatchObject({
      level: 'error',
      event: 'error.event',
    });
  });

  it('promotes common details while keeping safe uncommon details nested', () => {
    const record = createBackendStructuredLogRecord({
      event: 'agent.command_failed',
      level: 'warn',
      details: {
        agentId: 'agent-1',
        commandId: 'cmd-1',
        durationMs: 30,
        errorCode: 'AGENT_NOT_AVAILABLE',
        operation: 'browser.capturePage',
      },
    });

    expect(record).toMatchObject({
      commandId: 'cmd-1',
      durationMs: 30,
      errorCode: 'AGENT_NOT_AVAILABLE',
      operation: 'browser.capturePage',
      details: {
        agentId: 'agent-1',
      },
    });
    expect(record.details).not.toHaveProperty('commandId');
    expect(record.details).not.toHaveProperty('durationMs');
  });

  it('redacts sensitive values from emitted JSON', () => {
    const sink = createSink();
    const service = new BackendObservabilityService(sink);

    service.record({
      event: 'browser.command_failed',
      level: 'warn',
      details: {
        cookie: 'session=secret',
        html: '<html>secret</html>',
        profilePath: '/Users/example/profile',
        screenshotBase64: 'c2VjcmV0',
        storageState: { cookies: ['secret'] },
        agentSecret: 'agent-secret-value',
        operatorPassword: 'operator-password-value',
        operatorSession: 'operator-session-value',
        authorization: 'Bearer operator-token',
        bridgeTicket: 'bridge-ticket-value',
        token: 'secret-token',
        safe: 'visible',
      },
    });

    const raw = sink.stderr.mock.calls[0]?.[0] ?? '';
    expect(raw).toContain('"safe":"visible"');
    expect(raw).not.toContain('session=secret');
    expect(raw).not.toContain('agent-secret-value');
    expect(raw).not.toContain('operator-password-value');
    expect(raw).not.toContain('operator-session-value');
    expect(raw).not.toContain('operator-token');
    expect(raw).not.toContain('bridge-ticket-value');
    expect(raw).not.toContain('<html>secret</html>');
    expect(raw).not.toContain('/Users/example/profile');
    expect(raw).not.toContain('c2VjcmV0');
    expect(raw).not.toContain('secret-token');
    expect(parseRecord(raw).details).toMatchObject({
      cookie: '[redacted]',
      html: '[redacted]',
      profilePath: '[redacted]',
      screenshotBase64: '[redacted]',
      storageState: '[redacted]',
      token: '[redacted]',
      safe: 'visible',
    });
  });
});

function createSink(): BackendObservabilitySink & {
  readonly stderr: ReturnType<typeof vi.fn>;
  readonly stdout: ReturnType<typeof vi.fn>;
} {
  return {
    stderr: vi.fn(),
    stdout: vi.fn(),
  };
}

function parseRecord(line: string | undefined): Record<string, unknown> {
  expect(line).toEqual(expect.any(String));
  return JSON.parse(line ?? '{}') as Record<string, unknown>;
}
