import {
  type BrowserErrorMessage,
  type BrowserResultMessage,
  createBrowserErrorMessage,
  createBrowserResultMessage,
  type PublicAgentStatus,
} from '@cthutool/agent-protocol';
import type { AgentCommandGateway } from '../agent-command-gateway/agent-command-gateway.service';
import { AgentBrowserPendingAuthTaskService } from '../agent-state/agent-browser-pending-auth-task.service';
import { AgentBrowserProfileRegistryService } from '../agent-state/agent-browser-profile-registry.service';
import { BrowserAuthService } from '../browser-auth/browser-auth.service';
import { AgentBrowserCaptureProvider } from './agent-browser-capture.provider';

describe('AgentBrowserCaptureProvider', () => {
  it('fails when no online agent exposes browser capability', async () => {
    const provider = createProvider(createGatewayMock(null));

    await expect(
      provider.capturePage({
        authPolicy: 'anonymous',
        siteId: 'example',
        url: 'https://example.com/',
      }),
    ).rejects.toMatchObject({ code: 'AGENT_NOT_AVAILABLE' });
  });

  it('sends capture commands to an online browser agent', async () => {
    const gateway = createGatewayMock();
    const provider = createProvider(gateway);

    const snapshot = await provider.capturePage({
      authPolicy: 'anonymous',
      includeHtml: true,
      siteId: 'example',
      url: 'https://example.com/',
    });

    expect(gateway.sendBrowserCommand).toHaveBeenCalledWith(
      'agent-1',
      expect.objectContaining({
        authPolicy: 'anonymous',
        command: 'browser.capturePage',
        includeHtml: true,
        siteId: 'example',
        url: 'https://example.com/',
      }),
      undefined,
    );
    expect(snapshot).toEqual(
      expect.objectContaining({
        agentId: 'agent-1',
        finalUrl: 'https://example.com/',
        html: '<html>ok</html>',
        status: 200,
      }),
    );
  });

  it('records pending auth tasks when the agent reports a missing required profile', async () => {
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createBrowserErrorMessage({
        code: 'AUTH_PROFILE_REQUIRED',
        command: 'browser.capturePage',
        commandId: 'cmd-returned',
        message: 'Required browser profile is not verified',
        profileStatus: 'missing',
      }),
    );
    const pendingAuthTasks = new AgentBrowserPendingAuthTaskService();
    const provider = createProvider(gateway, pendingAuthTasks);

    await expect(
      provider.capturePage({
        authPolicy: 'required',
        loginUrl: 'https://accounts.douban.com/passport/login',
        profileName: 'douban-main',
        siteId: 'douban',
        url: 'https://movie.douban.com/subject/1/',
        verifyUrl: 'https://www.douban.com/mine/',
      }),
    ).rejects.toMatchObject({ code: 'AUTH_PROFILE_REQUIRED' });

    expect(pendingAuthTasks.list()).toEqual([
      expect.objectContaining({
        agentId: 'agent-1',
        profileName: 'douban-main',
        reason: 'missing',
        siteId: 'douban',
      }),
    ]);
  });

  it('records expired pending auth tasks when the agent reports an expired profile', async () => {
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createBrowserErrorMessage({
        code: 'AUTH_PROFILE_EXPIRED',
        command: 'browser.capturePage',
        commandId: 'cmd-returned',
        message: 'Required browser profile expired',
        profileStatus: 'expired',
      }),
    );
    const pendingAuthTasks = new AgentBrowserPendingAuthTaskService();
    const provider = createProvider(gateway, pendingAuthTasks);

    await expect(
      provider.capturePage({
        authPolicy: 'required',
        profileName: 'douban-main',
        siteId: 'douban',
        url: 'https://movie.douban.com/subject/1/',
      }),
    ).rejects.toMatchObject({ code: 'AUTH_PROFILE_EXPIRED' });

    expect(pendingAuthTasks.list()).toEqual([
      expect.objectContaining({
        agentId: 'agent-1',
        profileName: 'douban-main',
        reason: 'expired',
        siteId: 'douban',
      }),
    ]);
  });

  it('can suppress pending auth tasks for business lookups', async () => {
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createBrowserErrorMessage({
        code: 'AUTH_PROFILE_REQUIRED',
        command: 'browser.capturePage',
        commandId: 'cmd-returned',
        message: 'Required browser profile is not verified',
        profileStatus: 'missing',
      }),
    );
    const pendingAuthTasks = new AgentBrowserPendingAuthTaskService();
    const provider = createProvider(gateway, pendingAuthTasks);

    await expect(
      provider.capturePage({
        authPolicy: 'required',
        profileName: 'douban-main',
        siteId: 'douban',
        suppressPendingAuthTask: true,
        url: 'https://movie.douban.com/subject/1/',
      }),
    ).rejects.toMatchObject({ code: 'AUTH_PROFILE_REQUIRED' });

    expect(gateway.sendBrowserCommand).toHaveBeenCalledWith(
      'agent-1',
      expect.objectContaining({ suppressPendingAuthTask: true }),
      undefined,
    );
    expect(pendingAuthTasks.list()).toEqual([]);
  });

  it('maps non-auth browser errors without recording pending auth', async () => {
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createBrowserErrorMessage({
        code: 'CAPTURE_FAILED',
        command: 'browser.capturePage',
        commandId: 'cmd-returned',
        message: 'Capture failed',
      }),
    );
    const pendingAuthTasks = new AgentBrowserPendingAuthTaskService();
    const provider = createProvider(gateway, pendingAuthTasks);

    await expect(
      provider.capturePage({
        authPolicy: 'anonymous',
        siteId: 'example',
        url: 'https://example.com/',
      }),
    ).rejects.toMatchObject({ code: 'BROWSER_AGENT_COMMAND_FAILED' });

    expect(pendingAuthTasks.list()).toEqual([]);
  });
});

function createProvider(
  gateway: Pick<
    AgentCommandGateway,
    'selectAgentByCapability' | 'sendBrowserCommand'
  > = createGatewayMock(),
  pendingAuthTasks = new AgentBrowserPendingAuthTaskService(),
): AgentBrowserCaptureProvider {
  return new AgentBrowserCaptureProvider(
    gateway as AgentCommandGateway,
    new BrowserAuthService(
      new AgentBrowserProfileRegistryService(),
      pendingAuthTasks,
    ),
  );
}

function createGatewayMock(
  agent: PublicAgentStatus | null = createAgentStatus('agent-1'),
  response:
    | BrowserResultMessage
    | BrowserErrorMessage = createBrowserResultMessage({
    capturedAt: '2026-06-13T10:00:00.000Z',
    command: 'browser.capturePage',
    commandId: 'cmd-returned',
    detection: { kind: 'ok' },
    finalUrl: 'https://example.com/',
    html: '<html>ok</html>',
    status: 200,
    title: 'Example',
  }),
): Pick<
  AgentCommandGateway,
  'selectAgentByCapability' | 'sendBrowserCommand'
> & {
  readonly selectAgentByCapability: jest.Mock;
  readonly sendBrowserCommand: jest.Mock;
} {
  return {
    selectAgentByCapability: jest.fn(() => agent ?? undefined),
    sendBrowserCommand: jest.fn(async () => response),
  };
}

function createAgentStatus(agentId: string): PublicAgentStatus {
  return {
    agentId,
    capabilities: ['browser'],
    connectedAt: '2026-06-13T10:00:00.000Z',
    connectionId: `${agentId}-connection`,
    deviceName: 'desktop',
    lastSeenAt: '2026-06-13T10:00:00.000Z',
    platform: 'win32',
    state: 'online',
    version: '0.0.0',
  };
}
