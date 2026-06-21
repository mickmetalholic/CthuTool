import {
  BROWSER_CAPABILITY,
  createBrowserRuntimeErrorResponse,
  createBrowserRuntimeRequest,
  createBrowserRuntimeSuccessResponse,
  validateBrowserRuntimeRequest,
  validateBrowserRuntimeResponse,
} from './index';

describe('browser runtime protocol', () => {
  it('builds and validates browser JSON-RPC capture requests', () => {
    const request = createBrowserRuntimeRequest(
      'cmd-1',
      'browser.capturePage',
      {
        authPolicy: 'required',
        blockResources: ['image', 'font'],
        includeHtml: true,
        includeText: true,
        profileName: 'douban-main',
        siteId: 'douban',
        timeoutMs: 30000,
        url: 'https://movie.douban.com/subject/1292052/',
        waitUntil: 'domcontentloaded',
      },
    );

    expect(BROWSER_CAPABILITY).toBe('browser');
    expect(request).toEqual({
      jsonrpc: '2.0',
      id: 'cmd-1',
      method: 'browser.capturePage',
      params: {
        authPolicy: 'required',
        blockResources: ['image', 'font'],
        includeHtml: true,
        includeText: true,
        profileName: 'douban-main',
        siteId: 'douban',
        timeoutMs: 30000,
        url: 'https://movie.douban.com/subject/1292052/',
        waitUntil: 'domcontentloaded',
      },
    });
    expect(validateBrowserRuntimeRequest(request)).toEqual({
      ok: true,
      value: request,
    });
  });

  it('validates profile operation requests', () => {
    const verify = createBrowserRuntimeRequest(
      'verify-1',
      'browser.verifyProfile',
      {
        authPolicy: 'required',
        profileName: 'zhihu-main',
        siteId: 'zhihu',
        verifyUrl: 'https://www.zhihu.com/',
      },
    );
    const login = createBrowserRuntimeRequest('login-1', 'browser.openLogin', {
      authPolicy: 'required',
      loginUrl: 'https://www.zhihu.com/signin',
      profileName: 'zhihu-main',
      siteId: 'zhihu',
    });
    const clear = createBrowserRuntimeRequest(
      'clear-1',
      'browser.clearProfile',
      {
        authPolicy: 'required',
        profileName: 'zhihu-main',
        siteId: 'zhihu',
      },
    );

    expect(validateBrowserRuntimeRequest(verify).ok).toBe(true);
    expect(validateBrowserRuntimeRequest(login).ok).toBe(true);
    expect(validateBrowserRuntimeRequest(clear).ok).toBe(true);
  });

  it('validates session action requests and responses', () => {
    const request = createBrowserRuntimeRequest('run-1', 'browser.runActions', {
      actions: [
        {
          actionId: 'goto',
          type: 'goto',
          url: 'https://movie.douban.com/subject/1292052/',
        },
        {
          actionId: 'title',
          selector: 'h1',
          type: 'textContent',
        },
      ],
      authPolicy: 'required',
      profileName: 'douban-main',
      sessionId: 'session-1',
      siteId: 'douban',
    });
    const response = createBrowserRuntimeSuccessResponse('run-1', {
      actionResults: [
        {
          actionId: 'goto',
          finalUrl: 'https://movie.douban.com/subject/1292052/',
          status: 200,
          type: 'goto',
        },
        {
          actionId: 'title',
          text: 'The Shawshank Redemption',
          type: 'textContent',
        },
      ],
      capturedAt: '2026-06-13T12:00:00.000Z',
      detection: { kind: 'ok' },
      sessionId: 'session-1',
    });

    expect(validateBrowserRuntimeRequest(request)).toEqual({
      ok: true,
      value: request,
    });
    expect(validateBrowserRuntimeResponse('browser.runActions', response)).toEqual(
      {
        ok: true,
        value: response,
      },
    );
  });

  it('validates typed browser success responses', () => {
    const response = createBrowserRuntimeSuccessResponse('cmd-1', {
      capturedAt: '2026-06-13T12:00:00.000Z',
      detection: { kind: 'ok' },
      finalUrl: 'https://movie.douban.com/subject/1292052/',
      status: 200,
      text: 'The Shawshank Redemption',
      title: 'The Shawshank Redemption',
    });

    expect(
      validateBrowserRuntimeResponse('browser.capturePage', response),
    ).toEqual({
      ok: true,
      value: response,
    });
  });

  it('validates operation-scoped browser runtime challenges', () => {
    const response = createBrowserRuntimeErrorResponse('cmd-2', {
      challenge: {
        kind: 'login_required',
        loginUrl: 'https://accounts.douban.com/passport/login',
        message: 'Douban login is required',
        profileName: 'douban-main',
        siteId: 'douban',
      },
      code: 'AUTH_PROFILE_REQUIRED',
      message: 'Douban login is required',
      profileStatus: 'missing',
      retryable: true,
    });

    expect(
      validateBrowserRuntimeResponse('browser.capturePage', response),
    ).toEqual({
      ok: true,
      value: response,
    });
  });

  it('rejects unknown browser methods and malformed results', () => {
    expect(
      validateBrowserRuntimeRequest({
        jsonrpc: '2.0',
        id: 'cmd-1',
        method: 'browser.unknown',
        params: {},
      }).ok,
    ).toBe(false);
    expect(
      validateBrowserRuntimeResponse('browser.capturePage', {
        jsonrpc: '2.0',
        id: 'cmd-1',
        result: {
          detection: { kind: 'ok' },
        },
      }).ok,
    ).toBe(false);
  });
});
