import {
  type BrowserErrorMessage,
  type BrowserResultMessage,
  createBrowserErrorMessage,
  createBrowserResultMessage,
} from '@cthutool/agent-protocol';
import { AgentRegistryService } from '../agent-registry/agent-registry.service';
import type { AgentWebSocketServer } from '../agent-registry/agent-websocket.server';
import { AgentBrowserProvider } from './agent-browser.provider';
import { BrowserPendingAuthTaskService } from './browser-pending-auth-task.service';
import { BrowserProfileRegistryService } from './browser-profile-registry.service';

describe('AgentBrowserProvider', () => {
  it('fails when no online agent exposes browser capability', async () => {
    const provider = createProvider(
      createSocketMock(),
      new BrowserPendingAuthTaskService(),
      false,
    );

    await expect(
      provider.capturePage({
        authPolicy: 'anonymous',
        siteId: 'example',
        url: 'https://example.com/',
      }),
    ).rejects.toMatchObject({ code: 'AGENT_NOT_AVAILABLE' });
  });

  it('sends capture commands to an online browser agent', async () => {
    const socket = createSocketMock();
    const provider = createProvider(socket);

    const snapshot = await provider.capturePage({
      authPolicy: 'anonymous',
      includeHtml: true,
      siteId: 'example',
      url: 'https://example.com/',
    });

    expect(socket.sendBrowserCommand).toHaveBeenCalledWith(
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
    const socket = createSocketMock(
      createBrowserErrorMessage({
        code: 'AUTH_PROFILE_REQUIRED',
        command: 'browser.capturePage',
        commandId: 'cmd-returned',
        message: 'Required browser profile is not verified',
        profileStatus: 'missing',
      }),
    );
    const pendingAuthTasks = new BrowserPendingAuthTaskService();
    const provider = createProvider(socket, pendingAuthTasks);

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
});

function createProvider(
  socket: Pick<AgentWebSocketServer, 'sendBrowserCommand'> = createSocketMock(),
  pendingAuthTasks = new BrowserPendingAuthTaskService(),
  registerAgent = true,
): AgentBrowserProvider {
  const registry = new AgentRegistryService();
  if (registerAgent) {
    registry.register({
      connectionId: 'connection-1',
      hello: {
        agentId: 'agent-1',
        capabilities: ['browser'],
        deviceName: 'desktop',
        platform: 'win32',
        version: '0.0.0',
      },
    });
  }
  return new AgentBrowserProvider(
    registry,
    socket as AgentWebSocketServer,
    new BrowserProfileRegistryService(),
    pendingAuthTasks,
  );
}

function createSocketMock(
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
): Pick<AgentWebSocketServer, 'sendBrowserCommand'> & {
  readonly sendBrowserCommand: jest.Mock;
} {
  return {
    sendBrowserCommand: jest.fn(async () => response),
  };
}
