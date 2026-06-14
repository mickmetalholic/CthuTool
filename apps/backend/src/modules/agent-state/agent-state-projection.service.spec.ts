import { AgentBrowserPendingAuthTaskService } from './agent-browser-pending-auth-task.service';
import { AgentBrowserProfileRegistryService } from './agent-browser-profile-registry.service';
import { AgentStateProjectionService } from './agent-state-projection.service';

describe('AgentStateProjectionService', () => {
  it('replaces browser profiles and pending auth tasks for one agent only', () => {
    const profiles = new AgentBrowserProfileRegistryService();
    const pendingAuthTasks = new AgentBrowserPendingAuthTaskService();
    const projection = new AgentStateProjectionService(
      profiles,
      pendingAuthTasks,
    );
    profiles.upsert({
      agentId: 'agent-1',
      profileName: 'old-main',
      siteId: 'douban',
      status: 'verified',
      updatedAt: '2026-06-13T09:00:00.000Z',
    });
    profiles.upsert({
      agentId: 'agent-2',
      profileName: 'zhihu-main',
      siteId: 'zhihu',
      status: 'verified',
      updatedAt: '2026-06-13T09:00:00.000Z',
    });
    pendingAuthTasks.upsert({
      agentId: 'agent-1',
      profileName: 'old-main',
      reason: 'missing',
      siteId: 'douban',
    });
    pendingAuthTasks.upsert({
      agentId: 'agent-2',
      profileName: 'zhihu-main',
      reason: 'missing',
      siteId: 'zhihu',
    });

    projection.replaceBrowserSnapshot('agent-1', {
      agentId: 'agent-1',
      pendingAuthTasks: [
        {
          agentId: 'agent-1',
          createdAt: '2026-06-13T10:00:00.000Z',
          id: 'agent-1:douban:douban-main',
          profileName: 'douban-main',
          reason: 'expired',
          siteId: 'douban',
          updatedAt: '2026-06-13T10:00:00.000Z',
        },
      ],
      profiles: [
        {
          agentId: 'agent-1',
          profileName: 'douban-main',
          siteId: 'douban',
          status: 'expired',
          updatedAt: '2026-06-13T10:00:00.000Z',
        },
      ],
    });

    expect(profiles.list()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          agentId: 'agent-1',
          profileName: 'douban-main',
        }),
        expect.objectContaining({
          agentId: 'agent-2',
          profileName: 'zhihu-main',
        }),
      ]),
    );
    expect(pendingAuthTasks.list()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          agentId: 'agent-1',
          id: 'agent-1:douban:douban-main',
          reason: 'expired',
        }),
        expect.objectContaining({ agentId: 'agent-2', siteId: 'zhihu' }),
      ]),
    );
  });

  it('clears browser state for an agent when a snapshot is empty', () => {
    const profiles = new AgentBrowserProfileRegistryService();
    const pendingAuthTasks = new AgentBrowserPendingAuthTaskService();
    const projection = new AgentStateProjectionService(
      profiles,
      pendingAuthTasks,
    );
    profiles.upsert({
      agentId: 'agent-1',
      profileName: 'douban-main',
      siteId: 'douban',
      status: 'verified',
      updatedAt: '2026-06-13T09:00:00.000Z',
    });
    pendingAuthTasks.upsert({
      agentId: 'agent-1',
      profileName: 'douban-main',
      reason: 'missing',
      siteId: 'douban',
    });

    projection.replaceBrowserSnapshot('agent-1', {
      agentId: 'agent-1',
      pendingAuthTasks: [],
      profiles: [],
    });

    expect(profiles.list()).toEqual([]);
    expect(pendingAuthTasks.list()).toEqual([]);
  });

  it('stores only public browser state fields', () => {
    const profiles = new AgentBrowserProfileRegistryService();
    profiles.upsert({
      agentId: 'agent-1',
      cookies: [{ name: 'sid', value: 'secret' }],
      localStorage: [{ name: 'token', value: 'secret' }],
      profileName: 'douban-main',
      siteId: 'douban',
      status: 'verified',
      updatedAt: '2026-06-13T09:00:00.000Z',
    } as never);

    expect(JSON.stringify(profiles.list())).not.toContain('secret');
    expect(profiles.list()[0]).toEqual({
      agentId: 'agent-1',
      displayName: undefined,
      externalUserId: undefined,
      profileName: 'douban-main',
      siteId: 'douban',
      status: 'verified',
      updatedAt: '2026-06-13T09:00:00.000Z',
      verifiedAt: undefined,
    });
  });
});
