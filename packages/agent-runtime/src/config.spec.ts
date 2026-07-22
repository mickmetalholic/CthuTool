import { mkdtemp, readFile, rm } from 'node:fs/promises';
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
      rootDir: '/Users/mick/Library/Application Support/CthuAgent',
      configPath:
        '/Users/mick/Library/Application Support/CthuAgent/config.json',
      profilesDir:
        '/Users/mick/Library/Application Support/CthuAgent/browser-profiles',
      runtimeDir: '/Users/mick/Library/Application Support/CthuAgent/runtime',
      logsDir: '/Users/mick/Library/Application Support/CthuAgent/logs',
      legacyDesktopUserDataDir:
        '/Users/mick/Library/Application Support/CthuDesktop',
    });
    expect(
      resolveAgentDataPaths({
        env: { APPDATA: 'C:\\Users\\Mick\\AppData\\Roaming' },
        homeDir: 'C:\\Users\\Mick',
        platform: 'win32',
      }).rootDir,
    ).toContain('CthuAgent');
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

  test('normalizes browser and environment defaults through the config port', () => {
    expect(normalizeAgentConfig(undefined)).toMatchObject({
      activeEnvironment: { id: 'local', label: 'Local' },
      backendUrl: 'http://localhost:3000',
      browserRuntime: { kind: 'host-chrome' },
      connectionEnabled: true,
    });
  });
});
