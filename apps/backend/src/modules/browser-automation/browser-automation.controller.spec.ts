import { SitesConfigService } from '../sites-config/sites-config.service';
import { BrowserAutomationController } from './browser-automation.controller';
import { BrowserPendingAuthTaskService } from './browser-pending-auth-task.service';
import { BrowserProfileRegistryService } from './browser-profile-registry.service';

describe('BrowserAutomationController', () => {
  it('returns browser sites with the existing response shape', () => {
    const controller = new BrowserAutomationController(
      new SitesConfigService(),
      new BrowserProfileRegistryService(),
      new BrowserPendingAuthTaskService(),
    );

    expect(controller.listSites()).toEqual({
      sites: expect.arrayContaining([
        expect.objectContaining({
          allowedOrigins: expect.arrayContaining(['https://movie.douban.com']),
          authPolicy: 'required',
          siteId: 'douban',
        }),
      ]),
    });
  });

  it('resolves pending auth when a verified profile is reported', () => {
    const pendingAuthTasks = new BrowserPendingAuthTaskService();
    const controller = new BrowserAutomationController(
      new SitesConfigService(),
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
