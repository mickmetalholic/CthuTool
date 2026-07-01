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
      evaluate: vi.fn(async (fn: (arg?: unknown) => unknown) => {
        if (fn.name === 'extractListFromPage') {
          return [{ href: 'https://example.com/item', title: 'Item' }];
        }
        if (fn.name === 'extractLinksFromPage') {
          return [{ href: 'https://example.com/item', text: 'Item' }];
        }
        if (fn.name === 'extractMetaFromPage') {
          return { title: 'Example' };
        }
        if (fn.name === 'extractJsonLdFromPage') {
          return [{ '@type': 'Thing', name: 'Example' }];
        }
        return undefined;
      }),
      goto: vi.fn(async () => ({ status: () => pageState.status })),
      locator: vi.fn(() => ({
        allTextContents: vi.fn(async () => [pageState.text, 'more']),
        check: vi.fn(async () => undefined),
        click: vi.fn(async () => undefined),
        count: vi.fn(async () => 2),
        fill: vi.fn(async () => undefined),
        getAttribute: vi.fn(async (name: string) =>
          name === 'href' ? 'https://example.com/item' : null,
        ),
        hover: vi.fn(async () => undefined),
        innerHTML: vi.fn(async () => '<strong>ok</strong>'),
        innerText: vi.fn(async () => pageState.text),
        press: vi.fn(async () => undefined),
        scrollIntoViewIfNeeded: vi.fn(async () => undefined),
        selectOption: vi.fn(async () => ['new']),
        textContent: async () => pageState.text,
        uncheck: vi.fn(async () => undefined),
        waitFor: vi.fn(async () => undefined),
      })),
      screenshot: vi.fn(async () => Buffer.from('shot')),
      title: vi.fn(async () => pageState.title),
      url: vi.fn(() => pageState.url),
      waitForLoadState: vi.fn(async () => undefined),
      waitForResponse: vi.fn(async () => ({
        headers: () => ({ 'content-type': 'text/html' }),
        request: () => ({ method: () => 'GET' }),
        status: () => 200,
        url: () => pageState.url,
      })),
      waitForURL: vi.fn(async () => undefined),
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
        runtime: runtime as never,
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

  test('executes crawler session actions with safe result shapes', async () => {
    const { host } = await createHost();
    await host.executeRequest(
      createBrowserRuntimeRequest('create-crawler', 'browser.createSession', {
        authPolicy: 'anonymous',
        sessionId: 'session-1',
        siteId: 'example',
      }),
    );

    const result = await host.executeRequest(
      createBrowserRuntimeRequest('run-crawler', 'browser.runActions', {
        actions: [
          { type: 'url' },
          { selector: 'h1', type: 'innerText' },
          { selector: '#main', type: 'innerHTML' },
          { name: 'href', selector: 'a', type: 'getAttribute' },
          { selector: '.item', type: 'locatorCount' },
          { selector: '.item', type: 'allTextContents' },
          { selector: '.item', type: 'exists' },
          { key: 'Enter', selector: 'input', type: 'press' },
          { selector: '.item', type: 'hover' },
          { selector: 'select', type: 'selectOption', value: 'new' },
          { selector: '#agree', type: 'check' },
          { selector: '#agree', type: 'uncheck' },
          { target: 'page', type: 'scroll', y: 100 },
          { state: 'load', type: 'waitForLoadState' },
          { target: { pattern: 'example.com' }, type: 'waitForURL' },
          { target: { pattern: 'example.com' }, type: 'waitForResponse' },
          {
            fields: {
              href: { attribute: 'href', selector: 'a', type: 'attribute' },
              title: { selector: '.title', type: 'text' },
            },
            itemSelector: '.item',
            type: 'extractList',
          },
          { selector: 'a', type: 'extractLinks' },
          { type: 'extractMeta' },
          { type: 'extractJsonLd' },
        ],
        authPolicy: 'anonymous',
        sessionId: 'session-1',
        siteId: 'example',
      }),
    );

    expect(result).toMatchObject({
      id: 'run-crawler',
      result: {
        actionResults: expect.arrayContaining([
          { type: 'url', url: 'https://example.com/' },
          { text: 'ok', type: 'innerText' },
          { html: '<strong>ok</strong>', type: 'innerHTML' },
          { attribute: 'https://example.com/item', type: 'getAttribute' },
          { count: 2, type: 'locatorCount' },
          { texts: ['ok', 'more'], type: 'allTextContents' },
          { exists: true, type: 'exists' },
          {
            response: {
              contentType: 'text/html',
              method: 'GET',
              status: 200,
              url: 'https://example.com/',
            },
            type: 'waitForResponse',
          },
          {
            items: [{ href: 'https://example.com/item', title: 'Item' }],
            type: 'extractList',
          },
          {
            links: [{ href: 'https://example.com/item', text: 'Item' }],
            type: 'extractLinks',
          },
          { meta: { title: 'Example' }, type: 'extractMeta' },
          {
            jsonLd: [{ '@type': 'Thing', name: 'Example' }],
            type: 'extractJsonLd',
          },
        ]),
      },
    });
  });
});

type PageState = {
  readonly html: string;
  readonly status: number;
  readonly text: string;
  readonly title: string;
  readonly url: string;
};
