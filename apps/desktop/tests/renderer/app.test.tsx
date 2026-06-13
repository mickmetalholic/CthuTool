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
    }),
    getAppInfo: vi.fn().mockResolvedValue({
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
    })),
    getConnectionState: vi.fn().mockResolvedValue({
      status: 'connected',
      backendUrl: 'http://backend.local:3000',
      agentId: 'windows-pc',
      deviceName: 'Windows PC',
      environmentLabel: 'Local',
      lastRegisteredAt: '2026-06-13T10:00:00.000Z',
    }),
    windowAction: vi.fn().mockResolvedValue(undefined),
    onConnectionStateChange: vi.fn().mockReturnValue(() => undefined),
  };
}

describe('CthuDesktop shell', () => {
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

    render(<App desktopApi={desktopApi} fetchAgents={fetchAgents} />);

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
  });

  test('shows a recoverable agent list failure', async () => {
    render(
      <App
        desktopApi={createDesktopApi()}
        fetchAgents={vi.fn().mockRejectedValue(new Error('backend offline'))}
      />,
    );

    await userEvent.click(primaryNavButton('Agents'));
    expect(await screen.findByText('backend offline')).toBeInTheDocument();
  });

  test('renders local chrome as unavailable placeholder', async () => {
    render(
      <App
        desktopApi={createDesktopApi()}
        fetchAgents={vi.fn().mockResolvedValue([])}
      />,
    );

    await userEvent.click(primaryNavButton('Chrome'));
    expect(
      screen.getByRole('heading', { name: 'Local Chrome', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });
});
