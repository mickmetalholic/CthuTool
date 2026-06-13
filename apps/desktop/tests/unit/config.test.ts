import { describe, expect, test } from 'vitest';
import {
  DEFAULT_BACKEND_URL,
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
    expect(saved.deviceName).toBe('Desk');
    expect(saved.agentId).toMatch(/^agent-/);
    expect(loaded.agentId).toBe(saved.agentId);
  });

  test('updates editable fields without changing agent id and keeps agent enabled', () => {
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
      connectionEnabled: true,
    });
  });

  test('forces the local agent on for pre-existing persisted config', () => {
    expect(
      normalizeConfig({
        agentId: 'windows-pc',
        backendUrl: 'http://backend.local:3000/',
        deviceName: 'Windows PC',
        connectionEnabled: false,
      }),
    ).toEqual({
      agentId: 'windows-pc',
      backendUrl: 'http://backend.local:3000',
      deviceName: 'Windows PC',
      connectionEnabled: true,
    });
  });
});
