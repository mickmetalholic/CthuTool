import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import {
  AgentConfigStore,
  JsonAgentConfigStorage,
  normalizeAgentConfig,
  resolveAgentDataPaths,
} from './config';

describe('agent runtime configuration', () => {
  let temporaryRoot: string | undefined;

  afterEach(async () => {
    if (temporaryRoot) {
      await rm(temporaryRoot, { force: true, recursive: true });
      temporaryRoot = undefined;
    }
  });

  test('resolves platform paths without moving legacy desktop data', () => {
    expect(
      resolveAgentDataPaths({
        homeDir: '/Users/mick',
        platform: 'darwin',
      }),
    ).toEqual({
      rootDir: '/Users/mick/Library/Application Support/CthuTool/agent',
      configPath:
        '/Users/mick/Library/Application Support/CthuTool/agent/config.json',
      profilesDir:
        '/Users/mick/Library/Application Support/CthuTool/agent/browser-profiles',
      runtimeDir:
        '/Users/mick/Library/Application Support/CthuTool/agent/runtime',
      logsDir: '/Users/mick/Library/Application Support/CthuTool/agent/logs',
      legacyDesktopUserDataDir:
        '/Users/mick/Library/Application Support/CthuDesktop',
    });
    expect(
      resolveAgentDataPaths({
        env: { APPDATA: 'C:\\Users\\Mick\\AppData\\Roaming' },
        homeDir: 'C:\\Users\\Mick',
        platform: 'win32',
      }).rootDir,
    ).toContain('CthuTool');
  });

  test('keeps a stable persisted Agent identity', async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'cthutool-agent-config-'));
    const configPath = join(temporaryRoot, 'config.json');
    const store = new AgentConfigStore(new JsonAgentConfigStorage(configPath), {
      backendUrl: ' https://backend.example.com/ ',
      deviceName: ' Personal Mac ',
    });

    const first = store.load();
    const second = store.load();

    expect(first.agentId).toMatch(/^agent-/);
    expect(second.agentId).toBe(first.agentId);
    expect(first.backendUrl).toBe('https://backend.example.com');
    expect(first.deviceName).toBe('Personal Mac');
    expect(JSON.parse(await readFile(configPath, 'utf8'))).toEqual(first);
  });

  test('preserves native self-use metadata when the legacy config port normalizes settings', async () => {
    temporaryRoot = await mkdtemp(
      join(tmpdir(), 'cthutool-agent-self-use-config-'),
    );
    const configPath = join(temporaryRoot, 'config.json');
    const storage = new JsonAgentConfigStorage(configPath);
    await writeFile(
      configPath,
      `${JSON.stringify({
        agentId: 'agent-self-use',
        backendUrl: 'https://app.example.com',
        browserRuntime: { kind: 'host-chrome' },
        connectionEnabled: true,
        deploymentOrigin: 'https://app.example.com',
        deviceName: 'Desk',
        schemaVersion: 1,
      })}\n`,
    );

    const normalized = new AgentConfigStore(storage).load();

    expect(normalized).toMatchObject({
      deploymentOrigin: 'https://app.example.com',
      schemaVersion: 1,
    });
    expect(JSON.parse(await readFile(configPath, 'utf8'))).toMatchObject({
      deploymentOrigin: 'https://app.example.com',
      schemaVersion: 1,
    });
  });

  test('normalizes browser and environment defaults through the config port', () => {
    expect(normalizeAgentConfig(undefined)).toMatchObject({
      activeEnvironment: { id: 'local', label: 'Local' },
      backendUrl: 'http://localhost:3000',
      browserRuntime: { kind: 'host-chrome' },
      connectionEnabled: true,
    });
  });
});
