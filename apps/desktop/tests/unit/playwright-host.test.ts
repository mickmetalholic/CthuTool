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

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { force: true, recursive: true });
      tempDir = undefined;
    }
  });

  async function createHost(options: { readonly gotoError?: Error } = {}) {
    tempDir = await mkdtemp(join(tmpdir(), 'cthutool-playwright-host-'));
    const profileStore = new BrowserProfileStore(
      tempDir,
      () => new Date('2026-06-13T10:00:00.000Z'),
    );
    const pendingAuthTasks = new PendingAuthTaskStore(
      () => new Date('2026-06-13T10:00:00.000Z'),
    );
    const page = {
      content: vi.fn(async () => '<html><body>ok</body></html>'),
      goto: vi.fn(async () => {
        if (options.gotoError) {
          throw options.gotoError;
        }
        return { status: () => 200 };
      }),
      locator: vi.fn(() => ({ textContent: async () => 'ok' })),
      screenshot: vi.fn(async () => Buffer.from('shot')),
      title: vi.fn(async () => 'Example'),
      url: vi.fn(() => 'https://example.com/'),
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
        pendingAuthTasks,
        profileStore,
        runtime,
      }),
      pendingAuthTasks,
      closeLoginWindow: () => closeHandler?.(),
      context,
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
      await createHost();
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
    expect(pendingAuthTasks.list()[0]?.status).toBe('resolved');
    expect(stateChanged).toHaveBeenCalled();
  });
});

async function waitForProfileStatus(
  profileStore: BrowserProfileStore,
  status: string,
): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const profile = await profileStore.getProfile('douban', 'douban-main');
    if (profile?.status === status) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
