import { describe, expect, test, vi } from 'vitest';
import { AgentClient, toAgentWsUrl } from '../../src/main/agent-client';
import { normalizeConfig } from '../../src/main/config';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  readonly sent: string[] = [];
  readonly url: string;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
    this.onclose?.();
  }

  open() {
    this.readyState = 1;
    this.onopen?.();
  }

  receive(data: unknown) {
    this.onmessage?.({ data });
  }
}

describe('AgentClient', () => {
  const config = normalizeConfig({
    agentId: 'windows-pc',
    backendUrl: 'http://backend.local:3000',
    connectionEnabled: true,
    deviceName: 'Windows PC',
  });

  test('builds the backend agent WebSocket URL', () => {
    expect(toAgentWsUrl('http://backend.local:3000')).toBe(
      'ws://backend.local:3000/ws/agents',
    );
    expect(toAgentWsUrl('https://backend.local')).toBe(
      'wss://backend.local/ws/agents',
    );
  });

  test('sends hello after socket open and marks connected after ack', () => {
    FakeWebSocket.instances = [];
    const changes = vi.fn();
    const client = new AgentClient({
      getConfig: () => config,
      WebSocketImpl: FakeWebSocket,
      platform: 'win32',
      version: '0.1.0',
      onStateChange: changes,
    });

    client.start();
    const socket = FakeWebSocket.instances[0];
    socket.open();

    expect(JSON.parse(socket.sent[0])).toEqual({
      type: 'agent.hello',
      payload: {
        agentId: 'windows-pc',
        deviceName: 'Windows PC',
        platform: 'win32',
        version: '0.1.0',
        capabilities: [],
      },
    });

    socket.receive(
      JSON.stringify({
        type: 'agent.registered',
        payload: {
          agentId: 'windows-pc',
          serverTime: '2026-06-13T10:00:00.000Z',
        },
      }),
    );

    expect(client.getState().status).toBe('connected');
    expect(changes).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'connected' }),
    );
  });

  test('notifies after backend registration is accepted', () => {
    FakeWebSocket.instances = [];
    const registered = vi.fn();
    const client = new AgentClient({
      getConfig: () => config,
      WebSocketImpl: FakeWebSocket,
      platform: 'win32',
      version: '0.1.0',
      onRegistered: registered,
    });

    client.start();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.receive(
      JSON.stringify({
        type: 'agent.registered',
        payload: {
          agentId: 'windows-pc',
          serverTime: '2026-06-13T10:00:00.000Z',
        },
      }),
    );

    expect(registered).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: 'windows-pc',
        backendUrl: 'http://backend.local:3000',
        status: 'connected',
      }),
    );
  });

  test('sends browser state snapshot after backend registration is accepted', async () => {
    FakeWebSocket.instances = [];
    const client = new AgentClient({
      getBrowserStateSnapshot: () => ({
        agentId: 'windows-pc',
        pendingAuthTasks: [
          {
            agentId: 'windows-pc',
            createdAt: '2026-06-13T10:00:00.000Z',
            id: 'windows-pc:douban:douban-main',
            profileName: 'douban-main',
            reason: 'missing',
            siteId: 'douban',
            updatedAt: '2026-06-13T10:00:00.000Z',
          },
        ],
        profiles: [],
      }),
      getConfig: () => config,
      WebSocketImpl: FakeWebSocket,
      platform: 'win32',
      version: '0.1.0',
    });

    client.start();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.receive(
      JSON.stringify({
        type: 'agent.registered',
        payload: {
          agentId: 'windows-pc',
          serverTime: '2026-06-13T10:00:00.000Z',
        },
      }),
    );
    await Promise.resolve();

    expect(JSON.parse(socket.sent[1])).toEqual({
      type: 'browser.stateSnapshot',
      payload: expect.objectContaining({
        agentId: 'windows-pc',
        pendingAuthTasks: [
          expect.objectContaining({
            id: 'windows-pc:douban:douban-main',
            reason: 'missing',
          }),
        ],
        profiles: [],
      }),
    });
  });

  test('publishes the latest browser state on reconnect registration', async () => {
    vi.useFakeTimers();
    FakeWebSocket.instances = [];
    let profileStatus: 'missing' | 'verified' = 'missing';
    const client = new AgentClient({
      getBrowserStateSnapshot: () => ({
        agentId: 'windows-pc',
        pendingAuthTasks: [],
        profiles: [
          {
            agentId: 'windows-pc',
            profileName: 'douban-main',
            siteId: 'douban',
            status: profileStatus,
            updatedAt: '2026-06-13T10:00:00.000Z',
          },
        ],
      }),
      getConfig: () => config,
      WebSocketImpl: FakeWebSocket,
      platform: 'win32',
      reconnectDelayMs: 500,
      version: '0.1.0',
    });

    client.start();
    const firstSocket = FakeWebSocket.instances[0];
    firstSocket.open();
    firstSocket.receive(
      JSON.stringify({
        type: 'agent.registered',
        payload: {
          agentId: 'windows-pc',
          serverTime: '2026-06-13T10:00:00.000Z',
        },
      }),
    );
    await Promise.resolve();

    profileStatus = 'verified';
    firstSocket.close();
    vi.advanceTimersByTime(500);
    const secondSocket = FakeWebSocket.instances[1];
    secondSocket.open();
    secondSocket.receive(
      JSON.stringify({
        type: 'agent.registered',
        payload: {
          agentId: 'windows-pc',
          serverTime: '2026-06-13T10:01:00.000Z',
        },
      }),
    );
    await Promise.resolve();

    expect(JSON.parse(secondSocket.sent[1])).toEqual({
      type: 'browser.stateSnapshot',
      payload: expect.objectContaining({
        profiles: [
          expect.objectContaining({
            profileName: 'douban-main',
            status: 'verified',
          }),
        ],
      }),
    });
    client.stop();
    vi.useRealTimers();
  });

  test('sends heartbeat while connected', () => {
    vi.useFakeTimers();
    FakeWebSocket.instances = [];
    const client = new AgentClient({
      getConfig: () => config,
      WebSocketImpl: FakeWebSocket,
      platform: 'win32',
      version: '0.1.0',
      heartbeatIntervalMs: 1000,
      now: () => new Date('2026-06-13T10:00:00.000Z'),
    });

    client.start();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.receive(
      JSON.stringify({
        type: 'agent.registered',
        payload: {
          agentId: 'windows-pc',
          serverTime: '2026-06-13T10:00:00.000Z',
        },
      }),
    );
    vi.advanceTimersByTime(1000);

    expect(JSON.parse(socket.sent[1])).toEqual({
      type: 'agent.heartbeat',
      payload: {
        agentId: 'windows-pc',
        sentAt: '2026-06-13T10:00:00.000Z',
      },
    });
    client.stop();
    vi.useRealTimers();
  });

  test('includes dynamic browser capabilities in hello payload', () => {
    FakeWebSocket.instances = [];
    const client = new AgentClient({
      getCapabilities: () => ['browser'],
      getConfig: () => config,
      WebSocketImpl: FakeWebSocket,
      platform: 'win32',
      version: '0.1.0',
    });

    client.start();
    const socket = FakeWebSocket.instances[0];
    socket.open();

    expect(JSON.parse(socket.sent[0])).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({
          capabilities: ['browser'],
        }),
      }),
    );
  });

  test('handles browser commands and sends browser results', async () => {
    FakeWebSocket.instances = [];
    const client = new AgentClient({
      getCapabilities: () => ['browser'],
      getConfig: () => config,
      WebSocketImpl: FakeWebSocket,
      platform: 'win32',
      version: '0.1.0',
      handleBrowserCommand: async (command) => ({
        type: 'browser.result',
        payload: {
          capturedAt: '2026-06-13T10:00:00.000Z',
          command: command.command,
          commandId: command.commandId,
          detection: { kind: 'ok' },
          finalUrl: command.url,
        },
      }),
    });

    client.start();
    const socket = FakeWebSocket.instances[0];
    socket.receive(
      JSON.stringify({
        type: 'browser.command',
        payload: {
          authPolicy: 'anonymous',
          command: 'browser.capturePage',
          commandId: 'cmd-1',
          siteId: 'example',
          url: 'https://example.com/',
        },
      }),
    );
    await Promise.resolve();

    expect(JSON.parse(socket.sent[0])).toEqual({
      type: 'browser.result',
      payload: {
        capturedAt: '2026-06-13T10:00:00.000Z',
        command: 'browser.capturePage',
        commandId: 'cmd-1',
        detection: { kind: 'ok' },
        finalUrl: 'https://example.com/',
      },
    });
  });

  test('reconnects after close while enabled', () => {
    vi.useFakeTimers();
    FakeWebSocket.instances = [];
    const client = new AgentClient({
      getConfig: () => config,
      WebSocketImpl: FakeWebSocket,
      platform: 'win32',
      version: '0.1.0',
      reconnectDelayMs: 500,
    });

    client.start();
    FakeWebSocket.instances[0].close();
    expect(client.getState().status).toBe('reconnecting');
    vi.advanceTimersByTime(500);

    expect(FakeWebSocket.instances).toHaveLength(2);
    client.stop();
    vi.useRealTimers();
  });
});
