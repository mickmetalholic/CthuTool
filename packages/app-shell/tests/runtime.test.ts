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
    expect(mainNavigation).toEqual([
      { area: 'main', icon: 'home', id: 'overview', label: 'Overview' },
      {
        area: 'main',
        icon: 'browser',
        id: 'browser',
        label: 'Browser Profiles',
      },
      { area: 'main', icon: 'agents', id: 'agents', label: 'Agents' },
    ]);
    expect(settingsNavigation).toEqual([
      { area: 'settings', icon: 'service', id: 'service', label: 'Service' },
      { area: 'settings', icon: 'status', id: 'status', label: 'Status' },
      {
        area: 'settings',
        icon: 'diagnostics',
        id: 'diagnostics',
        label: 'Diagnostics',
      },
      { area: 'settings', icon: 'logs', id: 'logs', label: 'Logs' },
      {
        area: 'settings',
        icon: 'appearance',
        id: 'appearance',
        label: 'Appearance',
      },
    ]);
  });
});
