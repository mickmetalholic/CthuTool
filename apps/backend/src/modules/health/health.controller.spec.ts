import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  it('delegates to HealthService.getStatus', async () => {
    const getStatus = vi.fn().mockReturnValue({
      status: 'ok' as const,
      service: 'backend',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    const getReadiness = vi.fn().mockResolvedValue({
      status: 'degraded' as const,
      service: 'backend',
      checks: {
        browserAgent: { agentId: 'unknown', status: 'degraded' as const },
        diagnosticsStore: { enabled: true, status: 'ok' as const },
      },
      timestamp: '2026-01-01T00:00:00.000Z',
    });
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthService, useValue: { getReadiness, getStatus } },
      ],
    }).compile();

    const controller = moduleRef.get(HealthController);

    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'backend',
      timestamp: '2026-01-01T00:00:00.000Z',
    });
    expect(getStatus).toHaveBeenCalledTimes(1);
    await expect(controller.getReadiness()).resolves.toEqual({
      status: 'degraded',
      service: 'backend',
      checks: {
        browserAgent: { agentId: 'unknown', status: 'degraded' },
        diagnosticsStore: { enabled: true, status: 'ok' },
      },
      timestamp: '2026-01-01T00:00:00.000Z',
    });
    expect(getReadiness).toHaveBeenCalledTimes(1);
  });
});
