import { describe, expect, test } from 'vitest';
import { getDesktopApi } from '../../src/renderer/src/desktop-api';

describe('getDesktopApi', () => {
  test('returns the preload API when the desktop host exposes it', async () => {
    const hostApi = {
      getConfig: async () => ({ agentId: 'host' }),
    };
    Object.defineProperty(window, 'cthutoolDesktop', {
      configurable: true,
      value: hostApi,
    });

    expect(getDesktopApi()).toBe(hostApi);
  });

  test('returns a web-safe fallback when opened without the desktop preload', async () => {
    Object.defineProperty(window, 'cthutoolDesktop', {
      configurable: true,
      value: undefined,
    });

    const api = getDesktopApi();

    await expect(api.getConfig()).resolves.toMatchObject({
      agentId: 'web-preview',
      activeEnvironmentId: 'local',
      backendUrl: 'http://localhost:3000',
    });
    await expect(api.getConnectionState()).resolves.toMatchObject({
      status: 'disconnected',
      agentId: 'web-preview',
    });
    expect(api.onConnectionStateChange(() => undefined)).toEqual(
      expect.any(Function),
    );
    await expect(api.windowAction('minimize')).resolves.toBeUndefined();
  });
});
