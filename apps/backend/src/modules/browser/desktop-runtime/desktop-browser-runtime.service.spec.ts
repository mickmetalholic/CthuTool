import {
  type BrowserRuntimeResponse,
  createBrowserRuntimeErrorResponse,
  createBrowserRuntimeSuccessResponse,
} from '@cthutool/browser-runtime-protocol';
import type { Mock } from 'vitest';
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
        id: expect.any(String),
        jsonrpc: '2.0',
        method: 'browser.capturePage',
        params: expect.objectContaining({
          url: 'https://example.com/',
        }),
      }),
      undefined,
    );
  });

  it('emits runtime command completion events', async () => {
    const observability = { record: vi.fn() };
    const gateway = createGatewayMock();
    const runtime = createRuntime(gateway, observability);

    await runtime.capturePage({ url: 'https://example.com/' });

    expect(observability.record).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'desktop_browser_runtime.command_completed',
        details: expect.objectContaining({
          commandType: 'browser.capturePage',
        }),
      }),
    );
  });

  it('attaches command observability metadata to browser commands', async () => {
    const { runtime, gateway } = createHarness();

    await runtime.capturePage({
      url: 'https://example.com/',
    });

    expect(gateway.sendCommand).toHaveBeenCalledWith(
      'agent-1',
      expect.objectContaining({
        observability: expect.objectContaining({
          operation: 'browser.capturePage',
        }),
      }),
      undefined,
    );
  });

  it('returns interaction challenge when auth is required', async () => {
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createBrowserRuntimeErrorResponse('cmd-1', {
        code: 'AUTH_PROFILE_REQUIRED',
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
      createBrowserRuntimeErrorResponse('cmd-1', {
        code: 'AUTH_PROFILE_EXPIRED',
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
    const observability = { record: vi.fn() };
    const runtime = createRuntime(gateway, observability);

    const result = await runtime.capturePage({
      url: 'https://example.com/',
    });

    expect(result.ok).toBe(false);
    if (!result.ok && 'error' in result) {
      expect(result.error).toBe(
        'No online desktop agent with browser capability',
      );
    }
    expect(observability.record).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'desktop_browser_runtime.unavailable',
      }),
    );
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

  it('creates browser sessions on a selected browser agent', async () => {
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createBrowserRuntimeSuccessResponse('cmd-returned', {
        capturedAt: '2026-06-13T10:00:00.000Z',
        detection: { kind: 'ok' },
        session: {
          createdAt: '2026-06-13T10:00:00.000Z',
          expiresAt: '2026-06-13T10:15:00.000Z',
          profileName: 'douban-main',
          sessionId: 'session-1',
          siteId: 'douban',
        },
        sessionId: 'session-1',
      }),
    );
    const runtime = createRuntime(gateway);

    const result = await runtime.createSession({
      authPolicy: 'required',
      expiresAt: '2026-06-13T10:15:00.000Z',
      profileName: 'douban-main',
      sessionId: 'session-1',
      siteId: 'douban',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        agentId: 'agent-1',
        createdAt: '2026-06-13T10:00:00.000Z',
        expiresAt: '2026-06-13T10:15:00.000Z',
        profileName: 'douban-main',
        sessionId: 'session-1',
        siteId: 'douban',
      },
    });
    expect(gateway.sendCommand).toHaveBeenCalledWith(
      'agent-1',
      expect.objectContaining({
        method: 'browser.createSession',
        params: expect.objectContaining({
          sessionId: 'session-1',
        }),
      }),
      undefined,
    );
  });

  it('runs browser session actions on the owning agent', async () => {
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createBrowserRuntimeSuccessResponse('cmd-returned', {
        actionResults: [
          {
            actionId: 'a1',
            html: '<html>ok</html>',
            type: 'content',
          },
        ],
        capturedAt: '2026-06-13T10:00:01.000Z',
        detection: { kind: 'ok' },
        sessionId: 'session-1',
      }),
    );
    const runtime = createRuntime(gateway);

    const result = await runtime.runActions({
      actions: [{ actionId: 'a1', type: 'content' }],
      agentId: 'agent-owner',
      authPolicy: 'anonymous',
      sessionId: 'session-1',
      siteId: 'example',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        actionResults: [
          {
            actionId: 'a1',
            html: '<html>ok</html>',
            type: 'content',
          },
        ],
        capturedAt: '2026-06-13T10:00:01.000Z',
        sessionId: 'session-1',
      },
    });
    expect(gateway.sendCommand).toHaveBeenCalledWith(
      'agent-owner',
      expect.objectContaining({
        method: 'browser.runActions',
        params: expect.objectContaining({
          sessionId: 'session-1',
        }),
      }),
      undefined,
    );
  });

  it('closes browser sessions on the owning agent', async () => {
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createBrowserRuntimeSuccessResponse('cmd-returned', {
        capturedAt: '2026-06-13T10:00:02.000Z',
        detection: { kind: 'ok' },
        sessionId: 'session-1',
      }),
    );
    const runtime = createRuntime(gateway);

    const result = await runtime.closeSession({
      agentId: 'agent-owner',
      authPolicy: 'anonymous',
      sessionId: 'session-1',
      siteId: 'example',
    });

    expect(result).toEqual({
      ok: true,
      value: { sessionId: 'session-1' },
    });
    expect(gateway.sendCommand).toHaveBeenCalledWith(
      'agent-owner',
      expect.objectContaining({
        method: 'browser.closeSession',
        params: expect.objectContaining({
          sessionId: 'session-1',
        }),
      }),
      undefined,
    );
  });

  it('maps session action failures without exposing transport internals', async () => {
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createBrowserRuntimeErrorResponse('cmd-returned', {
        code: 'BROWSER_ACTION_FAILED',
        failedActionIndex: 0,
        failedActionType: 'click',
        message: 'Selector was not found',
        sessionId: 'session-1',
      }),
    );
    const runtime = createRuntime(gateway);

    const result = await runtime.runActions({
      actions: [{ actionId: 'a1', selector: 'button', type: 'click' }],
      agentId: 'agent-owner',
      authPolicy: 'anonymous',
      sessionId: 'session-1',
      siteId: 'example',
    });

    expect(result).toEqual({
      ok: false,
      code: 'BROWSER_ACTION_FAILED',
      error: 'Selector was not found',
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

function createRuntime(
  gateway: GatewayMock,
  observability?: { readonly record: Mock },
): DesktopBrowserRuntimeService {
  return new DesktopBrowserRuntimeService(
    gateway as unknown as AgentCommandGateway,
    observability as never,
  );
}

type GatewayMock = {
  readonly selectAgentByCapability: Mock;
  readonly sendCommand: Mock;
};

function createGatewayMock(
  agent: ReturnType<typeof createAgentStatus> | null = createAgentStatus(
    'agent-1',
  ),
  response:
    | BrowserRuntimeResponse<'browser.capturePage'>
    | BrowserRuntimeResponse<'browser.openLogin'>
    | BrowserRuntimeResponse<'browser.verifyProfile'>
    | BrowserRuntimeResponse<'browser.createSession'>
    | BrowserRuntimeResponse<'browser.runActions'>
    | BrowserRuntimeResponse<'browser.closeSession'> = createBrowserRuntimeSuccessResponse(
    'cmd-returned',
    {
      capturedAt: new Date().toISOString(),
      detection: { kind: 'ok' },
      finalUrl: 'https://example.com/',
      html: '<html>ok</html>',
      status: 200,
      title: 'Example',
    },
  ),
): GatewayMock {
  return {
    selectAgentByCapability: vi.fn(() => agent ?? undefined),
    sendCommand: vi.fn(async () => response),
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
