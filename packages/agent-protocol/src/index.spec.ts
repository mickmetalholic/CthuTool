import {
  BROWSER_CAPABILITY,
  createBrowserCommandMessage,
  createBrowserErrorMessage,
  createBrowserProfileStatusMessage,
  createBrowserResultMessage,
  createBrowserStateSnapshotMessage,
  parseAgentClientMessageJson,
  parseAgentServerMessageJson,
  validateAgentClientMessage,
  validateAgentHeartbeatMessage,
  validateAgentHelloMessage,
  validateAgentServerMessage,
  validateBrowserCommandMessage,
  validateBrowserErrorMessage,
  validateBrowserResultMessage,
  validateBrowserStateSnapshotMessage,
} from './index';

describe('agent protocol validation', () => {
  const hello = {
    type: 'agent.hello',
    payload: {
      agentId: 'homelab-mac',
      deviceName: 'Homelab Mac',
      platform: 'darwin',
      version: '0.1.0',
      capabilities: [],
    },
  };

  it('accepts a valid hello message with empty capabilities', () => {
    expect(validateAgentHelloMessage(hello)).toEqual({
      ok: true,
      value: hello,
    });
  });

  it('preserves syntactically valid unknown future capabilities', () => {
    const input = {
      ...hello,
      payload: {
        ...hello.payload,
        capabilities: [BROWSER_CAPABILITY, 'future.capability'],
      },
    };

    expect(validateAgentHelloMessage(input)).toEqual({
      ok: true,
      value: input,
    });
  });

  it('rejects invalid registration metadata', () => {
    const result = validateAgentHelloMessage({
      ...hello,
      payload: {
        ...hello.payload,
        agentId: '../bad',
      },
    });

    expect(result.ok).toBe(false);
  });

  it('accepts heartbeat messages', () => {
    const heartbeat = {
      type: 'agent.heartbeat',
      payload: {
        agentId: 'homelab-mac',
        sentAt: '2026-06-13T12:00:00.000Z',
      },
    };

    expect(validateAgentHeartbeatMessage(heartbeat)).toEqual({
      ok: true,
      value: heartbeat,
    });
    expect(validateAgentClientMessage(heartbeat)).toEqual({
      ok: true,
      value: heartbeat,
    });
  });

  it('parses JSON client messages', () => {
    expect(parseAgentClientMessageJson(JSON.stringify(hello))).toEqual({
      ok: true,
      value: hello,
    });
    expect(parseAgentClientMessageJson('{')).toEqual({
      ok: false,
      message: 'agent message must be valid JSON',
    });
  });

  it('accepts browser capture page commands from the server', () => {
    const command = createBrowserCommandMessage({
      authPolicy: 'required',
      blockResources: ['image', 'font'],
      command: 'browser.capturePage',
      commandId: 'cmd-1',
      includeHtml: true,
      includeText: true,
      profileName: 'douban-main',
      siteId: 'douban',
      timeoutMs: 30000,
      url: 'https://movie.douban.com/subject/1292052/',
      waitUntil: 'domcontentloaded',
    });

    expect(validateBrowserCommandMessage(command)).toEqual({
      ok: true,
      value: command,
    });
    expect(validateAgentServerMessage(command)).toEqual({
      ok: true,
      value: command,
    });
    expect(parseAgentServerMessageJson(JSON.stringify(command))).toEqual({
      ok: true,
      value: command,
    });
  });

  it('accepts optional observability metadata on browser commands', () => {
    const command = createBrowserCommandMessage({
      authPolicy: 'anonymous',
      command: 'browser.capturePage',
      commandId: 'cmd-1',
      observability: {
        commandId: 'cmd-1',
        operation: 'browser.capturePage',
        parentId: 'parent-1',
        requestId: 'req-1',
        traceId: 'trace-1',
      },
      siteId: 'example',
      url: 'https://example.com/',
    });

    expect(validateBrowserCommandMessage(command)).toEqual({
      ok: true,
      value: command,
    });
    expect(parseAgentServerMessageJson(JSON.stringify(command))).toEqual({
      ok: true,
      value: command,
    });
  });

  it('accepts controlled profile management commands', () => {
    const commands = [
      createBrowserCommandMessage({
        authPolicy: 'required',
        command: 'browser.verifyProfile',
        commandId: 'verify-1',
        profileName: 'zhihu-main',
        siteId: 'zhihu',
        verifyUrl: 'https://www.zhihu.com/',
      }),
      createBrowserCommandMessage({
        authPolicy: 'required',
        command: 'browser.openLogin',
        commandId: 'login-1',
        loginUrl: 'https://www.zhihu.com/signin',
        profileName: 'zhihu-main',
        siteId: 'zhihu',
      }),
      createBrowserCommandMessage({
        authPolicy: 'required',
        command: 'browser.clearProfile',
        commandId: 'clear-1',
        profileName: 'zhihu-main',
        siteId: 'zhihu',
      }),
    ];

    for (const command of commands) {
      expect(validateBrowserCommandMessage(command)).toEqual({
        ok: true,
        value: command,
      });
    }
  });

  it('accepts browser session commands from the server', () => {
    const commands = [
      createBrowserCommandMessage({
        authPolicy: 'required',
        command: 'browser.createSession',
        commandId: 'create-1',
        expiresAt: '2026-06-13T12:15:00.000Z',
        profileName: 'douban-main',
        sessionId: 'session-1',
        siteId: 'douban',
      }),
      createBrowserCommandMessage({
        actions: [
          {
            actionId: 'action-1',
            type: 'goto',
            url: 'https://movie.douban.com/subject/1292052/',
          },
          {
            actionId: 'action-2',
            selector: 'h1',
            type: 'textContent',
          },
        ],
        authPolicy: 'required',
        command: 'browser.runActions',
        commandId: 'run-1',
        profileName: 'douban-main',
        sessionId: 'session-1',
        siteId: 'douban',
      }),
      createBrowserCommandMessage({
        authPolicy: 'required',
        command: 'browser.closeSession',
        commandId: 'close-1',
        profileName: 'douban-main',
        sessionId: 'session-1',
        siteId: 'douban',
      }),
    ];

    for (const command of commands) {
      expect(validateBrowserCommandMessage(command)).toEqual({
        ok: true,
        value: command,
      });
      expect(validateAgentServerMessage(command)).toEqual({
        ok: true,
        value: command,
      });
    }
  });

  it('accepts browser results and errors from the agent', () => {
    const result = createBrowserResultMessage({
      capturedAt: '2026-06-13T12:00:00.000Z',
      command: 'browser.capturePage',
      commandId: 'cmd-1',
      detection: { kind: 'ok' },
      finalUrl: 'https://movie.douban.com/subject/1292052/',
      status: 200,
      text: 'The Shawshank Redemption',
      title: '肖申克的救赎',
    });
    const error = createBrowserErrorMessage({
      code: 'AUTH_PROFILE_REQUIRED',
      command: 'browser.capturePage',
      commandId: 'cmd-2',
      message: 'Douban login is required',
      profileStatus: 'missing',
    });

    expect(validateBrowserResultMessage(result)).toEqual({
      ok: true,
      value: result,
    });
    expect(validateBrowserErrorMessage(error)).toEqual({
      ok: true,
      value: error,
    });
    expect(validateAgentClientMessage(result)).toEqual({
      ok: true,
      value: result,
    });
    expect(validateAgentClientMessage(error)).toEqual({
      ok: true,
      value: error,
    });
  });

  it('preserves observability metadata on browser results and errors', () => {
    const observability = {
      commandId: 'cmd-1',
      operation: 'browser.capturePage',
      requestId: 'req-1',
      traceId: 'trace-1',
    };
    const result = createBrowserResultMessage({
      capturedAt: '2026-06-13T12:00:00.000Z',
      command: 'browser.capturePage',
      commandId: 'cmd-1',
      detection: { kind: 'ok' },
      finalUrl: 'https://example.com/',
      observability,
    });
    const error = createBrowserErrorMessage({
      code: 'BROWSER_COMMAND_FAILED',
      command: 'browser.capturePage',
      commandId: 'cmd-1',
      message: 'Browser command failed',
      observability,
    });

    expect(validateBrowserResultMessage(result)).toEqual({
      ok: true,
      value: result,
    });
    expect(validateBrowserErrorMessage(error)).toEqual({
      ok: true,
      value: error,
    });
    expect(parseAgentClientMessageJson(JSON.stringify(result))).toEqual({
      ok: true,
      value: result,
    });
    expect(parseAgentClientMessageJson(JSON.stringify(error))).toEqual({
      ok: true,
      value: error,
    });
  });

  it('accepts browser session results and action errors from the agent', () => {
    const create = createBrowserResultMessage({
      capturedAt: '2026-06-13T12:00:00.000Z',
      command: 'browser.createSession',
      commandId: 'create-1',
      detection: { kind: 'ok' },
      session: {
        createdAt: '2026-06-13T12:00:00.000Z',
        expiresAt: '2026-06-13T12:15:00.000Z',
        profileName: 'douban-main',
        sessionId: 'session-1',
        siteId: 'douban',
      },
      sessionId: 'session-1',
    });
    const run = createBrowserResultMessage({
      actionResults: [
        {
          actionId: 'action-1',
          finalUrl: 'https://movie.douban.com/subject/1292052/',
          status: 200,
          type: 'goto',
        },
        {
          actionId: 'action-2',
          text: 'The Shawshank Redemption',
          type: 'textContent',
        },
      ],
      capturedAt: '2026-06-13T12:00:01.000Z',
      command: 'browser.runActions',
      commandId: 'run-1',
      detection: { kind: 'ok' },
      sessionId: 'session-1',
    });
    const error = createBrowserErrorMessage({
      code: 'BROWSER_ACTION_FAILED',
      command: 'browser.runActions',
      commandId: 'run-2',
      failedActionIndex: 1,
      failedActionType: 'click',
      message: 'Selector was not found',
      sessionId: 'session-1',
    });

    for (const message of [create, run]) {
      expect(validateBrowserResultMessage(message)).toEqual({
        ok: true,
        value: message,
      });
      expect(validateAgentClientMessage(message)).toEqual({
        ok: true,
        value: message,
      });
    }
    expect(validateBrowserErrorMessage(error)).toEqual({
      ok: true,
      value: error,
    });
    expect(validateAgentClientMessage(error)).toEqual({
      ok: true,
      value: error,
    });
  });

  it('accepts public browser profile status reports', () => {
    const message = createBrowserProfileStatusMessage({
      agentId: 'homelab-mac',
      displayName: 'Mick',
      externalUserId: '123456',
      profileName: 'douban-main',
      siteId: 'douban',
      status: 'verified',
      updatedAt: '2026-06-13T12:00:00.000Z',
      verifiedAt: '2026-06-13T12:00:00.000Z',
    });

    expect(validateAgentClientMessage(message)).toEqual({
      ok: true,
      value: message,
    });
  });

  it('accepts public browser state snapshots from the agent', () => {
    const message = createBrowserStateSnapshotMessage({
      agentId: 'homelab-mac',
      pendingAuthTasks: [
        {
          agentId: 'homelab-mac',
          createdAt: '2026-06-13T12:00:00.000Z',
          id: 'homelab-mac:douban:douban-main',
          loginUrl: 'https://accounts.douban.com/passport/login',
          profileName: 'douban-main',
          reason: 'missing',
          siteId: 'douban',
          updatedAt: '2026-06-13T12:00:00.000Z',
          verifyUrl: 'https://www.douban.com/mine/',
        },
      ],
      profiles: [
        {
          agentId: 'homelab-mac',
          displayName: 'Mick',
          externalUserId: '123456',
          profileName: 'douban-main',
          siteId: 'douban',
          status: 'verified',
          updatedAt: '2026-06-13T12:00:00.000Z',
          verifiedAt: '2026-06-13T12:00:00.000Z',
        },
      ],
    });

    expect(validateBrowserStateSnapshotMessage(message)).toEqual({
      ok: true,
      value: message,
    });
    expect(validateAgentClientMessage(message)).toEqual({
      ok: true,
      value: message,
    });
  });

  it('accepts observability metadata on browser state snapshots', () => {
    const message = createBrowserStateSnapshotMessage({
      agentId: 'homelab-mac',
      observability: {
        operation: 'browser.stateSnapshot',
        requestId: 'req-1',
      },
      pendingAuthTasks: [],
      profiles: [],
    });

    expect(validateBrowserStateSnapshotMessage(message)).toEqual({
      ok: true,
      value: message,
    });
    expect(validateAgentClientMessage(message)).toEqual({
      ok: true,
      value: message,
    });
  });

  it('rejects malformed or raw browser state snapshots', () => {
    const rawSnapshot = {
      type: 'browser.stateSnapshot',
      payload: {
        agentId: 'homelab-mac',
        pendingAuthTasks: [],
        profiles: [
          {
            agentId: 'homelab-mac',
            cookies: [],
            profileName: 'douban-main',
            siteId: 'douban',
            status: 'verified',
            updatedAt: '2026-06-13T12:00:00.000Z',
          },
        ],
      },
    };
    const malformedSnapshot = {
      type: 'browser.stateSnapshot',
      payload: {
        agentId: 'homelab-mac',
        pendingAuthTasks: [],
        profiles: [
          {
            agentId: 'homelab-mac',
            profileName: 'douban-main',
            siteId: 'douban',
            status: 'verified',
          },
        ],
      },
    };

    expect(validateBrowserStateSnapshotMessage(rawSnapshot).ok).toBe(false);
    expect(validateAgentClientMessage(rawSnapshot).ok).toBe(false);
    expect(validateBrowserStateSnapshotMessage(malformedSnapshot).ok).toBe(
      false,
    );
  });

  it('accepts messages without observability metadata for compatibility', () => {
    const command = createBrowserCommandMessage({
      authPolicy: 'anonymous',
      command: 'browser.capturePage',
      commandId: 'cmd-1',
      siteId: 'example',
      url: 'https://example.com/',
    });

    expect(validateAgentServerMessage(command)).toEqual({
      ok: true,
      value: command,
    });
  });

  it('rejects unsupported observability metadata fields', () => {
    const command = createBrowserCommandMessage({
      authPolicy: 'anonymous',
      command: 'browser.capturePage',
      commandId: 'cmd-1',
      observability: {
        commandId: 'cmd-1',
        details: { cookie: 'secret' },
        operation: 'browser.capturePage',
      } as never,
      siteId: 'example',
      url: 'https://example.com/',
    });

    expect(validateBrowserCommandMessage(command)).toEqual({
      ok: false,
      message: 'observability metadata contains unsupported fields',
    });
  });

  it('rejects malformed observability metadata values', () => {
    const command = createBrowserCommandMessage({
      authPolicy: 'anonymous',
      command: 'browser.capturePage',
      commandId: 'cmd-1',
      observability: {
        commandId: 'cmd-1',
        operation: 'Browser Capture',
        requestId: 'req-1',
      },
      siteId: 'example',
      url: 'https://example.com/',
    });

    expect(validateBrowserCommandMessage(command).ok).toBe(false);
  });
});
