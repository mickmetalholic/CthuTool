import { AgentBrowserPendingAuthTaskService } from '../agent-state/agent-browser-pending-auth-task.service';
import { AgentBrowserProfileRegistryService } from '../agent-state/agent-browser-profile-registry.service';
import { BrowserAuthService } from '../browser-auth/browser-auth.service';
import { SitesConfigService } from '../sites-config/sites-config.service';
import { BrowserAutomationController } from './browser-automation.controller';

describe('BrowserAutomationController', () => {
  it('returns browser sites with the existing response shape', () => {
    const controller = new BrowserAutomationController(
      new SitesConfigService(),
      new BrowserAuthService(
        new AgentBrowserProfileRegistryService(),
        new AgentBrowserPendingAuthTaskService(),
      ),
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
    const pendingAuthTasks = new AgentBrowserPendingAuthTaskService();
    const controller = new BrowserAutomationController(
      new SitesConfigService(),
      new BrowserAuthService(
        new AgentBrowserProfileRegistryService(),
        pendingAuthTasks,
      ),
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
