import {
  type BrowserErrorMessage,
  type BrowserResultMessage,
  createBrowserErrorMessage,
  createBrowserResultMessage,
} from '@cthutool/agent-protocol';
import type { AgentCommandGateway } from '../../agent/command-gateway/agent-command-gateway.service';
import { DesktopBrowserRuntimeService } from './desktop-browser-runtime.service';

describe('DesktopBrowserRuntimeService', () => {
  it('returns capture result when browser command succeeds', async () => {
    const { runtime, gateway } = createHarness();

    const result = await runtime.capturePage({
      url: 'https://example.com/',
      includeHtml: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.finalUrl).toBe('https://example.com/');
      expect(result.value.html).toBe('<html>ok</html>');
    }
    expect(gateway.sendCommand).toHaveBeenCalledWith(
      'agent-1',
      expect.objectContaining({
        commandId: expect.any(String),
        message: expect.objectContaining({
          payload: expect.objectContaining({
            command: 'browser.capturePage',
            url: 'https://example.com/',
          }),
          type: 'browser.command',
        }),
      }),
      undefined,
    );
  });

  it('returns interaction challenge when auth is required', async () => {
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createBrowserErrorMessage({
        code: 'AUTH_PROFILE_REQUIRED',
        command: 'browser.capturePage',
        commandId: 'cmd-1',
        message: 'Required browser profile is not verified',
        profileStatus: 'missing',
      }),
    );
    const runtime = createRuntime(gateway);

    const result = await runtime.capturePage({
      url: 'https://example.com/',
      siteId: 'example',
      profileName: 'my-profile',
      loginUrl: 'https://example.com/login',
    });

    expect(result.ok).toBe(false);
    if (!result.ok && 'challenge' in result) {
      expect(result.challenge).toEqual({
        siteId: 'example',
        profileName: 'my-profile',
        action: 'login',
        reason: 'login_required',
        loginUrl: 'https://example.com/login',
        verifyUrl: undefined,
      });
    }
  });

  it('returns interaction challenge when profile is expired', async () => {
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createBrowserErrorMessage({
        code: 'AUTH_PROFILE_EXPIRED',
        command: 'browser.capturePage',
        commandId: 'cmd-1',
        message: 'Required browser profile expired',
        profileStatus: 'expired',
      }),
    );
    const runtime = createRuntime(gateway);

    const result = await runtime.capturePage({
      url: 'https://example.com/',
      siteId: 'example',
      profileName: 'my-profile',
      verifyUrl: 'https://example.com/verify',
    });

    expect(result.ok).toBe(false);
    if (!result.ok && 'challenge' in result) {
      expect(result.challenge).toEqual({
        siteId: 'example',
        profileName: 'my-profile',
        action: 'verify',
        reason: 'profile_expired',
        loginUrl: undefined,
        verifyUrl: 'https://example.com/verify',
      });
      expect(result.challenge.action).toBe('verify');
    }
  });

  it('returns error when no browser agent is online', async () => {
    const gateway = createGatewayMock(null);
    const runtime = createRuntime(gateway);

    const result = await runtime.capturePage({
      url: 'https://example.com/',
    });

    expect(result.ok).toBe(false);
    if (!result.ok && 'error' in result) {
      expect(result.error).toBe(
        'No online desktop agent with browser capability',
      );
    }
  });

  it('returns agent status', async () => {
    const { runtime } = createHarness();

    const status = await runtime.getStatus();

    expect(status).toEqual({
      agentId: 'agent-1',
      available: true,
      lastSeenAt: expect.any(String),
    });
  });

  it('returns diagnostics', async () => {
    const { runtime } = createHarness();

    const diagnostics = await runtime.getDiagnostics();

    expect(diagnostics).toEqual({
      agentId: 'agent-1',
      online: true,
      capabilities: ['browser'],
      lastSeenAt: expect.any(String),
    });
  });

  it('returns unavailable status when no agent is online', async () => {
    const gateway = createGatewayMock(null);
    const runtime = createRuntime(gateway);

    const status = await runtime.getStatus();

    expect(status).toEqual({
      agentId: 'unknown',
      available: false,
    });
  });
});

function createHarness() {
  const gateway = createGatewayMock();
  return {
    gateway,
    runtime: createRuntime(gateway),
  };
}

function createRuntime(gateway: GatewayMock): DesktopBrowserRuntimeService {
  return new DesktopBrowserRuntimeService(
    gateway as unknown as AgentCommandGateway,
  );
}

type GatewayMock = {
  readonly selectAgentByCapability: jest.Mock;
  readonly sendCommand: jest.Mock;
};

function createGatewayMock(
  agent: ReturnType<typeof createAgentStatus> | null = createAgentStatus(
    'agent-1',
  ),
  response:
    | BrowserResultMessage
    | BrowserErrorMessage = createBrowserResultMessage({
    capturedAt: new Date().toISOString(),
    command: 'browser.capturePage',
    commandId: 'cmd-returned',
    detection: { kind: 'ok' },
    finalUrl: 'https://example.com/',
    html: '<html>ok</html>',
    status: 200,
    title: 'Example',
  }),
): GatewayMock {
  return {
    selectAgentByCapability: jest.fn(() => agent ?? undefined),
    sendCommand: jest.fn(async () => response),
  };
}

function createAgentStatus(agentId: string) {
  return {
    agentId,
    capabilities: ['browser' as string],
    connectedAt: new Date().toISOString(),
    connectionId: `${agentId}-connection`,
    deviceName: 'desktop',
    lastSeenAt: new Date().toISOString(),
    platform: 'win32' as 'win32' | 'darwin' | 'linux' | 'unknown',
    state: 'online' as const,
    version: '0.0.0',
  };
}
