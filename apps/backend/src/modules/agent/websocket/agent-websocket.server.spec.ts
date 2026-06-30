import {
  createJsonRpcRequest,
  createJsonRpcSuccessResponse,
} from '@cthutool/agent-protocol';
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

  it('emits lifecycle event when a registered agent disconnects', () => {
    const { lifecycleEvents, registry, server } = createHarness();
    const socket = new FakeSocket();

    handleConnection(server, socket);
    socket.emitMessage(JSON.stringify(helloMessage()));
    const status = registry.listOnlineAgents()[0];
    expect(status?.agentId).toBe('agent-1');

    socket.emitClose();

    expect(lifecycleEvents.emitAgentDisconnected).toHaveBeenCalledWith(status);
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

  it('rejects unknown lifecycle messages without registering agent state', () => {
    const { registry, server, socket, state } = createHarness();

    handleMessage(server, socket, state, {
      type: 'agent.browserState',
      payload: {
        agentId: 'agent-1',
        profiles: [],
      },
    });

    expect(socket.closed).toEqual(
      expect.objectContaining({ code: 1008, reason: 'invalid agent message' }),
    );
    expect(registry.listOnlineAgents()).toEqual([]);
  });

  it('routes command response for a pending command', () => {
    const { server, socket, state } = createHarness();
    handleMessage(server, socket, state, helloMessage());

    const sendPromise = server.sendCommand(
      'agent-1',
      createJsonRpcRequest({
        id: 'cmd-1',
        method: 'browser.capturePage',
        params: {
          authPolicy: 'anonymous',
          siteId: 'test',
          url: 'https://example.com/',
        },
      }),
    );

    handleMessage(
      server,
      socket,
      state,
      createJsonRpcSuccessResponse('cmd-1', {
        capturedAt: new Date().toISOString(),
        detection: { kind: 'ok' },
        finalUrl: 'https://example.com/',
        status: 200,
      }),
    );

    return expect(sendPromise).resolves.toMatchObject({
      id: 'cmd-1',
      result: expect.objectContaining({ status: 200 }),
    });
  });

  it('rejects command response that does not match a pending command', () => {
    const { server, socket, state } = createHarness();

    handleMessage(server, socket, state, helloMessage());
    handleMessage(
      server,
      socket,
      state,
      createJsonRpcSuccessResponse('unknown-cmd', {
        capturedAt: new Date().toISOString(),
        detection: { kind: 'ok' },
        finalUrl: 'https://example.com/',
        status: 200,
      }),
    );

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
  const lifecycleEvents = createLifecycleEvents();
  const server = createServer(registry, logger, lifecycleEvents);
  const socket = new FakeSocket();
  const state = { connectionId: 'conn-1' };
  // Register the socket in the server's internal map (as handleConnection would)
  // biome-ignore lint/complexity/useLiteralKeys: accessing private map
  (server as unknown as { sockets: Map<string, FakeSocket> })['sockets'].set(
    state.connectionId,
    socket,
  );
  return {
    lifecycleEvents,
    registry,
    server,
    socket,
    state,
  };
}

function createServer(
  registry: AgentRegistryService,
  logger: Pick<AgentRegistryLogger, 'log' | 'warn'>,
  lifecycleEvents: ReturnType<typeof createLifecycleEvents>,
): AgentWebSocketServer {
  return new AgentWebSocketServer(
    {
      httpAdapter: {
        getHttpServer: () => ({
          off: vi.fn(),
          on: vi.fn(),
        }),
      },
    } as never,
    registry,
    logger as AgentRegistryLogger,
    lifecycleEvents as never,
  );
}

function createLogger(): Pick<AgentRegistryLogger, 'log' | 'warn'> {
  return {
    log: vi.fn(),
    warn: vi.fn(),
  };
}

function createLifecycleEvents() {
  return {
    emitAgentDisconnected: vi.fn(),
  };
}

function handleConnection(server: AgentWebSocketServer, socket: FakeSocket) {
  (
    server as unknown as {
      handleConnection: (socket: FakeSocket) => void;
    }
  ).handleConnection(socket);
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
  readonly listeners: {
    close?: () => void;
    message?: (data: string) => void;
  } = {};
  closed?: { readonly code?: number; readonly reason?: string };

  on(event: 'close' | 'message', listener: (data: string) => void): void {
    this.listeners[event] = listener as never;
  }

  emitClose(): void {
    this.listeners.close?.();
  }

  emitMessage(data: string): void {
    this.listeners.message?.(data);
  }

  send(data: string, callback?: (error?: Error) => void): void {
    this.sent.push(data);
    callback?.();
  }

  close(code?: number, reason?: string): void {
    this.closed = { code, reason };
  }
}
