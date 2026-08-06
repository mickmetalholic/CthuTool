import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  AgentObservabilityRecorder,
  type AgentRuntimeCore,
  requestAgentControl,
} from '@cthutool/agent-runtime';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { runAgentProcess } from './index';

describe('headless Agent process entry', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) {
      await rm(root, { force: true, recursive: true });
      root = undefined;
    }
  });

  test('starts local control with ownership locks and cleans up on stop', async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-agent-process-'));
    const core: AgentRuntimeCore = {
      agentClient: {
        getState: () => ({
          agentId: 'agent-process',
          backendUrl: 'http://localhost:3000',
          deviceName: 'Process Test',
          status: 'disabled',
        }),
        refreshConfig: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      } as never,
      observability: new AgentObservabilityRecorder(),
      playwrightHost: {
        executeRequest: vi.fn(async () => ({
          id: 'browser-1',
          jsonrpc: '2.0',
          result: { capturedAt: '2026-07-22T00:00:00.000Z' },
        })),
        getRuntimeDiagnostic: () => ({
          message: 'Chrome ready',
          preferredKind: 'host-chrome',
          status: 'ready',
        }),
        initialize: vi.fn(async () => undefined),
        isProfileInUse: vi.fn(() => false),
        isReady: () => true,
        setBrowserRuntime: vi.fn(),
        shutdown: vi.fn(async () => undefined),
      } as never,
      profileStore: {
        clearProfile: vi.fn(async () => undefined),
        listProfiles: vi.fn(async () => []),
        setRootDir: vi.fn(),
      } as never,
    };
    const runtime = await runAgentProcess({
      applicationVersion: '0.1.0-test',
      createRuntimeCore: () => core,
      legacyDesktopUserDataDir: join(root, 'legacy-desktop'),
      processPlatform: 'linux',
      userDataDir: root,
    });
    const instancePath = join(root, 'runtime', 'instance.json');
    const record = JSON.parse(await readFile(instancePath, 'utf8')) as {
      controlEndpoint: string;
      nonce: string;
    };

    await expect(
      requestAgentControl({
        endpoint: record.controlEndpoint,
        instanceNonce: record.nonce,
        operation: 'health',
      }),
    ).resolves.toMatchObject({
      ok: true,
      result: {
        applicationVersion: '0.1.0-test',
        process: { state: 'ready' },
      },
    });

    await expect(
      requestAgentControl({
        endpoint: record.controlEndpoint,
        instanceNonce: record.nonce,
        operation: 'environment.list',
      }),
    ).resolves.toMatchObject({
      ok: true,
      result: {
        environments: [
          { active: true, id: 'local', label: 'Local development' },
        ],
      },
    });
    await expect(
      requestAgentControl({
        endpoint: record.controlEndpoint,
        environmentId: 'unknown',
        instanceNonce: record.nonce,
        operation: 'environment.switch',
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: 'INVALID_ENVIRONMENT' },
    });
    await expect(
      requestAgentControl({
        endpoint: record.controlEndpoint,
        environmentId: 'local',
        instanceNonce: record.nonce,
        operation: 'environment.switch',
      }),
    ).resolves.toMatchObject({
      ok: true,
      result: { accepted: true, environmentId: 'local' },
    });

    const launchResponse = await requestAgentControl({
      endpoint: record.controlEndpoint,
      instanceNonce: record.nonce,
      operation: 'bridge.launch',
    });
    expect(launchResponse).toMatchObject({
      ok: true,
      result: { environmentId: 'local' },
    });
    if (!launchResponse.ok || !('launchUrl' in launchResponse.result)) {
      throw new Error('Expected Agent bridge launch response');
    }
    const launch = launchResponse.result;
    const ticket = new URLSearchParams(
      new URL(launch.launchUrl).hash.slice(1),
    ).get('ticket');
    const sessionResponse = await fetch(`${launch.endpoint}/v1/session`, {
      body: JSON.stringify({
        environmentId: 'local',
        instanceId: launch.instanceId,
        supportedVersions: [1],
        ticket,
      }),
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:5173',
      },
      method: 'POST',
    });
    expect(sessionResponse.status).toBe(200);
    const session = (await sessionResponse.json()) as {
      readonly sessionToken: string;
    };
    const resourcesResponse = await fetch(`${launch.endpoint}/v1/resources`, {
      headers: {
        authorization: `Bearer ${session.sessionToken}`,
        origin: 'http://localhost:5173',
      },
    });
    expect(resourcesResponse.status).toBe(200);
    const resources = await resourcesResponse.json();
    expect(resources).toMatchObject({
      agent: { version: '0.1.0-test' },
      environment: { id: 'local' },
    });
    expect(resources).not.toHaveProperty('secret');
    const settingsResponse = await fetch(`${launch.endpoint}/v1/rpc`, {
      body: JSON.stringify({
        id: 'settings-1',
        method: 'settings.update',
        params: { deviceName: 'Renamed Agent' },
        protocolVersion: 1,
      }),
      headers: {
        authorization: `Bearer ${session.sessionToken}`,
        'content-type': 'application/json',
        origin: 'http://localhost:5173',
      },
      method: 'POST',
    });
    expect(await settingsResponse.json()).toMatchObject({
      ok: true,
      result: { effect: 'immediate' },
    });
    const reconnectSettings = await bridgeRpc(
      launch.endpoint,
      session.sessionToken,
      'settings-reconnect',
      { connectionEnabled: false },
    );
    expect(await reconnectSettings.json()).toMatchObject({
      ok: true,
      result: { effect: 'reconnect-required' },
    });
    const restartSettings = await bridgeRpc(
      launch.endpoint,
      session.sessionToken,
      'settings-restart',
      { browserExecutablePath: '/Applications/Google Chrome.app' },
    );
    expect(await restartSettings.json()).toMatchObject({
      ok: true,
      result: { effect: 'restart-required' },
    });
    await expect(
      readFile(join(root, 'environments', 'local', 'config.json'), 'utf8'),
    ).resolves.toContain('Renamed Agent');

    await runtime.stop();

    await expect(stat(instancePath)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(stat(record.controlEndpoint)).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(
      stat(join(root, 'browser-profiles', '.cthutool-agent.lock')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('contains no Electron or embedded-window dependency', async () => {
    const source = await readFile(join(__dirname, 'index.ts'), 'utf8');

    expect(source).not.toMatch(/from ['"]electron['"]/);
    expect(source).not.toContain('BrowserWindow');
    expect(source).not.toContain('WebView');
  });

  test('fails closed when legacy data needs an explicit trusted environment', async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-agent-process-'));
    const legacy = join(root, 'legacy-desktop');
    await mkdir(legacy, { recursive: true });
    await writeFile(
      join(legacy, 'config.json'),
      JSON.stringify({
        backendUrl: 'https://retired.example.com',
        agentSecret: 'legacy-secret-must-not-appear',
      }),
    );
    const createRuntimeCore = vi.fn();

    await expect(
      runAgentProcess({
        createRuntimeCore,
        legacyDesktopUserDataDir: legacy,
        processPlatform: 'linux',
        userDataDir: join(root, 'agent'),
      }),
    ).rejects.toThrow(/select it explicitly/i);
    expect(createRuntimeCore).not.toHaveBeenCalled();
    await expect(
      readFile(
        join(root, 'agent/migration/legacy-desktop-status.json'),
        'utf8',
      ),
    ).resolves.not.toContain('legacy-secret-must-not-appear');
  });

  test('persists the exact matched release environment after first migration', async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-agent-process-'));
    const agentRoot = root;
    const legacy = join(root, 'legacy-desktop');
    await mkdir(join(legacy, 'browser-profiles/douban/main'), {
      recursive: true,
    });
    await writeFile(
      join(legacy, 'config.json'),
      JSON.stringify({
        backendUrl: 'https://api.example.com',
        deviceName: 'Legacy Mac',
      }),
    );
    await writeFile(
      join(legacy, 'browser-profiles/douban/main/profile-meta.json'),
      JSON.stringify({ profileName: 'main', siteId: 'douban' }),
    );
    const runtime = await runAgentProcess({
      applicationVersion: '0.1.0-test',
      createRuntimeCore: () => createRuntimeCoreFixture(),
      legacyDesktopUserDataDir: legacy,
      processPlatform: 'linux',
      releaseEnvironmentCatalog: {
        profiles: [
          {
            environmentId: 'production',
            label: 'Production',
            webOrigin: 'https://app.example.com',
            webAgentUrl: 'https://app.example.com/agent',
            backendHttpUrl: 'https://api.example.com',
            backendAgentWsUrl: 'wss://api.example.com/ws/agents',
            namespace: 'production',
          },
        ],
      },
      userDataDir: agentRoot,
    });
    try {
      await expect(
        readFile(join(agentRoot, 'environment.json'), 'utf8'),
      ).resolves.toContain('production');
      await expect(
        readFile(
          join(agentRoot, 'environments/production/config.json'),
          'utf8',
        ),
      ).resolves.toContain('Legacy Mac');
      await expect(
        readFile(
          join(
            agentRoot,
            'environments/production/browser-profiles/douban/main/profile-meta.json',
          ),
          'utf8',
        ),
      ).resolves.toContain('douban');
      await expect(
        readFile(join(legacy, 'config.json'), 'utf8'),
      ).resolves.toContain('Legacy Mac');
    } finally {
      await runtime.stop();
    }
  });
});

function bridgeRpc(
  endpoint: string,
  sessionToken: string,
  id: string,
  params: unknown,
): Promise<Response> {
  return fetch(`${endpoint}/v1/rpc`, {
    body: JSON.stringify({
      id,
      method: 'settings.update',
      params,
      protocolVersion: 1,
    }),
    headers: {
      authorization: `Bearer ${sessionToken}`,
      'content-type': 'application/json',
      origin: 'http://localhost:5173',
    },
    method: 'POST',
  });
}

function createRuntimeCoreFixture(): AgentRuntimeCore {
  return {
    agentClient: {
      getState: () => ({
        agentId: 'agent-migration',
        backendUrl: 'https://api.example.com',
        deviceName: 'Migration Test',
        status: 'disabled',
      }),
      refreshConfig: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    } as never,
    observability: new AgentObservabilityRecorder(),
    playwrightHost: {
      executeRequest: vi.fn(),
      getRuntimeDiagnostic: () => ({
        message: 'Chrome ready',
        preferredKind: 'host-chrome',
        status: 'ready',
      }),
      initialize: vi.fn(async () => undefined),
      isProfileInUse: vi.fn(() => false),
      isReady: () => true,
      setBrowserRuntime: vi.fn(),
      shutdown: vi.fn(async () => undefined),
    } as never,
    profileStore: {
      clearProfile: vi.fn(async () => undefined),
      listProfiles: vi.fn(async () => []),
      setRootDir: vi.fn(),
    } as never,
  };
}
