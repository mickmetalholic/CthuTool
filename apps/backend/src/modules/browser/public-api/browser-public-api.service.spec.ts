import type { BrowserAction } from '@cthutool/browser-runtime-protocol';
import type { Mock } from 'vitest';
import { BrowserPublicApiService } from './browser-public-api.service';
import { BrowserSessionRoutingStore } from './browser-session-routing.store';

describe('BrowserPublicApiService', () => {
  it('creates sessions and stores only routing metadata', async () => {
    const { runtime, service, store } = createHarness();

    const result = await service.createSession({
      authPolicy: 'required',
      profileName: 'douban-main',
      siteId: 'douban',
    });

    expect(result.session).toEqual(
      expect.objectContaining({
        agentId: 'agent-1',
        authPolicy: 'required',
        profileName: 'douban-main',
        sessionId: 'session-1',
        siteId: 'douban',
        status: 'active',
      }),
    );
    expect(runtime.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        profileName: 'douban-main',
        siteId: 'douban',
      }),
    );
    expect(store.get('session-1')).toEqual(
      expect.objectContaining({
        agentId: 'agent-1',
        siteId: 'douban',
      }),
    );
    expect(JSON.stringify(result)).not.toContain('cookies');
  });

  it('returns unavailable errors when no desktop browser agent exists', async () => {
    const { runtime, service } = createHarness();
    runtime.createSession.mockResolvedValueOnce({
      ok: false,
      code: 'AGENT_NOT_AVAILABLE',
      error: 'No online desktop agent with browser capability',
    });

    await expect(service.createSession({ siteId: 'douban' })).rejects.toEqual(
      expect.objectContaining({
        code: 'BROWSER_UNAVAILABLE',
      }),
    );
  });

  it('rejects unknown sites before dispatching desktop work', async () => {
    const { runtime, service } = createHarness();

    await expect(service.createSession({ siteId: 'missing' })).rejects.toEqual(
      expect.objectContaining({
        code: 'INVALID_BROWSER_REQUEST',
      }),
    );
    expect(runtime.createSession).not.toHaveBeenCalled();
  });

  it('runs actions for the owning agent and touches the routing record', async () => {
    let now = new Date('2026-06-13T10:00:00.000Z');
    const { runtime, service, store } = createHarness({ now: () => now });
    await service.createSession({ siteId: 'douban' });
    now = new Date('2026-06-13T10:01:00.000Z');

    const result = await service.runActions('session-1', {
      actions: [
        {
          actionId: 'a1',
          type: 'goto',
          url: 'https://movie.douban.com/subject/1292052/',
        },
        { actionId: 'a2', type: 'content' },
      ],
    });

    expect(result).toEqual({
      actionResults: [
        {
          actionId: 'a1',
          html: '<html>ok</html>',
          type: 'content',
        },
      ],
      capturedAt: '2026-06-13T10:00:01.000Z',
      sessionId: 'session-1',
    });
    expect(runtime.runActions).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: 'agent-1',
        sessionId: 'session-1',
      }),
    );
    expect(store.get('session-1')?.lastUsedAt).toBe('2026-06-13T10:01:00.000Z');
  });

  it('rejects navigation outside the configured origin allowlist', async () => {
    const { runtime, service } = createHarness();
    await service.createSession({ siteId: 'douban' });

    await expect(
      service.runActions('session-1', {
        actions: [{ type: 'goto', url: 'https://evil.example/' }],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: 'INVALID_BROWSER_REQUEST',
      }),
    );
    expect(runtime.runActions).not.toHaveBeenCalled();
  });

  it('rejects unsupported action types', async () => {
    const { runtime, service } = createHarness();
    await service.createSession({ siteId: 'douban' });

    await expect(
      service.runActions('session-1', {
        actions: [{ type: 'evaluate', script: 'document.cookie' }],
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: 'INVALID_BROWSER_REQUEST',
      }),
    );
    expect(runtime.runActions).not.toHaveBeenCalled();
  });

  it('expires sessions before routing actions', async () => {
    let now = new Date();
    const { runtime, service } = createHarness({ now: () => now });
    await service.createSession({ siteId: 'douban', ttlMs: 60_000 });
    now = new Date(now.getTime() + 120_000);

    await expect(
      service.runActions('session-1', { actions: [{ type: 'content' }] }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: 'BROWSER_SESSION_NOT_FOUND',
      }),
    );
    expect(runtime.closeSession).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-1',
      }),
    );
  });

  it('closes sessions and removes routing records', async () => {
    const { runtime, service, store } = createHarness();
    await service.createSession({ siteId: 'douban' });

    await expect(service.closeSession('session-1')).resolves.toEqual({
      closed: true,
      sessionId: 'session-1',
    });

    expect(runtime.closeSession).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: 'agent-1',
        sessionId: 'session-1',
      }),
    );
    expect(store.get('session-1')).toBeUndefined();
  });

  it('expires sessions when the owning agent disconnects', async () => {
    const { agentLifecycleEvents, service, store } = createHarness();
    service.onModuleInit();
    await service.createSession({ siteId: 'douban' });

    agentLifecycleEvents.emitAgentDisconnected('agent-1');

    expect(store.get('session-1')).toBeUndefined();
    await expect(
      service.runActions('session-1', { actions: [{ type: 'content' }] }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: 'BROWSER_SESSION_NOT_FOUND',
      }),
    );
    service.onModuleDestroy();
  });
});

