import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BrowserCommandPayload } from '@cthutool/agent-protocol';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { BrowserProfileStore } from '../../src/main/browser-profile-store';
import type { DesktopObservabilityEvent } from '../../src/main/observability';
import { PendingAuthTaskStore } from '../../src/main/pending-auth-task-store';
import { PlaywrightHost } from '../../src/main/playwright-host';

describe('PlaywrightHost', () => {
  let tempDir: string | undefined;

  type PageState = {
    readonly html?: string;
    readonly status?: number;
    readonly text?: string;
    readonly title?: string;
    readonly url?: string;
  };

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { force: true, recursive: true });
      tempDir = undefined;
    }
  });

  async function createHost(
    options: {
      readonly browserRuntime?: ConstructorParameters<
        typeof PlaywrightHost
      >[0]['browserRuntime'];
      readonly gotoError?: Error;
      readonly now?: () => Date;
      readonly pages?: readonly PageState[];
      readonly observabilityEvents?: DesktopObservabilityEvent[];
      readonly runtimeValidator?: ConstructorParameters<
        typeof PlaywrightHost
      >[0]['runtimeValidator'];
    } = {},
  ) {
    tempDir = await mkdtemp(join(tmpdir(), 'cthutool-playwright-host-'));
    const now = options.now ?? (() => new Date('2026-06-13T10:00:00.000Z'));
    const profileStore = new BrowserProfileStore(tempDir, now);
    const pendingAuthTasks = new PendingAuthTaskStore(now);
    const defaultPage: PageState = {
      html: '<html><body>ok</body></html>',
      status: 200,
      text: 'ok',
      title: 'Example',
      url: 'https://example.com/',
    };
    let pageIndex = 0;
    let currentPage = defaultPage;
    const page = {
      content: vi.fn(async () => currentPage.html ?? '<html></html>'),
      goto: vi.fn(async () => {
        if (options.gotoError) {
          throw options.gotoError;
        }
        currentPage = options.pages?.[pageIndex] ?? defaultPage;
        pageIndex += 1;
        return { status: () => currentPage.status ?? 200 };
      }),
      locator: vi.fn(() => ({
        click: vi.fn(async () => undefined),
        fill: vi.fn(async () => undefined),
        textContent: async () => currentPage.text ?? '',
        waitFor: vi.fn(async () => undefined),
      })),
      screenshot: vi.fn(async () => Buffer.from('shot')),
      title: vi.fn(async () => currentPage.title ?? 'Example'),
      url: vi.fn(() => currentPage.url ?? 'https://example.com/'),
    };
    let closeHandler: (() => void) | undefined;
    const context = {
      close: vi.fn(async () => undefined),
      newPage: vi.fn(async () => page),
      on: vi.fn((event: string, handler: () => void) => {
        if (event === 'close') {
          closeHandler = handler;
        }
      }),
      route: vi.fn(async () => undefined),
    };
    const browser = {
      close: vi.fn(async () => undefined),
      newContext: vi.fn(async () => context),
    };
    const runtime = {
      launch: vi.fn(async () => browser),
      launchPersistentContext: vi.fn(async () => context),
    };
    return {
      host: new PlaywrightHost({
        agentId: 'agent-1',
        browserRuntime: options.browserRuntime,
        now,
        pendingAuthTasks,
        profileStore,
        observability: options.observabilityEvents
          ? { record: (event) => options.observabilityEvents?.push(event) }
          : undefined,
        runtime,
        runtimeValidator:
          options.runtimeValidator ?? (async () => ({ ok: true })),
      }),
      browser,
      pendingAuthTasks,
      closeLoginWindow: () => closeHandler?.(),
      context,
      page,
      profileStore,
      runtime,
    };
  }

  const captureCommand: BrowserCommandPayload = {
    authPolicy: 'required',
    command: 'browser.capturePage',
    commandId: 'cmd-1',
    profileName: 'douban-main',
    siteId: 'douban',
    url: 'https://movie.douban.com/subject/1292052/',
  };

  test('returns auth error when required profile is missing', async () => {
    const { host, pendingAuthTasks, runtime } = await createHost();

    const result = await host.execute(captureCommand);

    expect(result).toEqual({
      type: 'browser.error',
      payload: expect.objectContaining({
        code: 'AUTH_PROFILE_REQUIRED',
        profileStatus: 'missing',
      }),
    });
    expect(runtime.launchPersistentContext).not.toHaveBeenCalled();
    expect(pendingAuthTasks.list()).toHaveLength(1);
  });

  test('preserves observability metadata on browser errors', async () => {
    const { host } = await createHost();

    const result = await host.execute({
      ...captureCommand,
      observability: {
        commandId: 'cmd-1',
        operation: 'browser.capturePage',
        requestId: 'req-1',
      },
    });

    expect(result).toEqual({
      type: 'browser.error',
      payload: expect.objectContaining({
        commandId: 'cmd-1',
        observability: {
          commandId: 'cmd-1',
          operation: 'browser.capturePage',
          requestId: 'req-1',
        },
      }),
    });
  });

  test('can suppress local pending auth preflight for business lookups', async () => {
    const { host, pendingAuthTasks, runtime } = await createHost();

    const result = await host.execute({
      ...captureCommand,
      suppressPendingAuthTask: true,
    });

    expect(result.type).toBe('browser.result');
    expect(runtime.launchPersistentContext).toHaveBeenCalledWith(
      expect.stringContaining(join('douban', 'douban-main')),
      { channel: 'chrome', headless: true },
    );
    expect(pendingAuthTasks.list()).toHaveLength(0);
  });

  test('uses persistent context for verified required profiles', async () => {
    const { host, profileStore, runtime } = await createHost();
    await profileStore.markStatus('douban', 'douban-main', 'verified');

    const result = await host.execute(captureCommand);

    expect(result.type).toBe('browser.result');
    expect(runtime.launchPersistentContext).toHaveBeenCalledWith(
      expect.stringContaining(join('douban', 'douban-main')),
      { channel: 'chrome', headless: true },
    );
  });

  test('does not treat a normal Douban movie page login link as login required', async () => {
    const { host, profileStore } = await createHost({
      pages: [
        {
          html: '<html><body>肖申克的救赎 登录 注册 9.7 剧情 犯罪</body></html>',
          text: '肖申克的救赎 登录 注册 9.7 剧情 犯罪',
          title: '肖申克的救赎',
          url: 'https://movie.douban.com/subject/1292052/',
        },
      ],
    });
    await profileStore.markStatus('douban', 'douban-main', 'verified');

    const result = await host.execute({
      ...captureCommand,
      includeText: true,
    });

    expect(result).toEqual({
      type: 'browser.result',
      payload: expect.objectContaining({
        detection: { kind: 'ok' },
        finalUrl: 'https://movie.douban.com/subject/1292052/',
        text: '肖申克的救赎 登录 注册 9.7 剧情 犯罪',
      }),
    });
  });

  test('does not treat dormant Douban login redirects in movie page scripts as login required', async () => {
    const html = [
      '<html><body>',
      '<h1>肖申克的救赎</h1>',
      '<script>',
      "if(sort === 'follow' && false){",
      "window.location.href = '//www.douban.com/accounts/login?source=movie';",
      '}',
      '</script>',
      '</body></html>',
    ].join('\n');
    const { host, profileStore } = await createHost({
      pages: [
        {
          html,
          text: html,
          title: '肖申克的救赎',
          url: 'https://movie.douban.com/subject/1292052/',
        },
      ],
    });
    await profileStore.markStatus('douban', 'douban-main', 'verified');

    const result = await host.execute({
      ...captureCommand,
      includeText: true,
    });

    expect(result).toEqual({
      type: 'browser.result',
      payload: expect.objectContaining({
        detection: { kind: 'ok' },
        finalUrl: 'https://movie.douban.com/subject/1292052/',
      }),
    });
  });

  test('uses temporary context for anonymous capture', async () => {
    const { host, runtime } = await createHost();

    const result = await host.execute({
      authPolicy: 'anonymous',
      command: 'browser.capturePage',
      commandId: 'cmd-1',
      siteId: 'example',
      url: 'https://example.com/',
    });

    expect(result.type).toBe('browser.result');
    expect(runtime.launch).toHaveBeenCalledWith({
      channel: 'chrome',
      headless: true,
    });
  });

  test('preserves observability metadata on browser results', async () => {
    const { host } = await createHost();

    const result = await host.execute({
      authPolicy: 'anonymous',
      command: 'browser.capturePage',
      commandId: 'cmd-1',
      observability: {
        commandId: 'cmd-1',
        operation: 'browser.capturePage',
        requestId: 'req-1',
      },
      siteId: 'example',
      url: 'https://example.com/',
    });

    expect(result).toEqual({
      type: 'browser.result',
      payload: expect.objectContaining({
        commandId: 'cmd-1',
        observability: {
          commandId: 'cmd-1',
          operation: 'browser.capturePage',
          requestId: 'req-1',
        },
      }),
    });
  });

  test('records browser command diagnostics without raw artifacts', async () => {
    const events: DesktopObservabilityEvent[] = [];
    const { host } = await createHost({
      observabilityEvents: events,
      pages: [
        {
          html: '<html><body>secret html</body></html>',
          status: 200,
          text: 'secret text',
          title: 'Example',
          url: 'https://example.com/',
        },
      ],
    });

    await host.execute({
      authPolicy: 'anonymous',
      command: 'browser.capturePage',
      commandId: 'cmd-1',
      includeHtml: true,
      includeScreenshot: true,
      includeText: true,
      observability: {
        commandId: 'cmd-1',
        operation: 'browser.capturePage',
        requestId: 'req-1',
      },
      siteId: 'example',
      url: 'https://example.com/',
    });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'browser.command_received',
          details: expect.objectContaining({
            commandId: 'cmd-1',
            requestId: 'req-1',
            siteId: 'example',
          }),
        }),
        expect.objectContaining({
          event: 'browser.command_completed',
          details: expect.objectContaining({
            commandId: 'cmd-1',
            detectionKind: 'ok',
            outcome: 'success',
          }),
        }),
      ]),
    );
    expect(JSON.stringify(events)).not.toContain('secret html');
    expect(JSON.stringify(events)).not.toContain('secret text');
    expect(JSON.stringify(events)).not.toContain('c2hvdA==');
  });

  test('records access detection diagnostics', async () => {
    const events: DesktopObservabilityEvent[] = [];
    const { host, profileStore } = await createHost({
      observabilityEvents: events,
      pages: [
        {
          html: '<html><body>验证码</body></html>',
          text: '验证码',
          title: 'Blocked',
          url: 'https://movie.douban.com/subject/1292052/',
        },
      ],
    });
    await profileStore.markStatus('douban', 'douban-main', 'verified');

    await host.execute({
      ...captureCommand,
      includeText: true,
    });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'browser.detection',
          level: 'warn',
          details: expect.objectContaining({
            detectionKind: 'captcha_required',
            profileName: 'douban-main',
            siteId: 'douban',
          }),
        }),
      ]),
    );
  });

  test('creates stateful sessions and runs actions in order', async () => {
    const { browser, context, host, page } = await createHost({
      pages: [
        {
          html: '<html><body><h1>Movie</h1></body></html>',
          status: 201,
          text: 'Movie',
          title: 'Movie Page',
          url: 'https://example.com/movie',
        },
      ],
    });

    const created = await host.execute({
      authPolicy: 'anonymous',
      command: 'browser.createSession',
      commandId: 'create-1',
      expiresAt: '2026-06-13T10:15:00.000Z',
      sessionId: 'session-1',
      siteId: 'example',
    });
    const actions = await host.execute({
      actions: [
        {
          actionId: 'a1',
          type: 'goto',
          url: 'https://example.com/movie',
          waitUntil: 'domcontentloaded',
        },
        { actionId: 'a2', selector: 'h1', type: 'waitForSelector' },
        { actionId: 'a3', selector: 'button', type: 'click' },
        {
          actionId: 'a4',
          selector: 'input',
          type: 'fill',
          value: 'cthu',
        },
        { actionId: 'a5', selector: 'h1', type: 'textContent' },
        { actionId: 'a6', type: 'content' },
        { actionId: 'a7', type: 'title' },
        { actionId: 'a8', fullPage: true, type: 'screenshot' },
      ],
      authPolicy: 'anonymous',
      command: 'browser.runActions',
      commandId: 'run-1',
      sessionId: 'session-1',
      siteId: 'example',
    });
    const closed = await host.execute({
      authPolicy: 'anonymous',
      command: 'browser.closeSession',
      commandId: 'close-1',
      sessionId: 'session-1',
      siteId: 'example',
    });

    expect(created).toEqual({
      type: 'browser.result',
      payload: expect.objectContaining({
        command: 'browser.createSession',
        session: expect.objectContaining({
          sessionId: 'session-1',
          siteId: 'example',
        }),
      }),
    });
    expect(actions).toEqual({
      type: 'browser.result',
      payload: expect.objectContaining({
        actionResults: [
          expect.objectContaining({
            actionId: 'a1',
            finalUrl: 'https://example.com/movie',
            status: 201,
            type: 'goto',
          }),
          { actionId: 'a2', type: 'waitForSelector' },
          { actionId: 'a3', type: 'click' },
          { actionId: 'a4', type: 'fill' },
          { actionId: 'a5', text: 'Movie', type: 'textContent' },
          {
            actionId: 'a6',
            html: '<html><body><h1>Movie</h1></body></html>',
            type: 'content',
          },
          { actionId: 'a7', title: 'Movie Page', type: 'title' },
          {
            actionId: 'a8',
            screenshotBase64: Buffer.from('shot').toString('base64'),
            type: 'screenshot',
          },
        ],
        command: 'browser.runActions',
        sessionId: 'session-1',
      }),
    });
    expect(closed).toEqual({
      type: 'browser.result',
      payload: expect.objectContaining({
        command: 'browser.closeSession',
        sessionId: 'session-1',
      }),
    });
    expect(page.screenshot).toHaveBeenCalledWith({ fullPage: true });
    expect(context.close).toHaveBeenCalled();
    expect(browser.close).toHaveBeenCalled();
  });

  test('rejects duplicate browser sessions', async () => {
    const { host } = await createHost();

    await host.execute({
      authPolicy: 'anonymous',
      command: 'browser.createSession',
      commandId: 'create-1',
      sessionId: 'session-1',
      siteId: 'example',
    });
    const duplicate = await host.execute({
      authPolicy: 'anonymous',
      command: 'browser.createSession',
      commandId: 'create-2',
      sessionId: 'session-1',
      siteId: 'example',
    });

    expect(duplicate).toEqual({
      type: 'browser.error',
      payload: expect.objectContaining({
        code: 'BROWSER_SESSION_DUPLICATE',
        sessionId: 'session-1',
      }),
    });
  });

  test('reports failing session actions with action metadata', async () => {
    const { host } = await createHost({
      gotoError: new Error('Navigation timed out'),
    });
    await host.execute({
      authPolicy: 'anonymous',
      command: 'browser.createSession',
      commandId: 'create-1',
      sessionId: 'session-1',
      siteId: 'example',
    });

    const result = await host.execute({
      actions: [
        {
          actionId: 'a1',
          type: 'goto',
          url: 'https://example.com/slow',
        },
        { actionId: 'a2', type: 'content' },
      ],
      authPolicy: 'anonymous',
      command: 'browser.runActions',
      commandId: 'run-1',
      sessionId: 'session-1',
      siteId: 'example',
    });

    expect(result).toEqual({
      type: 'browser.error',
      payload: expect.objectContaining({
        code: 'BROWSER_ACTION_FAILED',
        failedActionIndex: 0,
        failedActionType: 'goto',
        message: 'Navigation timed out',
        sessionId: 'session-1',
      }),
    });
  });

  test('expires local browser sessions before running more actions', async () => {
    let now = new Date('2026-06-13T10:00:00.000Z');
    const { context, host } = await createHost({ now: () => now });

    await host.execute({
      authPolicy: 'anonymous',
      command: 'browser.createSession',
      commandId: 'create-1',
      expiresAt: '2026-06-13T10:01:00.000Z',
      sessionId: 'session-1',
      siteId: 'example',
    });
    now = new Date('2026-06-13T10:02:00.000Z');
    const result = await host.execute({
      actions: [{ actionId: 'a1', type: 'content' }],
      authPolicy: 'anonymous',
      command: 'browser.runActions',
      commandId: 'run-1',
      sessionId: 'session-1',
      siteId: 'example',
    });

    expect(result).toEqual({
      type: 'browser.error',
      payload: expect.objectContaining({
        code: 'BROWSER_SESSION_NOT_FOUND',
        sessionId: 'session-1',
      }),
    });
    expect(context.close).toHaveBeenCalled();
  });

  test('uses explicit host Chrome executable path launch options', async () => {
    const { host, profileStore, runtime } = await createHost({
      browserRuntime: {
        kind: 'host-chrome',
        executablePath:
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      },
    });
    await profileStore.markStatus('douban', 'douban-main', 'verified');

    await host.execute(captureCommand);

    expect(runtime.launchPersistentContext).toHaveBeenCalledWith(
      expect.stringContaining(join('douban', 'douban-main')),
      {
        executablePath:
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
      },
    );
  });

  test('does not become ready when host Chrome does not validate', async () => {
    const { host } = await createHost({
      runtimeValidator: async () => ({
        ok: false,
        message: 'Chrome channel missing',
      }),
    });

    await host.initialize();

    expect(host.isReady()).toBe(false);
    expect(host.getRuntimeDiagnostic()).toEqual({
      message: 'Host Google Chrome is unavailable: Chrome channel missing',
      preferredKind: 'host-chrome',
      status: 'unavailable',
    });
  });

  test('keeps login window open when login navigation times out', async () => {
    const { context, host, pendingAuthTasks, runtime } = await createHost({
      gotoError: new Error('page.goto: net::ERR_CONNECTION_TIMED_OUT'),
    });

    const result = await host.execute({
      authPolicy: 'required',
      command: 'browser.openLogin',
      commandId: 'cmd-login',
      loginUrl: 'https://accounts.douban.com/passport/login',
      profileName: 'douban-main',
      siteId: 'douban',
      verifyUrl: 'https://www.douban.com/mine/',
    });

    expect(result).toEqual({
      type: 'browser.result',
      payload: expect.objectContaining({
        command: 'browser.openLogin',
        detection: expect.objectContaining({
          kind: 'blocked',
          reason: expect.stringContaining('ERR_CONNECTION_TIMED_OUT'),
        }),
      }),
    });
    expect(runtime.launchPersistentContext).toHaveBeenCalled();
    expect(runtime.launchPersistentContext).toHaveBeenCalledWith(
      expect.stringContaining(join('douban', 'douban-main')),
      { channel: 'chrome', headless: false },
    );
    expect(context.close).not.toHaveBeenCalled();
    expect(pendingAuthTasks.list()).toHaveLength(1);
  });

  test('uses hidden browser for explicit profile verification', async () => {
    const { host, runtime } = await createHost({
      pages: [doubanHomePage('Cthu User'), doubanMinePage('50353979')],
    });

    const result = await host.execute(verifyDoubanCommand());

    expect(result.type).toBe('browser.result');
    expect(runtime.launchPersistentContext).toHaveBeenCalledWith(
      expect.stringContaining(join('douban', 'douban-main')),
      { channel: 'chrome', headless: true },
    );
  });

  test('verifies a profile after the login window closes', async () => {
    const stateChanged = vi.fn();
    const { closeLoginWindow, host, pendingAuthTasks, profileStore } =
      await createHost({
        pages: [
          {
            html: '<html><body>login</body></html>',
            text: 'login',
            url: 'https://accounts.douban.com/passport/login',
          },
          doubanHomePage('Cthu User'),
          doubanMinePage('50353979'),
        ],
      });
    host.setStateChangedCallback(stateChanged);

    await host.execute({
      authPolicy: 'required',
      command: 'browser.openLogin',
      commandId: 'cmd-login',
      loginUrl: 'https://accounts.douban.com/passport/login',
      profileName: 'douban-main',
      siteId: 'douban',
      verifyUrl: 'https://www.douban.com/mine/',
    });
    closeLoginWindow();
    await waitForProfileStatus(profileStore, 'verified');

    expect(
      (await profileStore.getProfile('douban', 'douban-main'))?.status,
    ).toBe('verified');
    expect(
      (await profileStore.getProfile('douban', 'douban-main'))?.displayName,
    ).toBe('Cthu User');
    expect(pendingAuthTasks.list()[0]?.status).toBe('resolved');
    expect(stateChanged).toHaveBeenCalled();
  });

  test('extracts Douban display name and user id during verification', async () => {
    const { host, pendingAuthTasks, profileStore } = await createHost({
      pages: [doubanHomePage('Cthu User'), doubanMinePage('50353979')],
    });
    pendingAuthTasks.upsert({
      profileName: 'douban-main',
      reason: 'missing',
      siteId: 'douban',
      source: 'backend_request',
    });

    const result = await host.execute(verifyDoubanCommand());
    const profile = await profileStore.getProfile('douban', 'douban-main');

    expect(result).toEqual({
      type: 'browser.result',
      payload: expect.objectContaining({
        detection: { kind: 'ok' },
        finalUrl: 'https://www.douban.com/people/50353979/',
        profile: expect.objectContaining({
          displayName: 'Cthu User',
          externalUserId: '50353979',
          status: 'verified',
        }),
      }),
    });
    expect(profile).toEqual(
      expect.objectContaining({
        displayName: 'Cthu User',
        externalUserId: '50353979',
        status: 'verified',
        verifiedAt: '2026-06-13T10:00:00.000Z',
      }),
    );
    expect(pendingAuthTasks.list()[0]?.status).toBe('resolved');
  });

  test('treats Douban account-menu success without a mine id as verified partial metadata', async () => {
    const { host, profileStore } = await createHost({
      pages: [
        doubanHomePage('Cthu User'),
        {
          html: '<html><body>mine</body></html>',
          text: 'mine',
          title: 'Mine',
          url: 'https://www.douban.com/mine/',
        },
      ],
    });

    await host.execute(verifyDoubanCommand());

    expect(await profileStore.getProfile('douban', 'douban-main')).toEqual(
      expect.objectContaining({
        displayName: 'Cthu User',
        status: 'verified',
      }),
    );
    expect(
      (await profileStore.getProfile('douban', 'douban-main'))?.externalUserId,
    ).toBeUndefined();
  });

  test('marks Douban verification as login required when the account menu is missing', async () => {
    const { host, pendingAuthTasks, profileStore } = await createHost({
      pages: [
        {
          html: '<html><body>please log in</body></html>',
          text: 'please log in',
          title: 'Douban',
          url: 'https://www.douban.com/',
        },
      ],
    });

    const result = await host.execute(verifyDoubanCommand());

    expect(result).toEqual({
      type: 'browser.result',
      payload: expect.objectContaining({
        detection: expect.objectContaining({
          kind: 'login_required',
          reason: 'Douban account menu was not found',
        }),
      }),
    });
    expect(
      (await profileStore.getProfile('douban', 'douban-main'))?.status,
    ).toBe('login_required');
    expect(pendingAuthTasks.list()[0]).toEqual(
      expect.objectContaining({
        reason: 'verification_failed',
        status: 'open',
      }),
    );
  });

  test('marks Douban verification as blocked when captcha signals are present', async () => {
    const { host, pendingAuthTasks, profileStore } = await createHost({
      pages: [
        {
          html: '<html><body>验证码</body></html>',
          text: '验证码',
          title: 'Douban',
          url: 'https://www.douban.com/',
        },
      ],
    });

    const result = await host.execute(verifyDoubanCommand());

    expect(result).toEqual({
      type: 'browser.result',
      payload: expect.objectContaining({
        detection: { kind: 'captcha_required' },
      }),
    });
    expect(
      (await profileStore.getProfile('douban', 'douban-main'))?.status,
    ).toBe('blocked');
    expect(pendingAuthTasks.list()[0]).toEqual(
      expect.objectContaining({
        reason: 'blocked',
        status: 'open',
      }),
    );
  });

  test('keeps non-Douban verification on the generic fallback', async () => {
    const { host, page, profileStore } = await createHost({
      pages: [
        {
          html: '<html><body>ok</body></html>',
          text: 'ok',
          title: 'Example',
          url: 'https://example.com/account',
        },
      ],
    });

    await host.execute({
      authPolicy: 'required',
      command: 'browser.verifyProfile',
      commandId: 'cmd-verify',
      profileName: 'main',
      siteId: 'example',
      verifyUrl: 'https://example.com/account',
    });

    expect(page.goto).toHaveBeenCalledWith('https://example.com/account', {
      timeout: undefined,
      waitUntil: 'domcontentloaded',
    });
    expect((await profileStore.getProfile('example', 'main'))?.status).toBe(
      'verified',
    );
  });
});

function verifyDoubanCommand(): BrowserCommandPayload {
  return {
    authPolicy: 'required',
    command: 'browser.verifyProfile',
    commandId: 'cmd-verify',
    profileName: 'douban-main',
    siteId: 'douban',
    verifyUrl: 'https://www.douban.com/mine/',
  };
}

function doubanHomePage(displayName: string) {
  return {
    html: `<html><body><a href="https://accounts.douban.com/passport/setting/">${displayName}的账号</a></body></html>`,
    text: `${displayName}的账号 我的豆瓣`,
    title: 'Douban',
    url: 'https://www.douban.com/',
  };
}

function doubanMinePage(externalUserId: string) {
  return {
    html: '<html><body>mine</body></html>',
    text: 'mine',
    title: 'Mine',
    url: `https://www.douban.com/people/${externalUserId}/`,
  };
}

async function waitForProfileStatus(
  profileStore: BrowserProfileStore,
  status: string,
): Promise<void> {
  let latestStatus: string | undefined;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const profile = await profileStore.getProfile('douban', 'douban-main');
    latestStatus = profile?.status;
    if (profile?.status === status) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error(
    `Timed out waiting for profile status "${status}", latest was "${latestStatus ?? 'missing'}"`,
  );
}
