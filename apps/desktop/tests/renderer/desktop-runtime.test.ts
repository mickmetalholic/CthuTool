import { describe, expect, test, vi } from 'vitest';
import type { DesktopApi } from '../../src/renderer/src/desktop-api';
import { createDesktopRuntimeAdapter } from '../../src/renderer/src/desktop-runtime';

describe('createDesktopRuntimeAdapter', () => {
  test('bridges preload browser and window actions into the app runtime', async () => {
    const desktopApi = {
      clearBrowserProfile: vi.fn().mockResolvedValue('clear'),
      openBrowserLogin: vi.fn().mockResolvedValue('open'),
      verifyBrowserProfile: vi.fn().mockResolvedValue('verify'),
      windowAction: vi.fn().mockResolvedValue(undefined),
    } as unknown as DesktopApi;

    const runtime = createDesktopRuntimeAdapter(desktopApi);

    expect(runtime.kind).toBe('desktop');
    expect(runtime.capabilities).toMatchObject({
      canControlWindow: true,
      canReadLocalPaths: true,
      canUseLocalBrowserProfiles: true,
    });

    await runtime.actions.openBrowserLogin?.({ siteId: 'github' });
    await runtime.actions.verifyBrowserProfile?.({ siteId: 'github' });
    await runtime.actions.clearBrowserProfile?.({ siteId: 'github' });
    await runtime.actions.windowAction?.('minimize');

    expect(desktopApi.openBrowserLogin).toHaveBeenCalledWith({
      siteId: 'github',
    });
    expect(desktopApi.verifyBrowserProfile).toHaveBeenCalledWith({
      siteId: 'github',
    });
    expect(desktopApi.clearBrowserProfile).toHaveBeenCalledWith({
      siteId: 'github',
    });
    expect(desktopApi.windowAction).toHaveBeenCalledWith('minimize');
  });

  test('keeps stale preload browser actions unavailable while preserving desktop runtime kind', () => {
    const desktopApi = {
      windowAction: vi.fn().mockResolvedValue(undefined),
    } as unknown as DesktopApi;

    const runtime = createDesktopRuntimeAdapter(desktopApi);

    expect(runtime.kind).toBe('desktop');
    expect(runtime.capabilities.canControlWindow).toBe(true);
    expect(runtime.capabilities.canReadLocalPaths).toBe(true);
    expect(runtime.capabilities.canUseLocalBrowserProfiles).toBe(false);
    expect(runtime.actions.openBrowserLogin).toBeUndefined();
    expect(runtime.actions.verifyBrowserProfile).toBeUndefined();
    expect(runtime.actions.clearBrowserProfile).toBeUndefined();
  });
});
