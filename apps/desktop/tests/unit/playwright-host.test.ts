import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createBrowserRuntimeRequest } from '@cthutool/browser-runtime-protocol';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { BrowserProfileStore } from '../../src/main/browser-profile-store';
import { PlaywrightHost } from '../../src/main/playwright-host';

describe('PlaywrightHost', () => {
  let tempDir: string | undefined;

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, {
        force: true,
        maxRetries: 5,
        recursive: true,
        retryDelay: 20,
      });
      tempDir = undefined;
    }
  });

  async function createHost(pagePatch: Partial<PageState> = {}) {
    tempDir = await mkdtemp(join(tmpdir(), 'cthutool-playwright-host-'));
    const profileStore = new BrowserProfileStore(
      tempDir,
      () => new Date('2026-06-13T10:00:00.000Z'),
    );
    const pageState: PageState = {
      html: '<html><body>ok</body></html>',
      status: 200,
      text: 'ok',
      title: 'Example',
      url: 'https://example.com/',
      ...pagePatch,
    };
    const page = {
      content: vi.fn(async () => pageState.html),
      goto: vi.fn(async () => ({ status: () => pageState.status })),
      locator: vi.fn(() => ({
        click: vi.fn(async () => undefined),
        fill: vi.fn(async () => undefined),
        textContent: async () => pageState.text,
        waitFor: vi.fn(async () => undefined),
      })),
      screenshot: vi.fn(async () => Buffer.from('shot')),
      title: vi.fn(async () => pageState.title),
      url: vi.fn(() => pageState.url),
    };
    const context = {
      close: vi.fn(async () => undefined),
      newPage: vi.fn(async () => page),
      on: vi.fn(),
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
      context,
      host: new PlaywrightHost({
        agentId: 'agent-1',
        now: () => new Date('2026-06-13T10:00:00.000Z'),
        profileStore,
        runtime,
        runtimeValidator: async () => ({ ok: true }),
      }),
      page,
      profileStore,
      runtime,
    };
  }

  test('returns JSON-RPC challenge when a required profile is missing', async () => {
    const { host, runtime } = await createHost();

    const result = await host.executeRequest(
      createBrowserRuntimeRequest('cmd-1', 'browser.capturePage', {
        authPolicy: 'required',
        loginUrl: 'https://example.com/login',
        profileName: 'douban-main',
        siteId: 'douban',
        url: 'https://example.com/',
      }),
    );

    expect(result).toMatchObject({
      id: 'cmd-1',
      jsonrpc: '2.0',
      error: {
        data: {
          code: 'AUTH_PROFILE_REQUIRED',
          challenge: {
            kind: 'login_required',
            profileName: 'douban-main',
            siteId: 'douban',
          },
          profileStatus: 'missing',
        },
      },
    });
    expect(runtime.launchPersistentContext).not.toHaveBeenCalled();
  });

  test('captures a page for verified required profiles', async () => {
    const { host, profileStore, runtime } = await createHost();
    await profileStore.markStatus('douban', 'douban-main', 'verified');

    const result = await host.executeRequest(
      createBrowserRuntimeRequest('cmd-2', 'browser.capturePage', {
        authPolicy: 'required',
        includeHtml: true,
        includeText: true,
        profileName: 'douban-main',
        siteId: 'douban',
        url: 'https://example.com/',
      }),
    );

    expect(result).toMatchObject({
      id: 'cmd-2',
      result: {
        detection: { kind: 'ok' },
        finalUrl: 'https://example.com/',
        html: '<html><body>ok</body></html>',
        text: 'ok',
      },
    });
    expect(runtime.launchPersistentContext).toHaveBeenCalledWith(
      expect.stringContaining(join('douban', 'douban-main')),
      { channel: 'chrome', headless: true },
    );
  });

  test('opens login explicitly without pending auth task storage', async () => {
    const { host, runtime } = await createHost({
      text: 'please sign in',
      url: 'https://example.com/login',
    });

    const result = await host.executeRequest(
      createBrowserRuntimeRequest('cmd-login', 'browser.openLogin', {
        authPolicy: 'required',
        loginUrl: 'https://example.com/login',
        profileName: 'douban-main',
        siteId: 'douban',
      }),
    );

    expect(result).toMatchObject({
      id: 'cmd-login',
      result: {
        detection: { kind: 'login_required' },
        finalUrl: 'https://example.com/login',
      },
    });
    expect(runtime.launchPersistentContext).toHaveBeenCalledWith(
      expect.stringContaining(join('douban', 'douban-main')),
      { channel: 'chrome', headless: false },
    );
  });

  test('verifies generic profiles and updates profile metadata', async () => {
    const { host, profileStore } = await createHost();

    const result = await host.executeRequest(
      createBrowserRuntimeRequest('cmd-verify', 'browser.verifyProfile', {
        authPolicy: 'required',
        profileName: 'generic-main',
        siteId: 'generic',
        verifyUrl: 'https://example.com/',
      }),
    );

    expect(result).toMatchObject({
      id: 'cmd-verify',
      result: {
        detection: { kind: 'ok' },
        profile: {
          profileName: 'generic-main',
          siteId: 'generic',
          status: 'verified',
        },
      },
    });
    await expect(
      profileStore.getProfile('generic', 'generic-main'),
    ).resolves.toMatchObject({ status: 'verified' });
  });
});

type PageState = {
  readonly html: string;
  readonly status: number;
  readonly text: string;
  readonly title: string;
  readonly url: string;
};
