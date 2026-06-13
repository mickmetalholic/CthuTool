import { BrowserPendingAuthTaskService } from './browser-pending-auth-task.service';
import { BrowserProfileRegistryService } from './browser-profile-registry.service';
import { BrowserStateProjectionService } from './browser-state-projection.service';

describe('BrowserStateProjectionService', () => {
  it('replaces profiles and pending auth tasks for one agent only', () => {
    const profiles = new BrowserProfileRegistryService();
    const pendingAuthTasks = new BrowserPendingAuthTaskService();
    const projection = new BrowserStateProjectionService(
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

    projection.replaceAgentSnapshot('agent-1', {
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

  it('clears state for an agent when a snapshot is empty', () => {
    const profiles = new BrowserProfileRegistryService();
    const pendingAuthTasks = new BrowserPendingAuthTaskService();
    const projection = new BrowserStateProjectionService(
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

    projection.replaceAgentSnapshot('agent-1', {
      agentId: 'agent-1',
      pendingAuthTasks: [],
      profiles: [],
    });

    expect(profiles.list()).toEqual([]);
    expect(pendingAuthTasks.list()).toEqual([]);
  });
});
