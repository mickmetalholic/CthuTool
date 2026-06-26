import { Test } from '@nestjs/testing';
import { ClientEventsController } from './client-events.controller';
import { ClientEventsService } from './client-events.service';

describe('ClientEventsController', () => {
  it('delegates accepted client event ingestion to the service', async () => {
    const accept = vi.fn().mockReturnValue({
      accepted: true,
      requestId: 'backend-request-1',
    });
    const moduleRef = await Test.createTestingModule({
      controllers: [ClientEventsController],
      providers: [{ provide: ClientEventsService, useValue: { accept } }],
    }).compile();

    const controller = moduleRef.get(ClientEventsController);
    const body = {
      source: 'cthutool.web',
      level: 'warn',
      event: 'ui.warning',
      message: 'warning',
    };
    const request = { ip: '127.0.0.1' };

    expect(controller.accept(body, request as never)).toEqual({
      accepted: true,
      requestId: 'backend-request-1',
    });
    expect(accept).toHaveBeenCalledWith(body, request);
  });
});
