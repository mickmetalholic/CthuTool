import { HttpException } from '@nestjs/common';
import type { BackendObservabilityService } from './backend-observability.service';
import { ClientEventsService } from './client-events.service';

describe('ClientEventsService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('logs accepted client events through backend observability', () => {
    const observability = createObservability();
    const service = new ClientEventsService(observability);

    expect(
      service.accept(
        {
          source: 'cthutool.web',
          level: 'error',
          event: 'ui.error_boundary',
          message: 'Route rendering failed',
          route: 'https://example.com/projects?token=secret',
          status: 500,
          details: {
            digest: 'digest-1',
            token: 'secret',
          },
        },
        request(),
      ),
    ).toEqual({ accepted: true });

    expect(observability.record).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'client.event_received',
        level: 'error',
        message: 'Route rendering failed',
        details: expect.objectContaining({
          clientEvent: 'ui.error_boundary',
          clientLevel: 'error',
          clientSource: 'cthutool.web',
          route: '/projects',
          status: 500,
          details: {
            digest: 'digest-1',
            token: '[redacted]',
          },
        }),
      }),
    );
  });

  it('rejects invalid source and does not log accepted event', () => {
    const observability = createObservability();
    const service = new ClientEventsService(observability);

    expect(() =>
      service.accept(
        {
          source: 'other',
          level: 'warn',
          event: 'ui.warning',
          message: 'warning',
        },
        request(),
      ),
    ).toThrow(HttpException);

    expect(observability.record).not.toHaveBeenCalled();
  });

  it('rejects oversized payloads', () => {
    const service = new ClientEventsService(createObservability());

    expect(() =>
      service.accept(
        {
          source: 'cthutool.web',
          level: 'warn',
          event: 'ui.warning',
          message: 'x'.repeat(20_000),
        },
        request(),
      ),
    ).toThrow(HttpException);
  });

  it('rate limits by source and remote address', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const observability = createObservability();
    const service = new ClientEventsService(observability);

    for (let index = 0; index < 120; index += 1) {
      service.accept(validEvent(), request());
    }

    expect(() => service.accept(validEvent(), request())).toThrow(
      HttpException,
    );
    expect(observability.record).toHaveBeenCalledTimes(120);
  });
});

function validEvent() {
  return {
    source: 'cthutool.web',
    level: 'warn',
    event: 'ui.warning',
    message: 'warning',
  };
}

function request() {
  return {
    ip: '127.0.0.1',
    socket: {
      remoteAddress: '127.0.0.1',
    },
  };
}

function createObservability(): BackendObservabilityService & {
  readonly record: ReturnType<typeof vi.fn>;
} {
  return {
    record: vi.fn(),
  } as unknown as BackendObservabilityService & {
    readonly record: ReturnType<typeof vi.fn>;
  };
}
