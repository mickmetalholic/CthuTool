import {
  type BrowserErrorMessage,
  type BrowserResultMessage,
  createBrowserErrorMessage,
  createBrowserResultMessage,
} from '@cthutool/agent-protocol';
import { AgentRegistryService } from '../agent-registry/agent-registry.service';
import type { AgentWebSocketServer } from '../agent-registry/agent-websocket.server';
import {
  AgentCommandGateway,
  AgentCommandGatewayError,
} from './agent-command-gateway.service';

describe('AgentCommandGateway', () => {
  it('selects an online agent by capability and dispatches a browser command', async () => {
    const socket = createSocketMock();
    const gateway = createGateway(socket);

    const result = await gateway.sendBrowserCommandByCapability('browser', {
      authPolicy: 'anonymous',
      command: 'browser.capturePage',
      commandId: 'cmd-1',
      siteId: 'douban',
      url: 'https://movie.douban.com/',
    });

    expect(socket.sendBrowserCommand).toHaveBeenCalledWith(
      'agent-1',
      expect.objectContaining({ commandId: 'cmd-1' }),
      undefined,
    );
    expect(result.type).toBe('browser.result');
  });

  it('returns structured errors when a capability is missing', async () => {
    const gateway = createGateway(createSocketMock(), false);

    await expect(
      gateway.sendBrowserCommandByCapability('browser', {
        authPolicy: 'anonymous',
        command: 'browser.capturePage',
        commandId: 'cmd-1',
        siteId: 'douban',
        url: 'https://movie.douban.com/',
      }),
    ).rejects.toBeInstanceOf(AgentCommandGatewayError);
  });

  it('passes command errors through as correlated command results', async () => {
    const response = createBrowserErrorMessage({
      code: 'AUTH_PROFILE_REQUIRED',
      command: 'browser.capturePage',
      commandId: 'cmd-1',
      message: 'Missing profile',
      profileStatus: 'missing',
    });
    const gateway = createGateway(createSocketMock(response));

    await expect(
      gateway.sendBrowserCommand('agent-1', {
        authPolicy: 'required',
        command: 'browser.capturePage',
        commandId: 'cmd-1',
        profileName: 'douban-main',
        siteId: 'douban',
        url: 'https://movie.douban.com/',
      }),
    ).resolves.toEqual(response);
  });

  it('maps transport failures to gateway availability errors', async () => {
    const gateway = createGateway({
      sendBrowserCommand: jest.fn(async () => {
        throw new Error('socket closed');
      }),
    });

    await expect(
      gateway.sendBrowserCommand('agent-1', {
        authPolicy: 'anonymous',
        command: 'browser.capturePage',
        commandId: 'cmd-1',
        siteId: 'douban',
        url: 'https://movie.douban.com/',
      }),
    ).rejects.toMatchObject({
      code: 'AGENT_NOT_AVAILABLE',
      message: 'socket closed',
    });
  });
});

function createGateway(
  socket: Pick<AgentWebSocketServer, 'sendBrowserCommand'> = createSocketMock(),
  registerAgent = true,
): AgentCommandGateway {
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
  return new AgentCommandGateway(registry, socket as AgentWebSocketServer);
}

function createSocketMock(
  response:
    | BrowserResultMessage
    | BrowserErrorMessage = createBrowserResultMessage({
    capturedAt: '2026-06-13T10:00:00.000Z',
    command: 'browser.capturePage',
    commandId: 'cmd-1',
    detection: { kind: 'ok' },
    finalUrl: 'https://movie.douban.com/',
    status: 200,
  }),
): Pick<AgentWebSocketServer, 'sendBrowserCommand'> & {
  readonly sendBrowserCommand: jest.Mock;
} {
  return {
    sendBrowserCommand: jest.fn(async () => response),
  };
}
