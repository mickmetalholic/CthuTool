import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns ok status payload with ISO timestamp', () => {
    const service = new HealthService();

    const result = service.getStatus();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('backend');
    expect(typeof result.timestamp).toBe('string');
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('returns degraded readiness when browser agent is unavailable', async () => {
    const observability = { record: jest.fn() };
    const service = new HealthService(
      {
        getStatus: jest.fn(async () => ({
          agentId: 'unknown',
          available: false,
        })),
      } as never,
      {
        getStatus: jest.fn(() => ({
          diagnosticsDir: './data/browser-diagnostics',
          enabled: true,
        })),
      } as never,
      observability as never,
    );

    await expect(service.getReadiness()).resolves.toMatchObject({
      status: 'degraded',
      checks: {
        browserAgent: { agentId: 'unknown', status: 'degraded' },
        diagnosticsStore: {
          diagnosticsDir: './data/browser-diagnostics',
          enabled: true,
          status: 'ok',
        },
      },
    });
    expect(observability.record).toHaveBeenCalledWith({
      event: 'health.readiness_degraded',
      level: 'warn',
      details: {
        browserAgentId: 'unknown',
        browserAgentStatus: 'degraded',
        diagnosticsEnabled: true,
        diagnosticsStoreStatus: 'ok',
        status: 'degraded',
      },
    });
  });

  it('returns ready when dependencies are available', async () => {
    const observability = { record: jest.fn() };
    const service = new HealthService(
      {
        getStatus: jest.fn(async () => ({
          agentId: 'agent-1',
          available: true,
          lastSeenAt: '2026-01-01T00:00:00.000Z',
        })),
      } as never,
      {
        getStatus: jest.fn(() => ({
          diagnosticsDir: './data/browser-diagnostics',
          enabled: true,
        })),
      } as never,
      observability as never,
    );

    await expect(service.getReadiness()).resolves.toMatchObject({
      status: 'ready',
      checks: {
        browserAgent: { agentId: 'agent-1', status: 'ok' },
        diagnosticsStore: { enabled: true, status: 'ok' },
      },
    });
    expect(observability.record).toHaveBeenCalledWith({
      event: 'health.readiness_ready',
      level: 'info',
      details: {
        browserAgentId: 'agent-1',
        browserAgentStatus: 'ok',
        diagnosticsEnabled: true,
        diagnosticsStoreStatus: 'ok',
        status: 'ready',
      },
    });
  });
});
