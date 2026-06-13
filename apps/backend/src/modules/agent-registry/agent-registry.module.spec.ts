import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AgentRegistryModule } from './agent-registry.module';

describe('AgentRegistryModule', () => {
  it('wires websocket dependencies with Nest runtime tokens', async () => {
    const httpServer = {
      off: jest.fn(),
      on: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AgentRegistryModule],
    })
      .overrideProvider(HttpAdapterHost)
      .useValue({
        httpAdapter: {
          getHttpServer: () => httpServer,
        },
      })
      .compile();

    await moduleRef.init();
    await moduleRef.close();

    expect(httpServer.on).toHaveBeenCalledWith('upgrade', expect.any(Function));
    expect(httpServer.off).toHaveBeenCalledWith(
      'upgrade',
      expect.any(Function),
    );
  });
});
