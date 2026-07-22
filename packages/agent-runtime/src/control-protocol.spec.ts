import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  AgentControlServer,
  requestAgentControl,
  resolveAgentControlEndpoint,
} from './control-protocol';
import type { AgentRuntimeHealth } from './runtime-service';

describe('Agent control protocol', () => {
  let root: string | undefined;
  let server: AgentControlServer | undefined;

  afterEach(async () => {
    await server?.stop();
    server = undefined;
    if (root) {
      await rm(root, { force: true, recursive: true });
      root = undefined;
    }
  });

  async function startServer() {
    root = await mkdtemp(join(tmpdir(), 'cthutool-control-'));
    const endpoint = resolveAgentControlEndpoint({
      platform: 'linux',
      runtimeDir: root,
    });
    const shutdown = vi.fn(async () => undefined);
    const issueBridgeLaunch = vi.fn(() => ({
      endpoint: 'http://127.0.0.1:43210',
      environmentId: 'prod',
      expiresAt: '2026-07-22T01:01:00.000Z',
      instanceId: 'bridge-instance-1',
      launchUrl:
        'https://app.example.com/agent#endpoint=http%3A%2F%2F127.0.0.1%3A43210&environment=prod&instance=bridge-instance-1&ticket=secret-fragment',
    }));
    let activeEnvironmentId = 'prod';
    const listEnvironments = vi.fn(() => [
      {
        active: activeEnvironmentId === 'prod',
        id: 'prod',
        label: 'Production',
      },
      {
        active: activeEnvironmentId === 'staging',
        id: 'staging',
        label: 'Staging',
      },
    ]);
    const switchEnvironment = vi.fn(async (environmentId: string) => {
      if (environmentId === 'unknown') {
        throw new Error('Unknown Agent environment "unknown"');
      }
      activeEnvironmentId = environmentId;
    });
    const health: AgentRuntimeHealth = {
      applicationVersion: '0.1.0',
      protocolVersion: 1,
      process: {
        state: 'ready',
        startedAt: '2026-07-22T01:00:00.000Z',
        stateChangedAt: '2026-07-22T01:00:00.000Z',
      },
      backend: { status: 'disconnected' },
      browser: { ready: true, status: 'ready', message: 'Chrome ready' },
    };
    server = new AgentControlServer({
      endpoint,
      getHealth: () => health,
      instanceNonce: 'instance-nonce',
      issueBridgeLaunch,
      listEnvironments,
      platform: 'linux',
      shutdown,
      switchEnvironment,
    });
    await server.start();
    return {
      endpoint,
      health,
      issueBridgeLaunch,
      listEnvironments,
      shutdown,
      switchEnvironment,
    };
  }

  test('returns versioned health over a user-private Unix socket', async () => {
    const { endpoint, health } = await startServer();

    await expect(
      requestAgentControl({
        endpoint,
        instanceNonce: 'instance-nonce',
        operation: 'health',
      }),
    ).resolves.toEqual({ ok: true, protocolVersion: 1, result: health });
    expect((await stat(endpoint)).mode & 0o777).toBe(0o600);
  });

  test('rejects wrong nonce and incompatible protocol without health details', async () => {
    const { endpoint } = await startServer();

    const wrongNonce = await requestAgentControl({
      endpoint,
      instanceNonce: 'wrong',
      operation: 'status',
    });
    const wrongVersion = await requestAgentControl({
      endpoint,
      instanceNonce: 'instance-nonce',
      operation: 'health',
      protocolVersion: 99,
    });

    expect(wrongNonce).toMatchObject({
      ok: false,
      error: { code: 'UNAUTHORIZED_INSTANCE' },
    });
    expect(wrongVersion).toMatchObject({
      ok: false,
      error: { code: 'INCOMPATIBLE_PROTOCOL' },
    });
    expect(JSON.stringify(wrongNonce)).not.toContain('Chrome ready');
  });

  test('acknowledges shutdown before invoking coordinated stop', async () => {
    const { endpoint, shutdown } = await startServer();

    await expect(
      requestAgentControl({
        endpoint,
        instanceNonce: 'instance-nonce',
        operation: 'shutdown',
      }),
    ).resolves.toEqual({
      ok: true,
      protocolVersion: 1,
      result: { accepted: true },
    });
    await vi.waitFor(() => expect(shutdown).toHaveBeenCalledOnce());
  });

  test('issues a browser launch URL only through authenticated local control', async () => {
    const { endpoint, issueBridgeLaunch } = await startServer();

    const response = await requestAgentControl({
      endpoint,
      instanceNonce: 'instance-nonce',
      operation: 'bridge.launch',
    });

    expect(response).toMatchObject({
      ok: true,
      result: {
        endpoint: 'http://127.0.0.1:43210',
        environmentId: 'prod',
      },
    });
    expect(issueBridgeLaunch).toHaveBeenCalledOnce();
  });

  test('derives stable user-scoped Windows pipe names', () => {
    expect(
      resolveAgentControlEndpoint({
        platform: 'win32',
        runtimeDir: 'C:\\Users\\Mick\\AppData\\Roaming\\CthuAgent\\runtime',
      }),
    ).toMatch(/^\\\\\.\\pipe\\cthutool-agent-[a-f0-9]{20}$/);
  });

  test('lists sanitized environments and switches through the runtime', async () => {
    const { endpoint, listEnvironments, switchEnvironment } =
      await startServer();

    await expect(
      requestAgentControl({
        endpoint,
        instanceNonce: 'instance-nonce',
        operation: 'environment.list',
      }),
    ).resolves.toMatchObject({
      ok: true,
      result: {
        environments: [
          { active: true, id: 'prod', label: 'Production' },
          { active: false, id: 'staging', label: 'Staging' },
        ],
      },
    });
    await expect(
      requestAgentControl({
        endpoint,
        environmentId: 'staging',
        instanceNonce: 'instance-nonce',
        operation: 'environment.switch',
      }),
    ).resolves.toMatchObject({
      ok: true,
      result: { accepted: true, environmentId: 'staging' },
    });
    expect(listEnvironments).toHaveBeenCalledOnce();
    expect(switchEnvironment).toHaveBeenCalledWith('staging');
  });

  test('rejects missing and unknown environment ids without changing state', async () => {
    const { endpoint, switchEnvironment } = await startServer();

    await expect(
      requestAgentControl({
        endpoint,
        instanceNonce: 'instance-nonce',
        operation: 'environment.switch',
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: 'INVALID_ENVIRONMENT' },
    });
    await expect(
      requestAgentControl({
        endpoint,
        environmentId: 'unknown',
        instanceNonce: 'instance-nonce',
        operation: 'environment.switch',
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: 'INVALID_ENVIRONMENT' },
    });
    expect(switchEnvironment).toHaveBeenCalledOnce();
  });
});
