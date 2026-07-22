import { describe, expect, test, vi } from 'vitest';
import type { AgentConfigPort } from './config';
import { createAgentRuntimeCore } from './runtime-factory';

class NeverOpenedWebSocket {
  readonly readyState = 0;
  onopen = null;
  onmessage = null;
  onerror = null;
  onclose = null;
  send() {}
  close() {}
}

describe('agent runtime core factory', () => {
  test('composes connection, profile, and browser ports without Electron', () => {
    const config: AgentConfigPort = {
      load: () => ({
        activeEnvironment: { id: 'local', label: 'Local' },
        agentId: 'agent-1',
        backendUrl: 'http://localhost:3000',
        browserRuntime: { kind: 'host-chrome' },
        connectionEnabled: true,
        deviceName: 'Test Agent',
      }),
    };
    const executeRequest = vi.fn();
    const isReady = vi.fn(() => true);
    const core = createAgentRuntimeCore({
      config,
      paths: { profilesDir: '/tmp/cthutool-agent-profiles' },
      platform: 'linux',
      version: '0.1.0',
      WebSocketImpl: NeverOpenedWebSocket,
      createPlaywrightHost: () =>
        ({ executeRequest, isReady }) as unknown as ReturnType<
          NonNullable<
            Parameters<typeof createAgentRuntimeCore>[0]['createPlaywrightHost']
          >
        >,
    });

    expect(core.profileStore.profileDir('example', 'main')).toContain(
      'cthutool-agent-profiles',
    );
    expect(core.agentClient.buildHelloPayload().capabilities).toEqual([
      'browser',
    ]);
    expect(isReady).toHaveBeenCalled();
  });
});
