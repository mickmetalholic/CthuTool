import { act, render, screen, waitFor, within } from '@testing-library/react';
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

  function createReadyBrowserStatus() {
    return vi.fn().mockResolvedValue({
      pendingAuthTasks: [],
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

  test('renders a startup intro over the already mounted shell', async () => {
    render(
      <App
        desktopApi={createDesktopApi()}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={createFetchBrowserStatus()}
      />,
    );

    expect(screen.getByTestId('startup-intro')).toBeInTheDocument();
    expect(screen.getByTestId('startup-intro-icon')).toHaveAttribute(
      'src',
      expect.stringContaining('build/icon.png'),
    );
    expect(await screen.findByText('CthuDesktop')).toBeInTheDocument();
    expect(screen.getAllByText('Home')).not.toHaveLength(0);
  });

  test('renders home readiness and connected agents', async () => {
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
    await screen.findByRole('button', {
      name: 'Open connection details',
    });
    const titlebar = document.querySelector('.titlebar');
    expect(titlebar).toBeInstanceOf(HTMLElement);
    expect(
      within(titlebar as HTMLElement).getByText('CthuDesktop'),
    ).toBeInTheDocument();
    expect(titlebar?.querySelector('.app-icon')).toHaveAttribute(
      'src',
      expect.stringContaining('build/icon.png'),
    );
    expect(
      within(titlebar as HTMLElement).queryByText('Local'),
    ).not.toBeInTheDocument();
    expect(
      within(titlebar as HTMLElement).queryByRole('button', {
        name: 'Open connection details',
      }),
    ).not.toBeInTheDocument();
    const statusbar = document.querySelector('.statusbar');
    expect(statusbar).toBeInstanceOf(HTMLElement);
    const connectionDetails = within(statusbar as HTMLElement).getByRole(
      'button',
      {
        name: 'Open connection details',
      },
    );
    expect(connectionDetails).toHaveTextContent('Connected');
    expect(connectionDetails).toHaveTextContent('Local');
    expect(connectionDetails).toHaveTextContent('http://backend.local:3000');
    expect(
      within(statusbar as HTMLElement).getAllByRole('button'),
    ).toHaveLength(2);
    expect(document.documentElement.dataset.mode).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dracula');
    expect(screen.getAllByText('Home')).not.toHaveLength(0);
    expect(screen.getByText('Local Readiness')).toBeInTheDocument();
    expect(screen.getByText('Current Host')).toBeInTheDocument();
    expect(screen.getByText('Browser Attention')).toBeInTheDocument();
    expect(screen.queryByLabelText('Douban subject')).not.toBeInTheDocument();
    expect(
      screen.queryByDisplayValue('http://backend.local:3000'),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByLabelText('Primary')).queryByRole('button', {
        name: 'Tasks',
      }),
    ).not.toBeInTheDocument();
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
    const savedPatch = vi.mocked(desktopApi.saveConfig).mock.calls[0]?.[0];
    expect(savedPatch).not.toHaveProperty('agentId');
    expect(savedPatch).not.toHaveProperty('browserRuntime');
    await userEvent.click(
      screen.getByRole('button', { name: 'Local Runtime' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Local Runtime' }),
    ).toBeInTheDocument();
    expect(screen.getByText('windows-pc')).toBeInTheDocument();
    expect(screen.getByText('Browser Runtime')).toBeInTheDocument();
    expect(screen.getByText('Browser Profiles')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Diagnostics' }));
    expect(
      screen.getByRole('heading', { name: 'Diagnostics' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Last Registered')).toBeInTheDocument();
    expect(screen.getByText('Last Error')).toBeInTheDocument();
    expect(screen.getByText('Backend URL')).toBeInTheDocument();
    const logsButtons = screen.getAllByRole('button', { name: 'Logs' });
    const settingsLogsButton = logsButtons.at(-1);
    expect(settingsLogsButton).toBeDefined();
    await userEvent.click(settingsLogsButton as HTMLButtonElement);
    expect(screen.getByRole('heading', { name: 'Logs' })).toBeInTheDocument();
    expect(
      screen.getByText('Log viewing is not connected yet'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Appearance' }));
    expect(
      screen.getByRole('heading', { name: 'Appearance' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Fixed theme system')).toBeInTheDocument();
    expect(screen.getByText('Theme Controls')).toBeInTheDocument();
    expect(
      screen.getByText('Not connected in this release'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Dracula' }),
    ).not.toBeInTheDocument();
  });

  test('saves local agent disabled state without persisting readonly settings', async () => {
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
    await userEvent.click(screen.getByLabelText('Local Agent Enabled'));
    const displayName = screen.getByDisplayValue('Windows PC');
    await userEvent.clear(displayName);
    await userEvent.type(displayName, 'Travel Laptop');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(desktopApi.saveConfig).toHaveBeenCalledWith({
        activeEnvironmentId: 'local',
        appearance: {
          colorScheme: 'dracula',
          mode: 'dark',
        },
        backendUrl: 'http://backend.local:3000',
        connectionEnabled: false,
        deviceName: 'Travel Laptop',
      });
    });
    const savedPatch = vi.mocked(desktopApi.saveConfig).mock.calls[0]?.[0];
    expect(savedPatch).not.toHaveProperty('agentId');
    expect(savedPatch).not.toHaveProperty('browserRuntime');
    expect(savedPatch).not.toHaveProperty('environmentProfiles');
  });

  test('updates connection status when the desktop subscription emits a transition', async () => {
    const desktopApi = createDesktopApi();
    vi.mocked(desktopApi.getConnectionState).mockResolvedValue({
      status: 'connecting',
      backendUrl: 'http://backend.local:3000',
      agentId: 'windows-pc',
      deviceName: 'Windows PC',
      environmentLabel: 'Local',
    });

    render(
      <App
        desktopApi={desktopApi}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={createFetchBrowserStatus()}
      />,
    );

    await waitFor(() =>
      expect(desktopApi.onConnectionStateChange).toHaveBeenCalled(),
    );
    const onConnectionStateChange = vi.mocked(
      desktopApi.onConnectionStateChange,
    ).mock.calls[0]?.[0];
    expect(onConnectionStateChange).toBeDefined();

    act(() => {
      onConnectionStateChange?.({
        status: 'disconnected',
        backendUrl: 'http://backend.local:3000',
        agentId: 'windows-pc',
        deviceName: 'Windows PC',
        environmentLabel: 'Local',
        lastError: 'backend offline',
      });
    });
    const connectionDetails = await screen.findByRole('button', {
      name: 'Open connection details',
    });
    expect(
      await within(connectionDetails).findByText('Disconnected'),
    ).toBeInTheDocument();
  });

  test('opens connection details from the combined status bar connection button', async () => {
    render(
      <App
        desktopApi={createDesktopApi()}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={createFetchBrowserStatus()}
      />,
    );

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Open connection details',
      }),
    );

    expect(
      screen.getByRole('heading', { name: 'Service Connection' }),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('http://backend.local:3000'),
    ).toBeInTheDocument();
    expect(screen.getByText('Local Agent Enabled')).toBeInTheDocument();
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
      screen.getByRole('heading', { name: 'Local Runtime' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('win32')).not.toHaveLength(0);
    expect(screen.getByText('0.0.0')).toBeInTheDocument();
    expect(screen.getByText('Browser Profiles')).toBeInTheDocument();
    expect(
      screen.getByText(
        'C:\\Users\\yuans\\AppData\\Roaming\\CthuDesktop\\browser-profiles',
      ),
    ).toBeInTheDocument();
  });

  test('opens connection detail from the status bar status button', async () => {
    render(
      <App
        desktopApi={createDesktopApi()}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={createFetchBrowserStatus()}
      />,
    );

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Open connection details',
      }),
    );

    expect(
      screen.getByRole('heading', { name: 'Service Connection' }),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('http://backend.local:3000'),
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

  test('renders browser host capability and login state in one tab', async () => {
    render(
      <App
        desktopApi={createDesktopApi()}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={createFetchBrowserStatus()}
      />,
    );

    await userEvent.click(primaryNavButton('Browser Host'));
    expect(
      screen.getByRole('heading', { name: 'Browser Host', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Host browser runtime')).toBeInTheDocument();
    expect(screen.getByText('Browser runtime')).toBeInTheDocument();
    expect(
      screen.getByText('Using host Google Chrome for browser automation'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Browser auth attention'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Site profiles' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Managed profiles')).toBeInTheDocument();
    const runtimePanel = screen.getByLabelText('Browser runtime');
    const managedProfiles = screen.getByLabelText('Managed profiles');
    expect(
      runtimePanel.compareDocumentPosition(managedProfiles) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
    expect(screen.getAllByText('douban-main')).not.toHaveLength(0);
    expect(screen.getAllByText('verified')).not.toHaveLength(0);
    expect(screen.getByText('Cthu User')).toBeInTheDocument();
    expect(screen.getByText('ID 50353979')).toBeInTheDocument();
    expect(screen.getAllByText(/2026/)).not.toHaveLength(0);
  });

  test('surfaces browser attention on home and opens login from Browser Host', async () => {
    const desktopApi = createDesktopApi();
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
        desktopApi={desktopApi}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={fetchBrowserStatus}
      />,
    );

    await waitFor(() => expect(fetchBrowserStatus).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText('Browser auth needs attention'),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 browser auth item/)).toBeInTheDocument();
    expect(
      within(screen.getByLabelText('Primary')).queryByRole('button', {
        name: 'Tasks',
      }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Open Browser Host' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Browser Host', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Authentication needs action')).toBeInTheDocument();
    expect(screen.getAllByText('Pending missing')).toHaveLength(2);
    expect(screen.getByText('backend')).toBeInTheDocument();
    expect(
      screen.getByText('Next actions: Open, Verify, Clear'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(desktopApi.openBrowserLogin).toHaveBeenCalledWith({
      loginUrl: 'https://accounts.douban.com/passport/login',
      profileName: 'douban-main',
      siteId: 'douban',
      verifyUrl: 'https://www.douban.com/mine/',
    });
    await waitFor(() => expect(fetchBrowserStatus).toHaveBeenCalledTimes(2));
  });

  test('verifies an auth task and refreshes task state', async () => {
    const desktopApi = createDesktopApi();
    const fetchBrowserStatus = createFetchBrowserStatus();

    render(
      <App
        desktopApi={desktopApi}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={fetchBrowserStatus}
      />,
    );

    await userEvent.click(primaryNavButton('Browser Host'));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Verify' }),
    );

    expect(desktopApi.verifyBrowserProfile).toHaveBeenCalledWith({
      loginUrl: 'https://accounts.douban.com/passport/login',
      profileName: 'douban-main',
      siteId: 'douban',
      verifyUrl: 'https://www.douban.com/mine/',
    });
    expect(await screen.findByText('Verified Douban')).toBeInTheDocument();
    await waitFor(() => expect(fetchBrowserStatus).toHaveBeenCalledTimes(2));
  });

  test('shows local auth tasks when backend browser status is unavailable', async () => {
    const desktopApi = createDesktopApi();
    vi.mocked(desktopApi.getLocalPendingAuthTasks).mockResolvedValue([
      {
        taskId: 'zhihu:zhihu-main',
        siteId: 'zhihu',
        profileName: 'zhihu-main',
        reason: 'missing',
        source: 'local_preflight',
        status: 'open',
        loginUrl: 'https://www.zhihu.com/signin',
        verifyUrl: 'https://www.zhihu.com/people/me',
        createdAt: '2026-06-13T10:00:00.000Z',
        updatedAt: '2026-06-13T10:00:00.000Z',
      },
    ]);

    render(
      <App
        desktopApi={desktopApi}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={vi
          .fn()
          .mockRejectedValue(new Error('browser status offline'))}
      />,
    );

    await userEvent.click(primaryNavButton('Browser Host'));

    expect(
      await screen.findByText('browser status offline'),
    ).toBeInTheDocument();
    expect(await screen.findAllByText('zhihu-main')).toHaveLength(2);
    expect(screen.getByText('local_preflight')).toBeInTheDocument();
    expect(screen.getByText('Local fallback')).toBeInTheDocument();
    expect(desktopApi.openBrowserLogin).not.toHaveBeenCalled();
  });

  test('shows a browser-auth ready state when no attention is pending', async () => {
    render(
      <App
        desktopApi={createDesktopApi()}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={createReadyBrowserStatus()}
      />,
    );

    await userEvent.click(primaryNavButton('Browser Host'));

    expect(
      await screen.findByText('No browser-auth attention'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('All browser-auth profiles are clear for this host.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Site profiles' }),
    ).toBeInTheDocument();
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

    await userEvent.click(primaryNavButton('Browser Host'));

    expect(await screen.findAllByText('Pending missing')).toHaveLength(2);
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

    await userEvent.click(primaryNavButton('Browser Host'));
    const openButton = await screen.findByRole('button', { name: 'Open' });
    const profileRow = openButton.closest('.browser-profile-row');
    expect(profileRow).toBeInstanceOf(HTMLElement);
    await userEvent.click(openButton);

    expect(desktopApi.openBrowserLogin).toHaveBeenCalledWith({
      loginUrl: 'https://custom.example/login',
      profileName: 'custom-main',
      siteId: 'custom',
      verifyUrl: 'https://custom.example/me',
    });
    await waitFor(() => {
      expect(
        within(profileRow as HTMLElement).getByText(
          'Login window opened for Custom Site',
        ),
      ).toBeInTheDocument();
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

    await userEvent.click(primaryNavButton('Browser Host'));
    const openButton = await screen.findByRole('button', { name: 'Open' });
    const profileRow = openButton.closest('.browser-profile-row');
    expect(profileRow).toBeInstanceOf(HTMLElement);
    await userEvent.click(openButton);

    expect(
      await within(profileRow as HTMLElement).findByText(
        'Executable does not exist',
      ),
    ).toBeInTheDocument();
  });

  test('surfaces clear profile runtime failures from browser profiles', async () => {
    const desktopApi = createDesktopApi();
    vi.mocked(desktopApi.clearBrowserProfile).mockRejectedValue(
      new Error('Profile storage is locked'),
    );

    render(
      <App
        desktopApi={desktopApi}
        fetchAgents={vi.fn().mockResolvedValue([])}
        fetchBrowserStatus={createFetchBrowserStatus()}
      />,
    );

    await userEvent.click(primaryNavButton('Browser Host'));
    await userEvent.click(await screen.findByRole('button', { name: 'Clear' }));

    expect(desktopApi.clearBrowserProfile).toHaveBeenCalledWith({
      loginUrl: 'https://accounts.douban.com/passport/login',
      profileName: 'douban-main',
      siteId: 'douban',
      verifyUrl: 'https://www.douban.com/mine/',
    });
    expect(
      await screen.findByText('Profile storage is locked'),
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

    await userEvent.click(primaryNavButton('Browser Host'));
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

    await userEvent.click(primaryNavButton('Browser Host'));
    await userEvent.click(await screen.findByRole('button', { name: 'Open' }));

    expect(
      await screen.findByText(/Restart the desktop app/),
    ).toBeInTheDocument();
  });
});
