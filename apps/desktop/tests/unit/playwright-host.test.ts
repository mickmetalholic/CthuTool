import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BrowserCommandPayload } from '@cthutool/agent-protocol';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { BrowserProfileStore } from '../../src/main/browser-profile-store';
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
      readonly gotoError?: Error;
      readonly pages?: readonly PageState[];
    } = {},
  ) {
    tempDir = await mkdtemp(join(tmpdir(), 'cthutool-playwright-host-'));
    const profileStore = new BrowserProfileStore(
      tempDir,
      () => new Date('2026-06-13T10:00:00.000Z'),
    );
    const pendingAuthTasks = new PendingAuthTaskStore(
      () => new Date('2026-06-13T10:00:00.000Z'),
    );
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
        textContent: async () => currentPage.text ?? '',
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
        now: () => new Date('2026-06-13T10:00:00.000Z'),
        pendingAuthTasks,
        profileStore,
        runtime,
      }),
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

  test('uses persistent context for verified required profiles', async () => {
    const { host, profileStore, runtime } = await createHost();
    await profileStore.markStatus('douban', 'douban-main', 'verified');

    const result = await host.execute(captureCommand);

    expect(result.type).toBe('browser.result');
    expect(runtime.launchPersistentContext).toHaveBeenCalled();
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
    expect(runtime.launch).toHaveBeenCalled();
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
    expect(context.close).not.toHaveBeenCalled();
    expect(pendingAuthTasks.list()).toHaveLength(1);
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
