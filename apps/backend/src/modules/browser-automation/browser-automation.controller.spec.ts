import { BrowserAutomationController } from './browser-automation.controller';
import { BrowserPendingAuthTaskService } from './browser-pending-auth-task.service';
import { BrowserProfileRegistryService } from './browser-profile-registry.service';
import { BrowserSiteConfigService } from './browser-site-config.service';

describe('BrowserAutomationController', () => {
  it('resolves pending auth when a verified profile is reported', () => {
    const pendingAuthTasks = new BrowserPendingAuthTaskService();
    const controller = new BrowserAutomationController(
      new BrowserSiteConfigService(),
      new BrowserProfileRegistryService(),
      pendingAuthTasks,
    );
    pendingAuthTasks.upsert({
      agentId: 'agent-1',
      profileName: 'douban-main',
      reason: 'missing',
      siteId: 'douban',
    });

    controller.reportProfile({
      agentId: 'agent-1',
      profileName: 'douban-main',
      siteId: 'douban',
      status: 'verified',
      updatedAt: '2026-06-13T10:00:00.000Z',
      verifiedAt: '2026-06-13T10:00:00.000Z',
    });

    expect(pendingAuthTasks.list()).toEqual([]);
  });
});
