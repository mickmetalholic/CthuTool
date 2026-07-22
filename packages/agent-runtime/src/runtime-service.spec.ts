import { describe, expect, test, vi } from 'vitest';
import { AgentObservabilityRecorder } from './observability';
import type { AgentRuntimeCore } from './runtime-factory';
import { AgentRuntimeService } from './runtime-service';

function createCore(input: {
  readonly browserReady: boolean;
  readonly initialize?: () => Promise<void>;
}): AgentRuntimeCore {
  return {
    agentClient: {
      getState: () => ({
        agentId: 'agent-1',
        backendUrl: 'https://backend.example.com',
        deviceName: 'Test Agent',
        status: 'disconnected',
      }),
      start: vi.fn(),
      stop: vi.fn(),
      refreshConfig: vi.fn(),
    } as never,
    observability: new AgentObservabilityRecorder(),
    playwrightHost: {
      getRuntimeDiagnostic: () => ({
        message: input.browserReady ? 'Chrome ready' : 'Chrome unavailable',
        preferredKind: 'host-chrome',
        status: input.browserReady ? 'ready' : 'unavailable',
      }),
      initialize: input.initialize ?? vi.fn(async () => undefined),
      isReady: () => input.browserReady,
      shutdown: vi.fn(async () => undefined),
    } as never,
    profileStore: { setRootDir: vi.fn() } as never,
  };
}

describe('AgentRuntimeService', () => {
  test('reports starting before browser initialization and then ready', async () => {
    let resolveInitialization: (() => void) | undefined;
    const initialization = new Promise<void>((resolve) => {
      resolveInitialization = resolve;
    });
    const core = createCore({
      browserReady: true,
      initialize: () => initialization,
    });
    const service = new AgentRuntimeService({
      applicationVersion: '0.1.0',
      core,
      now: () => new Date('2026-07-22T01:00:00.000Z'),
    });

    const started = service.start();
    expect(service.getHealth()).toMatchObject({
      applicationVersion: '0.1.0',
      process: { state: 'starting' },
      backend: { status: 'disconnected' },
      browser: { ready: true },
    });
    resolveInitialization?.();
    await started;

    expect(service.getHealth().process.state).toBe('ready');
    expect(core.agentClient.start).toHaveBeenCalledOnce();
  });

  test('keeps process health separate from unavailable browser capability', async () => {
    const service = new AgentRuntimeService({
      applicationVersion: '0.1.0',
      core: createCore({ browserReady: false }),
    });

    await service.start();

    expect(service.getHealth()).toMatchObject({
      process: { state: 'degraded' },
      backend: { status: 'disconnected' },
      browser: { ready: false, status: 'unavailable' },
    });
  });

  test('stops idempotently through the Agent client lifecycle', async () => {
    const core = createCore({ browserReady: true });
    const service = new AgentRuntimeService({
      applicationVersion: '0.1.0',
      core,
    });
    await service.start();

    await Promise.all([service.stop(), service.stop()]);

    expect(service.getHealth().process.state).toBe('stopped');
    expect(core.agentClient.stop).toHaveBeenCalledOnce();
    expect(core.playwrightHost.shutdown).toHaveBeenCalledOnce();
  });

  test('does not become ready when shutdown wins an initialization race', async () => {
    let resolveInitialization: (() => void) | undefined;
    const core = createCore({
      browserReady: true,
      initialize: () =>
        new Promise<void>((resolve) => {
          resolveInitialization = resolve;
        }),
    });
    const service = new AgentRuntimeService({
      applicationVersion: '0.1.0',
      core,
    });

    const starting = service.start();
    await service.stop();
    resolveInitialization?.();
    await starting;

    expect(service.getHealth().process.state).toBe('stopped');
    expect(core.agentClient.start).not.toHaveBeenCalled();
  });

  test('switches environment through a closed browser boundary and new namespace', async () => {
    const core = createCore({ browserReady: true });
    (core.agentClient as unknown as { getState: () => unknown }).getState =
      () => ({
        agentId: 'agent-1',
        backendUrl: 'https://test.example.com',
        deviceName: 'Test Agent',
        environmentId: 'test',
        environmentLabel: 'Test',
        status: 'connected',
      });
    let active = 'prod';
    const invalidateBridgeTickets = vi.fn();
    const localBridge = {
      getInfo: vi.fn(),
      invalidate: vi.fn(),
      issueLaunch: vi.fn(),
      start: vi.fn(async () => undefined),
      stop: vi.fn(async () => undefined),
    };
    const environment = {
      getActiveProfile: () => ({ environmentId: active }),
      getActivePaths: vi.fn(),
      listProfiles: () => [
        { environmentId: 'prod' },
        { environmentId: 'test' },
      ],
      load: vi.fn(),
      selectEnvironment: (environmentId: string) => {
        const changed = active !== environmentId;
        active = environmentId;
        return {
          changed,
          paths: { profilesDir: `/data/${environmentId}/profiles` },
          profile: { environmentId },
        };
      },
    } as never;
    const service = new AgentRuntimeService({
      applicationVersion: '0.1.0',
      core,
      createLocalBridge: () => localBridge,
      environment,
      invalidateBridgeTickets,
    });
    await service.start();

    await service.switchEnvironment('test');

    expect(core.agentClient.stop).toHaveBeenCalledOnce();
    expect(core.playwrightHost.shutdown).toHaveBeenCalledOnce();
    expect(invalidateBridgeTickets).toHaveBeenCalledOnce();
    expect(localBridge.invalidate).toHaveBeenCalledOnce();
    expect(core.profileStore.setRootDir).toHaveBeenCalledWith(
      '/data/test/profiles',
    );
    expect(core.agentClient.refreshConfig).toHaveBeenCalledOnce();
    expect(service.getHealth().process.state).toBe('ready');

    await service.switchEnvironment('test');
    expect(core.agentClient.stop).toHaveBeenCalledOnce();
    await service.stop();
    expect(localBridge.stop).toHaveBeenCalledOnce();
  });

  test('keeps a failed target environment selected in degraded state', async () => {
    const initialize = vi
      .fn<() => Promise<void>>()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('target unavailable'));
    const core = createCore({ browserReady: false, initialize });
    let active = 'prod';
    const service = new AgentRuntimeService({
      applicationVersion: '0.1.0',
      core,
      environment: {
        getActiveProfile: () => ({ environmentId: active }),
        getActivePaths: vi.fn(),
        listProfiles: () => [
          { environmentId: 'prod' },
          { environmentId: 'test' },
        ],
        load: vi.fn(),
        selectEnvironment: (environmentId: string) => {
          active = environmentId;
          return {
            changed: true,
            paths: { profilesDir: `/data/${environmentId}/profiles` },
            profile: { environmentId },
          };
        },
      } as never,
    });
    await service.start();

    await service.switchEnvironment('test');

    expect(active).toBe('test');
    expect(service.getHealth().process.state).toBe('degraded');
  });
});
