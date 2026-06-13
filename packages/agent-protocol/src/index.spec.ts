import {
  BROWSER_CAPABILITY,
  createBrowserCommandMessage,
  createBrowserErrorMessage,
  createBrowserProfileStatusMessage,
  createBrowserResultMessage,
  parseAgentClientMessageJson,
  parseAgentServerMessageJson,
  validateAgentClientMessage,
  validateAgentHeartbeatMessage,
  validateAgentHelloMessage,
  validateAgentServerMessage,
  validateBrowserCommandMessage,
  validateBrowserErrorMessage,
  validateBrowserResultMessage,
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
});
