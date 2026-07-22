import { createBrowserRuntimeSuccessResponse } from '@cthutool/browser-runtime-protocol';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { AgentConfigPort } from './config';
import {
  AGENT_RUNTIME_PARITY_BROWSER_REQUEST,
  AGENT_RUNTIME_PARITY_CONFIG,
  AGENT_RUNTIME_PARITY_REGISTERED_MESSAGE,
} from './protocol-parity-fixtures';
import { createAgentRuntimeCore } from './runtime-factory';
import { AgentRuntimeService } from './runtime-service';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  readonly sent: string[] = [];
  readonly readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.onclose?.();
  }

  open() {
    this.onopen?.();
  }

  receive(data: unknown) {
    this.onmessage?.({ data });
  }
}

describe('headless Agent runtime integration', () => {
  afterEach(() => {
    FakeWebSocket.instances = [];
    vi.useRealTimers();
  });

  function createRuntime(input: {
    readonly browserReady: boolean;
    readonly executeRequest?: (request: {
      readonly id: string | number;
    }) => Promise<unknown>;
  }) {
    const config: AgentConfigPort = {
      load: () => ({
        ...AGENT_RUNTIME_PARITY_CONFIG,
      }),
    };
    const browserHost = {
      executeRequest:
        input.executeRequest ??
        (async (request: { readonly id: string | number }) =>
          createBrowserRuntimeSuccessResponse(request.id, {
            capturedAt: '2026-07-22T01:00:00.000Z',
            detection: { kind: 'ok' },
            finalUrl: 'https://example.com/',
          })),
      getRuntimeDiagnostic: () => ({
        message: input.browserReady ? 'Chrome ready' : 'Chrome unavailable',
        preferredKind: 'host-chrome',
        status: input.browserReady ? 'ready' : 'unavailable',
      }),
      initialize: vi.fn(async () => undefined),
      isReady: () => input.browserReady,
      shutdown: vi.fn(async () => undefined),
    };
    const core = createAgentRuntimeCore({
      config,
      paths: { profilesDir: '/tmp/cthutool-headless-integration' },
      platform: 'linux',
      version: '0.1.0',
      WebSocketImpl: FakeWebSocket,
      createPlaywrightHost: () => browserHost as never,
    });
    return {
      core,
      service: new AgentRuntimeService({
        applicationVersion: '0.1.0',
        core,
      }),
    };
  }

  test('survives backend outage and reconnects with bounded delay', async () => {
    vi.useFakeTimers();
    const { core, service } = createRuntime({ browserReady: true });
    await service.start();

    FakeWebSocket.instances[0].close();
    expect(core.agentClient.getState().status).toBe('reconnecting');
    await vi.advanceTimersByTimeAsync(2_000);

    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(service.getHealth().process.state).toBe('ready');
    await service.stop();
  });

  test('advertises no browser capability when host Chrome is unavailable', async () => {
    const { service } = createRuntime({ browserReady: false });
    await service.start();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.receive(AGENT_RUNTIME_PARITY_REGISTERED_MESSAGE);

    expect(service.getHealth()).toMatchObject({
      process: { state: 'degraded' },
      browser: { ready: false, status: 'unavailable' },
    });
    expect(JSON.parse(socket.sent[0])).toMatchObject({
      type: 'agent.hello',
      payload: { capabilities: [] },
    });
    await service.stop();
  });

  test('preserves command correlation and rejects out-of-contract commands', async () => {
    const { service } = createRuntime({ browserReady: true });
    await service.start();
    const socket = FakeWebSocket.instances[0];
    socket.receive(AGENT_RUNTIME_PARITY_REGISTERED_MESSAGE);
    socket.receive(AGENT_RUNTIME_PARITY_BROWSER_REQUEST);
    await vi.waitFor(() => expect(socket.sent).toHaveLength(1));
    expect(JSON.parse(socket.sent[0])).toMatchObject({
      id: 'parity-command',
      result: { detection: { kind: 'ok' } },
    });

    socket.receive(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 'command-invalid',
        method: 'browser.evaluate',
        params: { script: 'return process.env' },
      }),
    );
    await vi.waitFor(() => expect(socket.sent).toHaveLength(2));
    expect(JSON.parse(socket.sent[1])).toMatchObject({
      id: 'command-invalid',
      error: { code: -32602 },
    });
    expect(socket.sent[1]).not.toContain('process.env');
    await service.stop();
  });
});
