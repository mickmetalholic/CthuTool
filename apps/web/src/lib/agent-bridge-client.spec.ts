import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  AgentBridgeClientError,
  AgentBridgeFetchClient,
  classifyAgentBridgeError,
  consumeAgentBridgeFragment,
} from './agent-bridge-client';

const endpoint = 'http://127.0.0.1:43123';
const fragment = {
  endpoint,
  environmentId: 'prod',
  instanceId: 'bridge-instance-1',
  ticket: `ticket-${'x'.repeat(40)}`,
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('AgentBridgeFetchClient', () => {
  test('clears a valid launch fragment before returning bootstrap data', () => {
    const clear = vi.fn();
    expect(
      consumeAgentBridgeFragment({
        clear,
        deploymentEnvironment: 'prod',
        hash:
          '#endpoint=http%3A%2F%2F127.0.0.1%3A43123&environment=prod&instance=bridge-instance-1&ticket=' +
          fragment.ticket,
      }),
    ).toEqual(fragment);
    expect(clear).toHaveBeenCalledOnce();
  });

  test('clears and rejects mismatched environments or non-loopback endpoints', () => {
    const clear = vi.fn();
    expect(() =>
      consumeAgentBridgeFragment({
        clear,
        deploymentEnvironment: 'test',
        hash:
          '#endpoint=http%3A%2F%2F127.0.0.1%3A43123&environment=prod&instance=bridge-instance-1&ticket=' +
          fragment.ticket,
      }),
    ).toThrow(AgentBridgeClientError);
    expect(clear).toHaveBeenCalledOnce();
    expect(() => new AgentBridgeFetchClient('http://localhost:43123')).toThrow(
      'exact loopback origin',
    );
    expect(() => new AgentBridgeFetchClient('https://127.0.0.1:43123')).toThrow(
      'exact loopback origin',
    );
  });

  test('uses Fetch LNA hints, omits credentials, and keeps the bearer in memory', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          environmentId: 'prod',
          expiresAt: '2026-07-22T01:00:00.000Z',
          instanceId: 'bridge-instance-1',
          protocolVersion: 1,
          sessionToken: `session-${'y'.repeat(40)}`,
        }),
      )
      .mockResolvedValueOnce(jsonResponse(resourceSnapshot()));
    const client = new AgentBridgeFetchClient(
      endpoint,
      fetchImpl as unknown as typeof fetch,
    );

    const connection = await client.connect(fragment);
    expect(connection).toMatchObject({
      environmentId: 'prod',
      instanceId: 'bridge-instance-1',
      protocolVersion: 1,
    });
    expect(connection).not.toHaveProperty('sessionToken');
    await client.getResources();

    const sessionInit = fetchImpl.mock.calls[0]?.[1] as RequestInit & {
      readonly targetAddressSpace?: string;
    };
    expect(sessionInit).toMatchObject({
      cache: 'no-store',
      credentials: 'omit',
      method: 'POST',
      mode: 'cors',
      targetAddressSpace: 'loopback',
    });
    const resourceInit = fetchImpl.mock.calls[1]?.[1] as RequestInit;
    expect(resourceInit.headers).toMatchObject({
      authorization: expect.stringMatching(/^Bearer session-/),
    });
    expect(JSON.stringify(client)).not.toContain('session-');

    client.disconnect();
    await expect(client.getResources()).rejects.toThrow(
      'Open Agent settings again',
    );
  });

  test('polls with Fetch only and stops at the configured bound', async () => {
    vi.useFakeTimers();
    const websocket = vi.fn(() => {
      throw new Error('WebSocket must not be constructed');
    });
    vi.stubGlobal('WebSocket', websocket);
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          environmentId: 'prod',
          expiresAt: '2026-07-22T01:00:00.000Z',
          instanceId: 'bridge-instance-1',
          protocolVersion: 1,
          sessionToken: `session-${'y'.repeat(40)}`,
        }),
      )
      .mockImplementation(async () => jsonResponse(resourceSnapshot()));
    const client = new AgentBridgeFetchClient(
      endpoint,
      fetchImpl as unknown as typeof fetch,
    );
    await client.connect(fragment);
    const onUpdate = vi.fn();
    client.startPolling(onUpdate, { intervalMs: 1, maxAttempts: 2 });

    await vi.advanceTimersByTimeAsync(1_000);
    await vi.advanceTimersByTimeAsync(1_000);

    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(websocket).not.toHaveBeenCalled();
  });

  test('maps stable bridge failures to actionable bootstrap states', () => {
    expect(
      classifyAgentBridgeError(
        new AgentBridgeClientError('VERSION_INCOMPATIBLE', 'old'),
      ),
    ).toBe('version-incompatible');
    expect(
      classifyAgentBridgeError(
        new AgentBridgeClientError('SESSION_EXPIRED', 'old'),
      ),
    ).toBe('stale-session');
    expect(
      classifyAgentBridgeError(
        new AgentBridgeClientError('NETWORK_UNAVAILABLE', 'blocked'),
        'denied',
      ),
    ).toBe('permission-denied');
    expect(
      classifyAgentBridgeError(
        new AgentBridgeClientError('NETWORK_UNAVAILABLE', 'not listening'),
        'granted',
      ),
    ).toBe('not-running');
  });
});

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json' },
    status: 200,
  });
}

function resourceSnapshot() {
  return {
    agent: {
      backendStatus: 'connected',
      deviceName: 'Personal Agent',
      id: 'agent-1',
      processState: 'ready',
      version: '0.1.0',
    },
    autostart: { enabled: false, supported: false },
    browser: {
      executablePathConfigured: false,
      message: 'Chrome ready',
      ready: true,
      status: 'ready',
    },
    diagnostics: [],
    environment: {
      backendHttpUrl: 'https://api.example.com',
      id: 'prod',
      label: 'Production',
      webOrigin: 'https://app.example.com',
    },
    profiles: [],
    protocolVersion: 1,
    secret: { status: 'configured' },
  };
}
