import { describe, expect, test } from 'vitest';
import {
  DEFAULT_APPEARANCE,
  DEFAULT_BACKEND_URL,
  DEFAULT_BROWSER_RUNTIME,
  type DesktopConfig,
  type DesktopConfigStorage,
  DesktopConfigStore,
  normalizeConfig,
} from '../../src/main/config';

class MemoryStorage implements DesktopConfigStorage {
  value?: Partial<DesktopConfig>;

  read() {
    return this.value;
  }

  write(config: DesktopConfig) {
    this.value = config;
  }
}

describe('desktop config', () => {
  test('normalizes defaults and generates stable persisted identity', () => {
    const storage = new MemoryStorage();
    const store = new DesktopConfigStore(storage);

    const saved = store.savePatch({ deviceName: ' Desk ' });
    const loaded = store.load();

    expect(saved.backendUrl).toBe(DEFAULT_BACKEND_URL);
    expect(saved.activeEnvironmentId).toBe('local');
    expect(saved.activeEnvironment).toEqual({
      id: 'local',
      label: 'Local',
      backendUrl: DEFAULT_BACKEND_URL,
    });
    expect(saved.appearance).toEqual(DEFAULT_APPEARANCE);
    expect(saved.browserRuntime).toEqual(DEFAULT_BROWSER_RUNTIME);
    expect(saved.deviceName).toBe('Desk');
    expect(saved.agentId).toMatch(/^agent-/);
    expect(loaded.agentId).toBe(saved.agentId);
  });

  test('updates editable fields without changing agent id', () => {
    const storage = new MemoryStorage();
    const store = new DesktopConfigStore(storage);

    const first = store.savePatch({
      backendUrl: 'http://homelab.local:3000/',
      deviceName: 'Homelab',
    });
    const second = store.savePatch({
      backendUrl: 'http://backend.local:3000',
      deviceName: 'Renamed',
      connectionEnabled: false,
    });

    expect(second).toEqual({
      ...first,
      backendUrl: 'http://backend.local:3000',
      deviceName: 'Renamed',
      connectionEnabled: false,
      activeEnvironment: {
        ...first.activeEnvironment,
        backendUrl: 'http://backend.local:3000',
      },
      environmentProfiles: [
        {
          ...first.environmentProfiles[0],
          backendUrl: 'http://backend.local:3000',
        },
      ],
    });
  });

  test('migrates a pre-existing persisted backend url into the local profile', () => {
    expect(
      normalizeConfig({
        agentId: 'windows-pc',
        backendUrl: 'http://backend.local:3000/',
        deviceName: 'Windows PC',
        connectionEnabled: true,
      }),
    ).toMatchObject({
      agentId: 'windows-pc',
      backendUrl: 'http://backend.local:3000',
      deviceName: 'Windows PC',
      connectionEnabled: true,
      activeEnvironmentId: 'local',
      activeEnvironment: {
        id: 'local',
        label: 'Local',
        backendUrl: 'http://backend.local:3000',
      },
      appearance: DEFAULT_APPEARANCE,
      browserRuntime: DEFAULT_BROWSER_RUNTIME,
    });
  });

  test('migrates old config files to host Chrome browser runtime by default', () => {
    const storage = new MemoryStorage();
    storage.value = {
      agentId: 'agent-old',
      deviceName: 'Old Desk',
      environmentProfiles: [
        {
          id: 'local',
          label: 'Local',
          backendUrl: 'http://localhost:3000',
        },
      ],
    };
    const store = new DesktopConfigStore(storage);

    const loaded = store.load();

    expect(loaded.browserRuntime).toEqual({ kind: 'host-chrome' });
    expect(storage.value?.browserRuntime).toEqual({ kind: 'host-chrome' });
  });

  test('normalizes removed Chromium runtime mode back to host Chrome', () => {
    expect(
      normalizeConfig({
        browserRuntime: { kind: 'playwright-chromium' } as never,
      }).browserRuntime,
    ).toEqual({ kind: 'host-chrome' });
  });

  test('normalizes explicit host Chrome executable path', () => {
    expect(
      normalizeConfig({
        browserRuntime: {
          kind: 'host-chrome',
          executablePath:
            ' C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe ',
        },
      }).browserRuntime,
    ).toEqual({
      kind: 'host-chrome',
      executablePath:
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });
  });

  test('uses packaged test and production environment defaults', () => {
    expect(normalizeConfig(undefined, { isPackaged: true })).toMatchObject({
      activeEnvironmentId: 'test',
      environmentProfiles: [
        { id: 'test', label: 'Test' },
        { id: 'production', label: 'Production' },
      ],
    });
  });

  test('switches active environment and updates that backend url', () => {
    const storage = new MemoryStorage();
    const store = new DesktopConfigStore(storage, { isPackaged: true });
    const first = store.load();
    const second = store.savePatch({
      activeEnvironmentId: 'production',
      backendUrl: 'https://api.example.com',
    });

    expect(second.activeEnvironmentId).toBe('production');
    expect(second.backendUrl).toBe('https://api.example.com');
    expect(second.agentId).toBe(first.agentId);
    expect(second.environmentProfiles[1]).toMatchObject({
      id: 'production',
      backendUrl: 'https://api.example.com',
    });
  });

  test('normalizes persisted window state for restore', () => {
    expect(
      normalizeConfig({
        windowState: {
          x: 42,
          y: 64,
          width: 320,
          height: 420,
          isMaximized: true,
        },
      }).windowState,
    ).toEqual({
      x: 42,
      y: 64,
      width: 860,
      height: 600,
      isMaximized: true,
    });
  });
});
