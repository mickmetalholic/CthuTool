import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  it('delegates to HealthService.getStatus', async () => {
    const getStatus = jest.fn().mockReturnValue({
      status: 'ok' as const,
      service: 'backend',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: { getStatus } }],
    }).compile();

    const controller = moduleRef.get(HealthController);

    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'backend',
      timestamp: '2026-01-01T00:00:00.000Z',
    });
    expect(getStatus).toHaveBeenCalledTimes(1);
  });
});
