import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import type { AgentConfigPort } from './config';
import { resolveAgentDataPaths } from './config';
import {
  AgentEnvironmentManager,
  JsonAgentEnvironmentStorage,
  loadAgentEnvironmentCatalog,
  resolveAgentEnvironmentDataPaths,
} from './environment';

const releaseCatalog = {
  profiles: [
    {
      environmentId: 'prod',
      label: 'Production',
      webOrigin: 'https://app.example.com',
      webAgentUrl: 'https://app.example.com/agent',
      backendHttpUrl: 'https://api.example.com',
      backendAgentWsUrl: 'wss://api.example.com/ws/agents',
      namespace: 'prod',
    },
    {
      environmentId: 'test',
      label: 'Test',
      webOrigin: 'https://test.example.com',
      webAgentUrl: 'https://test.example.com/agent',
      backendHttpUrl: 'https://test-api.example.com',
      backendAgentWsUrl: 'wss://test-api.example.com/ws/agents',
      namespace: 'test',
    },
  ],
};

describe('Agent environment catalog and storage', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) {
      await rm(root, { force: true, recursive: true });
      root = undefined;
    }
  });

  test('loads release-controlled profiles and rejects unsafe origins', () => {
    const catalog = loadAgentEnvironmentCatalog({ releaseCatalog });
    expect(catalog.profiles.map((profile) => profile.environmentId)).toEqual([
      'prod',
      'test',
    ]);
    expect(catalog.profiles[0].trust).toBe('release');

    expect(() =>
      loadAgentEnvironmentCatalog({
        releaseCatalog: {
          profiles: [
            {
              ...releaseCatalog.profiles[0],
              webOrigin: 'https://app.example.com/path',
            },
          ],
        },
      }),
    ).toThrow(/exact origin/);
    expect(() =>
      loadAgentEnvironmentCatalog({
        releaseCatalog: {
          profiles: [
            {
              ...releaseCatalog.profiles[0],
              backendAgentWsUrl: 'ws://api.example.com/ws/agents',
            },
          ],
        },
      }),
    ).toThrow(/secure production protocol|WSS/);
  });

  test('requires an explicit non-production opt-in for custom profiles', () => {
    expect(() =>
      loadAgentEnvironmentCatalog({
        allowCustomDevelopmentProfiles: true,
        customDevelopmentCatalogPath: '/does/not/matter.json',
        nodeEnv: 'production',
      }),
    ).toThrow(/non-production/);
  });

  test('persists one selection and isolates profiles, config, and logs', async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-environments-'));
    const paths = resolveAgentDataPaths({ rootDir: root });
    const baseConfig: AgentConfigPort = {
      load: () => ({
        activeEnvironment: { id: 'prod', label: 'Production' },
        agentId: 'agent-1',
        backendUrl: 'https://api.example.com',
        browserRuntime: { kind: 'host-chrome' },
        connectionEnabled: true,
        deviceName: 'Test Agent',
      }),
    };
    const storage = new JsonAgentEnvironmentStorage(paths);
    const manager = new AgentEnvironmentManager(
      baseConfig,
      loadAgentEnvironmentCatalog({ releaseCatalog }),
      paths,
      storage,
    );

    const prodPaths = resolveAgentEnvironmentDataPaths(
      paths,
      manager.listProfiles()[0],
    );
    const testPaths = resolveAgentEnvironmentDataPaths(
      paths,
      manager.listProfiles()[1],
    );
    expect(prodPaths).not.toEqual(testPaths);
    expect(prodPaths.profilesDir).not.toBe(testPaths.profilesDir);
    expect(prodPaths.configPath).not.toBe(testPaths.configPath);
    expect(prodPaths.logsDir).not.toBe(testPaths.logsDir);

    await mkdir(prodPaths.rootDir, { recursive: true });
    await writeFile(
      join(prodPaths.rootDir, 'config.json'),
      `${JSON.stringify({ deviceName: 'Prod Agent' }, null, 2)}\n`,
    );
    await writeFile(join(prodPaths.rootDir, 'agent-secret'), 'legacy-secret\n');

    expect(manager.selectEnvironment('test').changed).toBe(true);
    expect(manager.load()).toMatchObject({
      activeEnvironment: {
        id: 'test',
        webOrigin: 'https://test.example.com',
      },
      agentWsUrl: 'wss://test-api.example.com/ws/agents',
      backendUrl: 'https://test-api.example.com',
    });
    expect(manager.load()).not.toHaveProperty('agentSecret');
    expect(manager.selectEnvironment('test').changed).toBe(false);

    expect(
      await readFile(join(prodPaths.rootDir, 'config.json'), 'utf8'),
    ).toContain('Prod Agent');
    expect(
      await readFile(join(prodPaths.rootDir, 'agent-secret'), 'utf8'),
    ).toBe('legacy-secret\n');
  });
});
