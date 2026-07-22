import {
  type BrowserRuntimeResponse,
  createBrowserRuntimeErrorResponse,
  createBrowserRuntimeSuccessResponse,
} from '@cthutool/browser-runtime-protocol';
import type { Mock } from 'vitest';
import {
  type AgentCommandGateway,
  AgentCommandGatewayError,
} from '../../agent/command-gateway/agent-command-gateway.service';
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
      { environmentId: 'local', agentId: 'agent-1' },
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
          responseType: 'jsonrpc.result',
        }),
      }),
    );
  });

  it('attaches command observability metadata to browser runtime requests', async () => {
    const { runtime, gateway } = createHarness();

    await runtime.capturePage({
      url: 'https://example.com/',
    });

    expect(gateway.sendCommand).toHaveBeenCalledWith(
      { environmentId: 'local', agentId: 'agent-1' },
      expect.objectContaining({
        observability: expect.objectContaining({
          operation: 'browser.capturePage',
        }),
      }),
      undefined,
    );
  });

  it('opens login through the browser runtime protocol', async () => {
    const updatedAt = new Date().toISOString();
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createProfileOperationResponse('browser.openLogin', {
        profileName: 'douban-main',
        status: 'verified',
        updatedAt,
      }),
    );
    const runtime = createRuntime(gateway);

    const result = await runtime.openLogin({
      siteId: 'douban',
      profileName: 'douban-main',
      loginUrl: 'https://accounts.douban.com/passport/login',
      timeoutMs: 12_000,
    });

    expect(result).toEqual({
      ok: true,
      value: {
        profileName: 'douban-main',
        status: 'available',
        updatedAt,
      },
    });
    expect(gateway.sendCommand).toHaveBeenCalledWith(
      { environmentId: 'local', agentId: 'agent-1' },
      expect.objectContaining({
        jsonrpc: '2.0',
        method: 'browser.openLogin',
        params: expect.objectContaining({
          authPolicy: 'required',
          loginUrl: 'https://accounts.douban.com/passport/login',
          profileName: 'douban-main',
          siteId: 'douban',
        }),
      }),
      12_000,
    );
  });

  it.each([
    ['missing', 'missing'],
    ['expired', 'expired'],
    ['login_required', 'invalid'],
    ['verifying', 'invalid'],
    ['blocked', 'invalid'],
    [undefined, 'invalid'],
  ] as const)('maps verified profile status %s to desktop status %s', async (runtimeStatus, desktopStatus) => {
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createProfileOperationResponse('browser.verifyProfile', {
        profileName: runtimeStatus ? 'zhihu-main' : undefined,
        status: runtimeStatus,
        updatedAt: runtimeStatus ? new Date().toISOString() : undefined,
      }),
    );
    const runtime = createRuntime(gateway);

    const result = await runtime.verifyProfile({
      siteId: 'zhihu',
      profileName: 'zhihu-main',
      verifyUrl: 'https://www.zhihu.com/',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        profileName: 'zhihu-main',
        status: desktopStatus,
        updatedAt: runtimeStatus ? expect.any(String) : undefined,
      });
    }
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

  it.each([
    ['login_required', 'login', 'login_required'],
    ['login_expired', 'verify', 'profile_expired'],
    ['verification_failed', 'verify', 'verification_failed'],
    ['captcha_required', 'verify', 'captcha_required'],
    ['blocked', 'verify', 'blocked'],
    ['rate_limited', 'verify', 'rate_limited'],
  ] as const)('maps explicit %s challenge to an interaction challenge', async (kind, action, reason) => {
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createBrowserRuntimeErrorResponse('cmd-1', {
        challenge: {
          kind,
          siteId: 'douban',
          profileName: 'douban-main',
          loginUrl: 'https://accounts.douban.com/passport/login',
          verifyUrl: 'https://movie.douban.com/',
        },
        code: kind === 'rate_limited' ? 'RATE_LIMITED' : 'CAPTCHA_REQUIRED',
        message: 'Browser interaction is required',
      }),
    );
    const runtime = createRuntime(gateway);

    const result = await runtime.capturePage({
      url: 'https://movie.douban.com/subject/1292052/',
      siteId: 'douban',
      profileName: 'douban-main',
    });

    expect(result.ok).toBe(false);
    if (!result.ok && 'challenge' in result) {
      expect(result.challenge).toEqual({
        siteId: 'douban',
        profileName: 'douban-main',
        action,
        reason,
        loginUrl: 'https://accounts.douban.com/passport/login',
        verifyUrl: 'https://movie.douban.com/',
      });
    }
  });

  it('falls back to an expired challenge for expired runtime profiles', async () => {
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createBrowserRuntimeErrorResponse('cmd-1', {
        code: 'BROWSER_PROFILE_EXPIRED',
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
      expect(result.challenge.reason).toBe('profile_expired');
      expect(result.challenge.action).toBe('verify');
    }
  });

  it('returns runtime errors that do not require interaction', async () => {
    const gateway = createGatewayMock(
      createAgentStatus('agent-1'),
      createBrowserRuntimeErrorResponse('cmd-1', {
        code: 'BROWSER_COMMAND_FAILED',
        message: 'Browser command failed',
      }),
    );
    const runtime = createRuntime(gateway);

    const result = await runtime.capturePage({
      url: 'https://example.com/',
    });

    expect(result).toEqual({
      ok: false,
      error: 'Browser command failed',
      code: 'BROWSER_COMMAND_FAILED',
    });
  });

  it('rejects invalid browser runtime responses', async () => {
    const gateway = createGatewayMock(createAgentStatus('agent-1'), {
      jsonrpc: '2.0',
      id: 'bad-response',
      result: {
        detection: { kind: 'ok' },
      },
    } as BrowserRuntimeResponse<'browser.capturePage'>);
    const runtime = createRuntime(gateway);

    const result = await runtime.capturePage({
      url: 'https://example.com/',
    });

    expect(result.ok).toBe(false);
    if (!result.ok && 'error' in result) {
      expect(result.code).toBe('INVALID_BROWSER_RUNTIME_RESPONSE');
    }
  });

  it('returns gateway errors when command dispatch fails', async () => {
    const gateway = createGatewayMock();
    gateway.sendCommand.mockRejectedValueOnce(
      new AgentCommandGatewayError('AGENT_NOT_AVAILABLE', 'socket closed'),
    );
    const runtime = createRuntime(gateway);

    const result = await runtime.capturePage({
      url: 'https://example.com/',
    });

    expect(result).toEqual({
      ok: false,
      error: 'socket closed',
      code: 'AGENT_NOT_AVAILABLE',
    });
  });

  it('returns generic unavailable errors for unexpected dispatch failures', async () => {
    const gateway = createGatewayMock();
    gateway.sendCommand.mockRejectedValueOnce(new Error('boom'));
    const runtime = createRuntime(gateway);

    const result = await runtime.capturePage({
      url: 'https://example.com/',
    });

    expect(result).toEqual({
      ok: false,
      error: 'Desktop browser runtime is not available',
      code: 'AGENT_NOT_AVAILABLE',
    });
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

  it('returns profile operation errors when no browser agent is online', async () => {
    const gateway = createGatewayMock(null);
    const runtime = createRuntime(gateway);

    const result = await runtime.openLogin({
      siteId: 'example',
      profileName: 'main',
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
      { environmentId: 'local', agentId: 'agent-1' },
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
      { environmentId: 'local', agentId: 'agent-owner' },
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
      { environmentId: 'local', agentId: 'agent-owner' },
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

function createProfileOperationResponse(
  method: 'browser.openLogin' | 'browser.verifyProfile',
  profile: {
    readonly profileName?: string;
    readonly status?:
      | 'missing'
      | 'login_required'
      | 'verifying'
      | 'verified'
      | 'expired'
      | 'blocked';
    readonly updatedAt?: string;
  },
): BrowserRuntimeResponse<typeof method> {
  return createBrowserRuntimeSuccessResponse('cmd-returned', {
    capturedAt: new Date().toISOString(),
    detection: { kind: 'ok' },
    ...(profile.profileName && profile.status && profile.updatedAt
      ? {
          profile: {
            siteId: 'site',
            profileName: profile.profileName,
            status: profile.status,
            updatedAt: profile.updatedAt,
          },
        }
      : {}),
  });
}

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
