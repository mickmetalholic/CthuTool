import type { AgentRegistryLogger } from '../registry/agent-registry.logger';
import { AgentRegistryService } from '../registry/agent-registry.service';
import { AgentWebSocketServer } from './agent-websocket.server';

describe('AgentWebSocketServer', () => {
  it('registers agent on hello and sends registered message', () => {
    const { server, socket, state } = createHarness();

    handleMessage(server, socket, state, helloMessage());

    expect(socket.sent.length).toBeGreaterThan(0);
    const sent = JSON.parse(socket.sent[0]);
    expect(sent.type).toBe('agent.registered');
    expect(sent.payload.agentId).toBe('agent-1');
  });

  it('handles heartbeat for registered agent', () => {
    const { server, socket, state } = createHarness();

    handleMessage(server, socket, state, helloMessage());
    handleMessage(server, socket, state, {
      type: 'agent.heartbeat',
      payload: { agentId: 'agent-1' },
    });

    expect(socket.closed).toBeUndefined();
  });

  it('rejects heartbeat for unregistered agent', () => {
    const { server, socket, state } = createHarness();

    handleMessage(server, socket, state, {
      type: 'agent.heartbeat',
      payload: { agentId: 'unknown' },
    });

    expect(socket.closed).toEqual(
      expect.objectContaining({ code: 1008, reason: 'invalid agent message' }),
    );
  });

  it('routes command response for a pending command', () => {
    const { server, socket, state } = createHarness();
    handleMessage(server, socket, state, helloMessage());

    const sendPromise = server.sendCommand('agent-1', {
      commandId: 'cmd-1',
      message: {
        type: 'browser.command',
        payload: {
          authPolicy: 'anonymous',
          command: 'browser.capturePage',
          commandId: 'cmd-1',
          siteId: 'test',
          url: 'https://example.com/',
        },
      },
    });

    handleMessage(server, socket, state, {
      type: 'browser.result',
      payload: {
        command: 'browser.capturePage',
        commandId: 'cmd-1',
        capturedAt: new Date().toISOString(),
        detection: { kind: 'ok' },
        finalUrl: 'https://example.com/',
        status: 200,
      },
    });

    return expect(sendPromise).resolves.toMatchObject({
      type: 'browser.result',
      payload: expect.objectContaining({ commandId: 'cmd-1' }),
    });
  });

  it('rejects command response that does not match a pending command', () => {
    const { server, socket, state } = createHarness();

    handleMessage(server, socket, state, helloMessage());
    handleMessage(server, socket, state, {
      type: 'browser.result',
      payload: {
        commandId: 'unknown-cmd',
        capturedAt: new Date().toISOString(),
        detection: { kind: 'ok' },
        finalUrl: 'https://example.com/',
        status: 200,
      },
    });

    expect(socket.closed).toEqual(expect.objectContaining({ code: 1008 }));
  });

  it('rejects malformed payloads', () => {
    const { server, socket, state } = createHarness();

    handleRawMessage(server, socket, state, 'invalid json');

    expect(socket.closed).toEqual(
      expect.objectContaining({ code: 1008, reason: 'invalid agent message' }),
    );
  });
});

function createHarness() {
  const registry = new AgentRegistryService();
  const logger = createLogger();
  const server = createServer(registry, logger);
  const socket = new FakeSocket();
  const state = { connectionId: 'conn-1' };
  // Register the socket in the server's internal map (as handleConnection would)
  // biome-ignore lint/complexity/useLiteralKeys: accessing private map
  (server as unknown as { sockets: Map<string, FakeSocket> })['sockets'].set(
    state.connectionId,
    socket,
  );
  return {
    registry,
    server,
    socket,
    state,
  };
}

function createServer(
  registry: AgentRegistryService,
  logger: Pick<AgentRegistryLogger, 'log' | 'warn'>,
): AgentWebSocketServer {
  return new AgentWebSocketServer(
    {
      httpAdapter: {
        getHttpServer: () => ({
          off: jest.fn(),
          on: jest.fn(),
        }),
      },
    } as never,
    registry,
    logger as AgentRegistryLogger,
  );
}

function createLogger(): Pick<AgentRegistryLogger, 'log' | 'warn'> {
  return {
    log: jest.fn(),
    warn: jest.fn(),
  };
}

function handleMessage(
  server: AgentWebSocketServer,
  socket: FakeSocket,
  state: { connectionId: string; agentId?: string },
  message: unknown,
): void {
  handleRawMessage(server, socket, state, JSON.stringify(message));
}

function handleRawMessage(
  server: AgentWebSocketServer,
  socket: FakeSocket,
  state: { connectionId: string; agentId?: string },
  data: string,
): void {
  (
    server as unknown as {
      handleMessage: (
        socket: FakeSocket,
        state: { connectionId: string; agentId?: string },
        data: string,
      ) => void;
    }
  ).handleMessage(socket, state, data);
}

function helloMessage() {
  return {
    type: 'agent.hello',
    payload: {
      agentId: 'agent-1',
      capabilities: ['browser'],
      deviceName: 'Desktop Agent',
      platform: 'win32',
      version: '0.0.0',
    },
  };
}

class FakeSocket {
  readonly sent: string[] = [];
  readonly readyState = 1;
  closed?: { readonly code?: number; readonly reason?: string };

  send(data: string, callback?: (error?: Error) => void): void {
    this.sent.push(data);
    callback?.();
  }

  close(code?: number, reason?: string): void {
    this.closed = { code, reason };
  }
}
