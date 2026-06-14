import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { App } from '../../src/renderer/src/App';
import type { DesktopApi } from '../../src/renderer/src/desktop-api';

function createDesktopApi(): DesktopApi {
  return {
    getConfig: vi.fn().mockResolvedValue({
      backendUrl: 'http://backend.local:3000',
      agentId: 'windows-pc',
      deviceName: 'Windows PC',
      connectionEnabled: true,
      activeEnvironmentId: 'local',
      activeEnvironment: {
        id: 'local',
        label: 'Local',
        backendUrl: 'http://backend.local:3000',
      },
      environmentProfiles: [
        {
          id: 'local',
          label: 'Local',
          backendUrl: 'http://backend.local:3000',
        },
      ],
      appearance: {
        mode: 'dark',
        colorScheme: 'dracula',
      },
      browserRuntime: {
        kind: 'host-chrome',
      },
    }),
    getAppInfo: vi.fn().mockResolvedValue({
      browserProfilesDir:
        'C:\\Users\\yuans\\AppData\\Roaming\\CthuDesktop\\browser-profiles',
      browserRuntime: {
        activeKind: 'host-chrome',
        message: 'Using host Google Chrome for browser automation',
        preferredKind: 'host-chrome',
        status: 'ready',
      },
      configPath:
        'C:\\Users\\yuans\\AppData\\Roaming\\CthuDesktop\\config.json',
      userDataDir: 'C:\\Users\\yuans\\AppData\\Roaming\\CthuDesktop',
      version: '0.0.0',
      platform: 'win32',
      isPackaged: false,
    }),
    saveConfig: vi.fn().mockImplementation(async (patch) => ({
      backendUrl: patch.backendUrl ?? 'http://backend.local:3000',
      agentId: 'windows-pc',
      deviceName: patch.deviceName ?? 'Windows PC',
      connectionEnabled: patch.connectionEnabled ?? true,
      activeEnvironmentId: patch.activeEnvironmentId ?? 'local',
      activeEnvironment: {
        id: patch.activeEnvironmentId ?? 'local',
        label: 'Local',
        backendUrl: patch.backendUrl ?? 'http://backend.local:3000',
      },
      environmentProfiles: [
        {
          id: 'local',
          label: 'Local',
          backendUrl: patch.backendUrl ?? 'http://backend.local:3000',
        },
      ],
      appearance: patch.appearance ?? {
        mode: 'dark',
        colorScheme: 'dracula',
      },
      browserRuntime: patch.browserRuntime ?? {
        kind: 'host-chrome',
      },
    })),
    getConnectionState: vi.fn().mockResolvedValue({
      status: 'connected',
      backendUrl: 'http://backend.local:3000',
      agentId: 'windows-pc',
      deviceName: 'Windows PC',
      environmentLabel: 'Local',
      lastRegisteredAt: '2026-06-13T10:00:00.000Z',
    }),
    getLocalPendingAuthTasks: vi.fn().mockResolvedValue([]),
    openBrowserLogin: vi.fn().mockResolvedValue(undefined),
    verifyBrowserProfile: vi.fn().mockResolvedValue(undefined),
    clearBrowserProfile: vi.fn().mockResolvedValue(undefined),
    windowAction: vi.fn().mockResolvedValue(undefined),
    onConnectionStateChange: vi.fn().mockReturnValue(() => undefined),
  };
}

