import { mainNavigation, settingsNavigation } from '../src/navigation';
import { createDesktopRuntime, webRuntime } from '../src/runtime';

describe('app shell runtime contracts', () => {
  it('keeps web runtime capabilities disabled by default', () => {
    expect(webRuntime.kind).toBe('web');
    expect(webRuntime.capabilities).toEqual({
      canControlWindow: false,
      canReadLocalPaths: false,
      canUseLocalBrowserProfiles: false,
    });
  });

  it('derives desktop capabilities from host actions', () => {
    const runtime = createDesktopRuntime({
      openBrowserLogin: async () => undefined,
      windowAction: () => undefined,
    });

    expect(runtime.kind).toBe('desktop');
    expect(runtime.capabilities).toEqual({
      canControlWindow: true,
      canReadLocalPaths: true,
      canUseLocalBrowserProfiles: true,
    });
  });

  it('exposes stable main and settings navigation entries', () => {
    expect(mainNavigation.map((item) => item.id)).toEqual([
      'overview',
      'browser',
      'agents',
    ]);
    expect(settingsNavigation.map((item) => item.id)).toEqual([
      'service',
      'status',
      'diagnostics',
      'logs',
      'appearance',
    ]);
  });
});
