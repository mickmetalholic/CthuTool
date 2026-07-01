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
    expect(
      validateBrowserRuntimeResponse('browser.runActions', response),
    ).toEqual({
      ok: true,
      value: response,
    });
  });

  it('validates crawler-focused session actions and safe results', () => {
    const request = createBrowserRuntimeRequest(
      'run-crawler',
      'browser.runActions',
      {
        actions: [
          { actionId: 'load', state: 'networkidle', type: 'waitForLoadState' },
          {
            actionId: 'url-wait',
            target: { url: 'https://movie.douban.com/subject/1292052/' },
            type: 'waitForURL',
          },
          {
            actionId: 'response',
            target: {
              method: 'GET',
              pattern: '/subject/1292052',
              status: 200,
            },
            type: 'waitForResponse',
          },
          { actionId: 'url', type: 'url' },
          { actionId: 'inner-text', selector: 'h1', type: 'innerText' },
          { actionId: 'inner-html', selector: '#content', type: 'innerHTML' },
          {
            actionId: 'attr',
            name: 'href',
            selector: 'a',
            type: 'getAttribute',
          },
          { actionId: 'count', selector: '.item', type: 'locatorCount' },
          {
            actionId: 'texts',
            selector: '.item',
            type: 'allTextContents',
          },
          { actionId: 'exists', selector: '#main', type: 'exists' },
          { actionId: 'press', key: 'Enter', selector: 'input', type: 'press' },
          { actionId: 'hover', selector: '.item', type: 'hover' },
          {
            actionId: 'select',
            selector: 'select',
            type: 'selectOption',
            value: 'new',
          },
          { actionId: 'check', selector: '#agree', type: 'check' },
          { actionId: 'uncheck', selector: '#agree', type: 'uncheck' },
          { actionId: 'scroll-page', target: 'page', type: 'scroll', y: 600 },
          {
            actionId: 'extract-list',
            fields: {
              href: { attribute: 'href', selector: 'a', type: 'attribute' },
              title: { selector: '.title', type: 'text' },
            },
            itemSelector: '.item',
            limit: 10,
            type: 'extractList',
          },
          { actionId: 'links', selector: 'main a', type: 'extractLinks' },
          { actionId: 'meta', type: 'extractMeta' },
          { actionId: 'jsonld', type: 'extractJsonLd' },
        ],
        authPolicy: 'required',
        profileName: 'douban-main',
        sessionId: 'session-1',
        siteId: 'douban',
      },
    );
    const response = createBrowserRuntimeSuccessResponse('run-crawler', {
      actionResults: [
        {
          actionId: 'url',
          type: 'url',
          url: 'https://movie.douban.com/subject/1292052/',
        },
        { actionId: 'texts', texts: ['a', 'b'], type: 'allTextContents' },
        {
          actionId: 'attr',
          attribute: 'https://example.test',
          type: 'getAttribute',
        },
        { actionId: 'count', count: 2, type: 'locatorCount' },
        { actionId: 'exists', exists: true, type: 'exists' },
        {
          actionId: 'extract-list',
          items: [{ href: 'https://example.test', title: 'Example' }],
          type: 'extractList',
        },
        {
          actionId: 'links',
          links: [{ href: 'https://example.test', text: 'Example' }],
          type: 'extractLinks',
        },
        { actionId: 'meta', meta: { title: 'Example' }, type: 'extractMeta' },
        {
          actionId: 'jsonld',
          jsonLd: [{ '@type': 'Movie', name: 'Example' }],
          type: 'extractJsonLd',
        },
        {
          actionId: 'response',
          response: {
            contentType: 'text/html',
            method: 'GET',
            status: 200,
            url: 'https://movie.douban.com/subject/1292052/',
          },
          type: 'waitForResponse',
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
    expect(
      validateBrowserRuntimeResponse('browser.runActions', response),
    ).toEqual({
      ok: true,
      value: response,
    });
  });

  it('rejects executable crawler action payloads', () => {
    const request = createBrowserRuntimeRequest(
      'run-script',
      'browser.runActions',
      {
        actions: [
          {
            script: 'document.cookie',
            type: 'url',
          } as never,
        ],
        authPolicy: 'anonymous',
        sessionId: 'session-1',
        siteId: 'douban',
      },
    );

    expect(validateBrowserRuntimeRequest(request)).toMatchObject({
      ok: false,
      message: expect.stringContaining('executable script'),
    });
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