function createHarness(options: { readonly now?: () => Date } = {}) {
  const runtime = {
    closeSession: vi.fn(async () => ({
      ok: true as const,
      value: { sessionId: 'session-1' },
    })),
    createSession: vi.fn(async (input: { readonly expiresAt: string }) => ({
      ok: true as const,
      value: {
        agentId: 'agent-1',
        createdAt: '2026-06-13T10:00:00.000Z',
        expiresAt: input.expiresAt,
        profileName: 'douban-main',
        sessionId: 'session-1',
        siteId: 'douban',
      },
    })),
    runActions: vi.fn(
      async (_input: { readonly actions: BrowserAction[] }) => ({
        ok: true as const,
        value: {
          actionResults: [
            {
              actionId: 'a1',
              html: '<html>ok</html>',
              type: 'content' as const,
            },
          ],
          capturedAt: '2026-06-13T10:00:01.000Z',
          sessionId: 'session-1',
        },
      }),
    ),
  };
  const siteConfig = {
    getSite: vi.fn((siteId: string) =>
      siteId === 'douban'
        ? {
            allowedOrigins: ['https://movie.douban.com'],
            authPolicy: 'required' as const,
            defaultBlockResources: ['image' as const],
            defaultTimeoutMs: 30000,
            displayName: 'Douban',
            loginUrl: 'https://accounts.douban.com/passport/login',
            profileName: 'douban-main',
            siteId: 'douban',
            verifyUrl: 'https://www.douban.com/mine/',
          }
        : undefined,
    ),
  };
  const store = new BrowserSessionRoutingStore();
  store.setNowForTesting(
    options.now ?? (() => new Date('2026-06-13T10:00:00.000Z')),
  );
  const disconnectedHandlers = new Set<(agentId: string) => void>();
  const agentLifecycleEvents = {
    emitAgentDisconnected(agentId: string) {
      for (const handler of disconnectedHandlers) {
        handler(agentId);
      }
    },
    onAgentDisconnected: vi.fn(
      (
        handler: (event: {
          readonly agent: { readonly agentId: string };
        }) => void,
      ) => {
        const wrapped = (agentId: string) => handler({ agent: { agentId } });
        disconnectedHandlers.add(wrapped);
        return () => {
          disconnectedHandlers.delete(wrapped);
        };
      },
    ),
  };
  return {
    agentLifecycleEvents,
    runtime: runtime as typeof runtime & {
      readonly createSession: Mock;
      readonly runActions: Mock;
      readonly closeSession: Mock;
    },
    service: new BrowserPublicApiService(
      runtime as never,
      siteConfig as never,
      store,
      agentLifecycleEvents as never,
    ),
    siteConfig,
    store,
  };
}
