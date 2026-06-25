import { BrowserPublicApiController } from './browser-public-api.controller';
import type { BrowserPublicApiService } from './browser-public-api.service';

describe('BrowserPublicApiController', () => {
  it('delegates session creation to the public API service', async () => {
    const service = createService();
    const controller = new BrowserPublicApiController(service);
    const body = { siteId: 'douban' };

    await controller.createSession(body);

    expect(service.createSession).toHaveBeenCalledWith(body);
  });

  it('delegates action execution to the public API service', async () => {
    const service = createService();
    const controller = new BrowserPublicApiController(service);
    const body = { actions: [{ type: 'content' }] };

    await controller.runActions('session-1', body);

    expect(service.runActions).toHaveBeenCalledWith('session-1', body);
  });

  it('delegates session closure to the public API service', async () => {
    const service = createService();
    const controller = new BrowserPublicApiController(service);

    await controller.closeSession('session-1');

    expect(service.closeSession).toHaveBeenCalledWith('session-1');
  });
});

function createService(): BrowserPublicApiService {
  return {
    closeSession: vi.fn(async () => ({ closed: true, sessionId: 'session-1' })),
    createSession: vi.fn(async () => ({
      session: {
        agentId: 'agent-1',
        authPolicy: 'anonymous',
        createdAt: '2026-06-13T10:00:00.000Z',
        expiresAt: '2026-06-13T10:15:00.000Z',
        lastUsedAt: '2026-06-13T10:00:00.000Z',
        sessionId: 'session-1',
        siteId: 'douban',
        status: 'active',
      },
    })),
    runActions: vi.fn(async () => ({
      actionResults: [],
      capturedAt: '2026-06-13T10:00:01.000Z',
      sessionId: 'session-1',
    })),
  } as unknown as BrowserPublicApiService;
}
