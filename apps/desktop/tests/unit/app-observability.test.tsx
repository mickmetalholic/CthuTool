import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import type { AgentConnectionState } from '../../src/main/agent-client';
import { normalizeConfig } from '../../src/main/config';
import { App } from '../../src/renderer/src/App';
import type { BrowserStatus } from '../../src/renderer/src/agents-api';
import type { DesktopApi } from '../../src/renderer/src/desktop-api';

describe('desktop renderer observability', () => {
  test('renders safe diagnostic summaries in Settings', async () => {
    const config = normalizeConfig({
      agentId: 'agent-1',
      backendUrl: 'http://backend.local:3000',
      deviceName: 'Desk',
    });
    const connection: AgentConnectionState = {
      agentId: 'agent-1',
      backendUrl: 'http://backend.local:3000',
      deviceName: 'Desk',
      lastHeartbeatAt: '2026-06-13T10:00:00.000Z',
      status: 'connected',
    };
    const desktopApi: DesktopApi = {
      clearBrowserProfile: async () => undefined,
      getAppInfo: async () => ({
        browserProfilesDir: '/Users/me/browser-profiles',
        browserRuntime: {
          activeKind: 'host-chrome',
          message: 'Using host Google Chrome for browser automation',
          preferredKind: 'host-chrome',
          status: 'ready',
        },
        configPath: '/Users/me/config.json',
        diagnostics: {
          lastEvent: {
            details: {
              commandId: 'cmd-1',
              detectionKind: 'captcha_required',
              requestId: 'req-1',
              siteId: 'douban',
            },
            event: 'browser.detection',
            level: 'warn',
            message: 'Browser host detected access problem',
            source: 'cthutool.desktop',
            timestamp: '2026-06-13T10:00:00.000Z',
          },
          recentEvents: [
            {
              details: {
                commandId: 'cmd-1',
                detectionKind: 'captcha_required',
                requestId: 'req-1',
                siteId: 'douban',
              },
              event: 'browser.detection',
              level: 'warn',
              message: 'Browser host detected access problem',
              source: 'cthutool.desktop',
              timestamp: '2026-06-13T10:00:00.000Z',
            },
          ],
        },
        isPackaged: false,
        platform: 'darwin',
        userDataDir: '/Users/me',
        version: '0.1.0',
      }),
      getConfig: async () => config,
      getConnectionState: async () => connection,
      onConnectionStateChange: () => () => undefined,
      openBrowserLogin: async () => undefined,
      saveConfig: async () => config,
      verifyBrowserProfile: async () => undefined,
      windowAction: async () => undefined,
    };
    const emptyBrowserStatus: BrowserStatus = {
      profiles: [],
      sites: [],
    };

    render(
      <App
        desktopApi={desktopApi}
        fetchAgents={async () => []}
        fetchBrowserStatus={async () => emptyBrowserStatus}
      />,
    );

    await userEvent.click(await screen.findByLabelText('Settings'));
    await userEvent.click(screen.getByText('Diagnostics'));

    expect(await screen.findByText('Last Diagnostic')).toBeInTheDocument();
    expect(screen.getByText('browser.detection (warn)')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Logs'));

    await waitFor(() =>
      expect(
        screen.getByText('Log viewing is not connected yet'),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(/browser\.detection/)).not.toBeInTheDocument();
    expect(screen.queryByText(/command=cmd-1/)).not.toBeInTheDocument();
    expect(screen.queryByText(/browser-profiles/)).not.toBeInTheDocument();
    expect(screen.queryByText(/screenshot/)).not.toBeInTheDocument();
  });
});