describe('CthuDesktop shell', () => {
  function createFetchBrowserStatus() {
    return vi.fn().mockResolvedValue({
      pendingAuthTasks: [
        {
          id: 'agent-1:douban:douban-main',
          agentId: 'agent-1',
          siteId: 'douban',
          profileName: 'douban-main',
          reason: 'missing',
          updatedAt: '2026-06-13T10:00:00.000Z',
        },
      ],
      profiles: [
        {
          agentId: 'agent-1',
          displayName: 'Cthu User',
          externalUserId: '50353979',
          siteId: 'douban',
          profileName: 'douban-main',
          status: 'verified',
          updatedAt: '2026-06-13T10:00:00.000Z',
          verifiedAt: '2026-06-13T10:00:00.000Z',
        },
      ],
      sites: [
        {
          siteId: 'douban',
          displayName: 'Douban',
          allowedOrigins: ['https://movie.douban.com'],
          authPolicy: 'required',
          profileName: 'douban-main',
          loginUrl: 'https://accounts.douban.com/passport/login',
          verifyUrl: 'https://www.douban.com/mine/',
        },
      ],
    });
  }

  function primaryNavButton(name: string) {
    return within(screen.getByLabelText('Primary')).getByRole('button', {
      name,
    });
  }

  test('renders app shell overview and connected agents', async () => {
    const desktopApi = createDesktopApi();
    const fetchAgents = vi.fn().mockResolvedValue([
      {
        agentId: 'windows-pc',
        connectionId: 'conn-1',
        deviceName: 'Windows PC',
        platform: 'win32',
        version: '0.1.0',
        capabilities: [],
        connectedAt: '2026-06-13T10:00:00.000Z',
        lastSeenAt: '2026-06-13T10:00:01.000Z',
        state: 'online',
      },
    ]);

    render(
      <App
        desktopApi={desktopApi}
        fetchAgents={fetchAgents}
        fetchBrowserStatus={createFetchBrowserStatus()}
      />,
    );

    expect(await screen.findByText('CthuDesktop')).toBeInTheDocument();
    expect(await screen.findAllByText('Connected')).not.toHaveLength(0);
    expect(document.documentElement.dataset.mode).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dracula');
    expect(screen.getAllByText('Overview')).not.toHaveLength(0);
    await userEvent.click(primaryNavButton('Agents'));
    expect(await screen.findByText('windows-pc')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  test('opens settings and saves edited backend settings without changing agent id', async () => {
    const desktopApi = createDesktopApi();

    render(
      <App
        desktopApi={desktopApi}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={createFetchBrowserStatus()}
      />,
    );

    await userEvent.click(
      await screen.findByRole('button', { name: 'Settings' }),
    );
    const backendUrl = await screen.findByDisplayValue(
      'http://backend.local:3000',
    );
    await userEvent.clear(backendUrl);
    await userEvent.type(backendUrl, 'http://homelab.local:3000');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(desktopApi.saveConfig).toHaveBeenCalledWith({
        activeEnvironmentId: 'local',
        appearance: {
          colorScheme: 'dracula',
          mode: 'dark',
        },
        backendUrl: 'http://homelab.local:3000',
        connectionEnabled: true,
        deviceName: 'Windows PC',
      });
    });
    await userEvent.click(screen.getByRole('button', { name: 'Status' }));
    expect(screen.getByText('windows-pc')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Diagnostics' }));
    expect(screen.getByText('Last Registered')).toBeInTheDocument();
    const logsButtons = screen.getAllByRole('button', { name: 'Logs' });
    const settingsLogsButton = logsButtons.at(-1);
    expect(settingsLogsButton).toBeDefined();
    await userEvent.click(settingsLogsButton as HTMLButtonElement);
    expect(screen.getByRole('heading', { name: 'Logs' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Appearance' }));
    expect(screen.getByRole('option', { name: 'Dracula' })).toBeInTheDocument();
  });

  test('opens service settings from the status bar environment button', async () => {
    render(
      <App
        desktopApi={createDesktopApi()}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={createFetchBrowserStatus()}
      />,
    );

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Open environment settings',
      }),
    );

    expect(
      screen.getByRole('heading', { name: 'Service Connection' }),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('http://backend.local:3000'),
    ).toBeInTheDocument();
  });

  test('opens client status from the status bar client button', async () => {
    render(
      <App
        desktopApi={createDesktopApi()}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={createFetchBrowserStatus()}
      />,
    );

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Open client status',
      }),
    );

    expect(
      screen.getByRole('heading', { name: 'Local Status' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('win32')).toHaveLength(2);
    expect(screen.getByText('0.0.0')).toBeInTheDocument();
    expect(screen.getByText('Browser Profiles')).toBeInTheDocument();
    expect(
      screen.getByText(
        'C:\\Users\\yuans\\AppData\\Roaming\\CthuDesktop\\browser-profiles',
      ),
    ).toBeInTheDocument();
  });

  test('shows a restart hint when local path info is not available yet', async () => {
    const desktopApi = createDesktopApi();
    vi.mocked(desktopApi.getAppInfo).mockResolvedValue({
      version: '0.0.0',
      platform: 'win32',
      isPackaged: false,
    } as Awaited<ReturnType<DesktopApi['getAppInfo']>>);

    render(
      <App
        desktopApi={desktopApi}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={createFetchBrowserStatus()}
      />,
    );

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Open client status',
      }),
    );

    expect(
      await screen.findAllByText('Restart CthuDesktop to load path info'),
    ).toHaveLength(3);
  });

  test('shows a recoverable agent list failure', async () => {
    render(
      <App
        desktopApi={createDesktopApi()}
        fetchAgents={vi.fn().mockRejectedValue(new Error('backend offline'))}
        fetchBrowserStatus={createFetchBrowserStatus()}
      />,
    );

    await userEvent.click(primaryNavButton('Agents'));
    expect(await screen.findByText('backend offline')).toBeInTheDocument();
  });

  test('renders browser profiles and login state in one tab', async () => {
    render(
      <App
        desktopApi={createDesktopApi()}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={createFetchBrowserStatus()}
      />,
    );

    await userEvent.click(primaryNavButton('Browser Profiles'));
    expect(
      screen.getByRole('heading', { name: 'Browser Profiles', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Browser Sites')).toBeInTheDocument();
    expect(screen.getAllByText('douban-main')).not.toHaveLength(0);
    expect(screen.getAllByText('verified')).not.toHaveLength(0);
    expect(screen.getByText('Cthu User')).toBeInTheDocument();
    expect(screen.getByText('ID 50353979')).toBeInTheDocument();
    expect(screen.getAllByText(/2026/)).not.toHaveLength(0);
    expect(screen.getByText('missing')).toBeInTheDocument();
  });

  test('shows a pending Douban login reason when no verified profile exists', async () => {
    const fetchBrowserStatus = vi.fn().mockResolvedValue({
      pendingAuthTasks: [
        {
          id: 'agent-1:douban:douban-main',
          agentId: 'agent-1',
          siteId: 'douban',
          profileName: 'douban-main',
          reason: 'missing',
          updatedAt: '2026-06-13T10:00:00.000Z',
        },
      ],
      profiles: [],
      sites: [
        {
          siteId: 'douban',
          displayName: 'Douban',
          allowedOrigins: ['https://movie.douban.com'],
          authPolicy: 'required',
          profileName: 'douban-main',
          loginUrl: 'https://accounts.douban.com/passport/login',
          verifyUrl: 'https://www.douban.com/mine/',
        },
      ],
    });

    render(
      <App
        desktopApi={createDesktopApi()}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={fetchBrowserStatus}
      />,
    );

    await userEvent.click(primaryNavButton('Browser Profiles'));

    expect(await screen.findByText('Pending missing')).toBeInTheDocument();
  });

  test('starts login using site fields returned by backend browser APIs', async () => {
    const desktopApi = createDesktopApi();
    const fetchBrowserStatus = vi.fn().mockResolvedValue({
      pendingAuthTasks: [],
      profiles: [],
      sites: [
        {
          siteId: 'custom',
          displayName: 'Custom Site',
          allowedOrigins: ['https://custom.example'],
          authPolicy: 'required',
          profileName: 'custom-main',
          loginUrl: 'https://custom.example/login',
          verifyUrl: 'https://custom.example/me',
        },
      ],
    });

    render(
      <App
        desktopApi={desktopApi}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={fetchBrowserStatus}
      />,
    );

    await userEvent.click(primaryNavButton('Browser Profiles'));
    await userEvent.click(await screen.findByRole('button', { name: 'Open' }));

    expect(desktopApi.openBrowserLogin).toHaveBeenCalledWith({
      loginUrl: 'https://custom.example/login',
      profileName: 'custom-main',
      siteId: 'custom',
      verifyUrl: 'https://custom.example/me',
    });
  });

  test('shows browser action errors instead of silently ignoring them', async () => {
    const desktopApi = createDesktopApi();
    vi.mocked(desktopApi.openBrowserLogin).mockResolvedValue({
      type: 'browser.error',
      payload: {
        command: 'browser.openLogin',
        commandId: 'cmd-1',
        code: 'BROWSER_COMMAND_FAILED',
        message: 'Executable does not exist',
      },
    });

    render(
      <App
        desktopApi={desktopApi}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={createFetchBrowserStatus()}
      />,
    );

    await userEvent.click(primaryNavButton('Browser Profiles'));
    await userEvent.click(await screen.findByRole('button', { name: 'Open' }));

    expect(
      await screen.findByText('Executable does not exist'),
    ).toBeInTheDocument();
  });

  test('shows a warning when login window opens but navigation fails', async () => {
    const desktopApi = createDesktopApi();
    vi.mocked(desktopApi.openBrowserLogin).mockResolvedValue({
      type: 'browser.result',
      payload: {
        capturedAt: '2026-06-13T10:00:00.000Z',
        command: 'browser.openLogin',
        commandId: 'cmd-1',
        detection: {
          kind: 'blocked',
          reason: 'page.goto: net::ERR_CONNECTION_TIMED_OUT',
        },
        finalUrl: 'about:blank',
      },
    });

    const fetchBrowserStatus = createFetchBrowserStatus();
    render(
      <App
        desktopApi={desktopApi}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={fetchBrowserStatus}
      />,
    );

    await userEvent.click(primaryNavButton('Browser Profiles'));
    await userEvent.click(await screen.findByRole('button', { name: 'Open' }));

    expect(
      await screen.findByText(/Login window opened, but navigation failed/),
    ).toBeInTheDocument();
    await waitFor(() => expect(fetchBrowserStatus).toHaveBeenCalledTimes(2));
  });

  test('shows a restart hint when browser action APIs are missing from preload', async () => {
    const desktopApi = createDesktopApi() as Partial<DesktopApi>;
    delete desktopApi.openBrowserLogin;

    render(
      <App
        desktopApi={desktopApi as DesktopApi}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={createFetchBrowserStatus()}
      />,
    );

    await userEvent.click(primaryNavButton('Browser Profiles'));
    await userEvent.click(await screen.findByRole('button', { name: 'Open' }));

    expect(
      await screen.findByText(/Restart the desktop app/),
    ).toBeInTheDocument();
  });
});
