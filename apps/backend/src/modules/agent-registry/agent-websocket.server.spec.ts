import type { AgentRegistryLogger } from './agent-registry.logger';
import { AgentRegistryService } from './agent-registry.service';
import { AgentWebSocketServer } from './agent-websocket.server';

describe('AgentWebSocketServer browser state snapshots', () => {
  it('routes snapshots from the registered authoritative connection', () => {
    const { server, socket, state } = createHarness('conn-1');
    const handler = jest.fn();
    server.setBrowserStateSnapshotHandler(handler);

    handleMessage(server, socket, state, helloMessage());
    handleMessage(server, socket, state, snapshotMessage());

    expect(handler).toHaveBeenCalledWith(
      'agent-1',
      expect.objectContaining({
        agentId: 'agent-1',
        profiles: [expect.objectContaining({ siteId: 'douban' })],
      }),
    );
  });

  it('rejects snapshots before registration', () => {
    const { server, socket, state } = createHarness('conn-1');
    const handler = jest.fn();
    server.setBrowserStateSnapshotHandler(handler);

    handleMessage(server, socket, state, snapshotMessage());

    expect(handler).not.toHaveBeenCalled();
    expect(socket.closed).toEqual(
      expect.objectContaining({ code: 1008, reason: 'invalid agent message' }),
    );
  });

  it('ignores snapshots from stale replaced connections', () => {
    const registry = new AgentRegistryService();
    const logger = createLogger();
    const server = createServer(registry, logger);
    const oldSocket = new FakeSocket();
    const newSocket = new FakeSocket();
    const oldState = { connectionId: 'old-conn' };
    const newState = { connectionId: 'new-conn' };
    const handler = jest.fn();
    server.setBrowserStateSnapshotHandler(handler);

    handleMessage(server, oldSocket, oldState, helloMessage());
    handleMessage(server, newSocket, newState, helloMessage());
    handleMessage(server, oldSocket, oldState, snapshotMessage());

    expect(handler).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: 'agent-1',
        event: 'agent_snapshot_stale',
      }),
    );
  });

  it('rejects malformed snapshots without updating state', () => {
    const { server, socket, state } = createHarness('conn-1');
    const handler = jest.fn();
    server.setBrowserStateSnapshotHandler(handler);

    handleMessage(server, socket, state, helloMessage());
    handleMessage(server, socket, state, {
      type: 'browser.stateSnapshot',
      payload: {
        agentId: 'agent-1',
        pendingAuthTasks: [],
        profiles: [
          {
            agentId: 'agent-1',
            cookies: [],
            profileName: 'douban-main',
            siteId: 'douban',
            status: 'verified',
            updatedAt: '2026-06-13T10:00:00.000Z',
          },
        ],
      },
    });

    expect(handler).not.toHaveBeenCalled();
    expect(socket.closed).toEqual(
      expect.objectContaining({ code: 1008, reason: 'invalid agent message' }),
    );
  });
});

function createHarness(connectionId: string) {
  const registry = new AgentRegistryService();
  const logger = createLogger();
  return {
    logger,
    registry,
    server: createServer(registry, logger),
    socket: new FakeSocket(),
    state: { connectionId },
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
  (
    server as unknown as {
      handleMessage: (
        socket: FakeSocket,
        state: { connectionId: string; agentId?: string },
        data: string,
      ) => void;
    }
  ).handleMessage(socket, state, JSON.stringify(message));
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

function snapshotMessage() {
  return {
    type: 'browser.stateSnapshot',
    payload: {
      agentId: 'agent-1',
      pendingAuthTasks: [
        {
          agentId: 'agent-1',
          createdAt: '2026-06-13T10:00:00.000Z',
          id: 'agent-1:douban:douban-main',
          loginUrl: 'https://accounts.douban.com/passport/login',
          profileName: 'douban-main',
          reason: 'missing',
          siteId: 'douban',
          updatedAt: '2026-06-13T10:00:00.000Z',
          verifyUrl: 'https://www.douban.com/mine/',
        },
      ],
      profiles: [
        {
          agentId: 'agent-1',
          profileName: 'douban-main',
          siteId: 'douban',
          status: 'verified',
          updatedAt: '2026-06-13T10:00:00.000Z',
          verifiedAt: '2026-06-13T10:00:00.000Z',
        },
      ],
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
