import { render, screen, waitFor } from '@testing-library/react';
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
    }),
    saveConfig: vi.fn().mockImplementation(async (patch) => ({
      backendUrl: patch.backendUrl ?? 'http://backend.local:3000',
      agentId: 'windows-pc',
      deviceName: patch.deviceName ?? 'Windows PC',
      connectionEnabled: patch.connectionEnabled ?? true,
    })),
    getConnectionState: vi.fn().mockResolvedValue({
      status: 'connected',
      backendUrl: 'http://backend.local:3000',
      agentId: 'windows-pc',
      deviceName: 'Windows PC',
      lastRegisteredAt: '2026-06-13T10:00:00.000Z',
    }),
    onConnectionStateChange: vi.fn().mockReturnValue(() => undefined),
  };
}

describe('Desktop management home page', () => {
  test('renders connection settings and connected agents', async () => {
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

    expect(await screen.findByText('Connected')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('http://backend.local:3000'),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('Windows PC')).toBeInTheDocument();
    expect(screen.queryByText('Local Agent Enabled')).not.toBeInTheDocument();
    await waitFor(async () => {
      expect(await screen.findAllByText('windows-pc')).toHaveLength(2);
    });
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  test('saves edited backend settings without changing agent id', async () => {
    const desktopApi = createDesktopApi();

    render(
      <App
        desktopApi={desktopApi}
        fetchAgents={vi.fn().mockResolvedValue([])}
      />,
    );

    const backendUrl = await screen.findByDisplayValue(
      'http://backend.local:3000',
    );
    await userEvent.clear(backendUrl);
    await userEvent.type(backendUrl, 'http://homelab.local:3000');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(desktopApi.saveConfig).toHaveBeenCalledWith({
        backendUrl: 'http://homelab.local:3000',
        deviceName: 'Windows PC',
      });
    });
    expect(screen.getByText('windows-pc')).toBeInTheDocument();
  });

  test('shows a recoverable agent list failure', async () => {
    render(
      <App
        desktopApi={createDesktopApi()}
        fetchAgents={vi.fn().mockRejectedValue(new Error('backend offline'))}
      />,
    );

    expect(await screen.findByText('backend offline')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('http://backend.local:3000'),
    ).toBeInTheDocument();
  });
});
