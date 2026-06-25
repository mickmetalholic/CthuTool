import { BrowserSessionRoutingStore } from './browser-session-routing.store';

describe('BrowserSessionRoutingStore', () => {
  it('creates, reads, and touches active routing records', () => {
    let now = new Date('2026-06-13T10:00:00.000Z');
    const store = new BrowserSessionRoutingStore();
    store.setNowForTesting(() => now);

    const created = store.create({
      agentId: 'agent-1',
      authPolicy: 'required',
      expiresAt: '2026-06-13T10:15:00.000Z',
      profileName: 'douban-main',
      sessionId: 'session-1',
      siteId: 'douban',
    });
    now = new Date('2026-06-13T10:01:00.000Z');
    const touched = store.touch('session-1');

    expect(created).toEqual({
      agentId: 'agent-1',
      authPolicy: 'required',
      createdAt: '2026-06-13T10:00:00.000Z',
      expiresAt: '2026-06-13T10:15:00.000Z',
      lastUsedAt: '2026-06-13T10:00:00.000Z',
      profileName: 'douban-main',
      sessionId: 'session-1',
      siteId: 'douban',
      status: 'active',
    });
    expect(touched?.lastUsedAt).toBe('2026-06-13T10:01:00.000Z');
    expect(store.get('session-1')?.status).toBe('active');
  });

  it('hides expired sessions from lookup', () => {
    let now = new Date('2026-06-13T10:00:00.000Z');
    const store = new BrowserSessionRoutingStore();
    store.setNowForTesting(() => now);
    store.create({
      agentId: 'agent-1',
      authPolicy: 'anonymous',
      expiresAt: '2026-06-13T10:01:00.000Z',
      sessionId: 'session-1',
      siteId: 'example',
    });

    now = new Date('2026-06-13T10:02:00.000Z');

    expect(store.get('session-1')).toBeUndefined();
  });

  it('closes sessions and expires sessions by owning agent', () => {
    const store = new BrowserSessionRoutingStore();
    store.setNowForTesting(() => new Date('2026-06-13T10:00:00.000Z'));
    store.create({
      agentId: 'agent-1',
      authPolicy: 'anonymous',
      expiresAt: '2026-06-13T10:15:00.000Z',
      sessionId: 'session-1',
      siteId: 'example',
    });
    store.create({
      agentId: 'agent-2',
      authPolicy: 'anonymous',
      expiresAt: '2026-06-13T10:15:00.000Z',
      sessionId: 'session-2',
      siteId: 'example',
    });

    expect(store.close('session-1')?.status).toBe('closed');
    const expired = store.expireByAgent('agent-2');

    expect(store.get('session-1')).toBeUndefined();
    expect(expired).toHaveLength(1);
    expect(expired[0]).toEqual(
      expect.objectContaining({
        sessionId: 'session-2',
        status: 'closed',
      }),
    );
    expect(store.get('session-2')).toBeUndefined();
  });
});
