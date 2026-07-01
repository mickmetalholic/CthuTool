import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BrowserClientError,
  type BrowserClientFetch,
  type BrowserClientFetchInit,
  CthuBrowserClient,
} from '../src';

type RecordedRequest = {
  readonly input: string;
  readonly init?: BrowserClientFetchInit;
};

describe('CthuBrowserClient transport', () => {
  it('creates sessions with configured base URL, headers, and injected fetch', async () => {
    const { calls, fetch } = createMockFetch([
      jsonResponse(200, { sessionId: 'session-1', siteId: 'douban' }),
    ]);
    const client = new CthuBrowserClient({
      baseUrl: 'https://api.example.test/',
      fetch,
      headers: { authorization: 'Bearer test' },
    });

    const session = await client.createSession({
      authPolicy: 'required',
      expiresInMs: 60_000,
      siteId: 'douban',
    });

    expect(session.sessionId).toBe('session-1');
    expect(calls).toEqual([
      {
        input: 'https://api.example.test/api/browser/sessions',
        init: {
          body: JSON.stringify({
            authPolicy: 'required',
            siteId: 'douban',
            ttlMs: 60_000,
          }),
          headers: {
            accept: 'application/json',
            authorization: 'Bearer test',
            'content-type': 'application/json',
          },
          method: 'POST',
          signal: undefined,
        },
      },
    ]);
  });

  it('maps crawler page methods to backend actions and normalizes results', async () => {
    const { calls, fetch } = createMockFetch([
      jsonResponse(200, { session: { sessionId: 'session-1' } }),
      jsonResponse(200, { results: [{ type: 'waitForLoadState' }] }),
      jsonResponse(200, {
        results: [
          { finalUrl: 'https://example.test/list', type: 'waitForURL' },
        ],
      }),
      jsonResponse(200, {
        results: [
          {
            response: {
              contentType: 'text/html',
              method: 'GET',
              status: 200,
              url: 'https://example.test/list',
            },
            type: 'waitForResponse',
          },
        ],
      }),
      jsonResponse(200, {
        results: [{ type: 'url', url: 'https://example.test/list' }],
      }),
      jsonResponse(200, { results: [{ text: 'Heading', type: 'innerText' }] }),
      jsonResponse(200, {
        results: [{ html: '<b>Heading</b>', type: 'innerHTML' }],
      }),
      jsonResponse(200, {
        results: [{ attribute: '/item/1', type: 'getAttribute' }],
      }),
      jsonResponse(200, { results: [{ count: 2, type: 'locatorCount' }] }),
      jsonResponse(200, {
        results: [{ texts: ['One', 'Two'], type: 'allTextContents' }],
      }),
      jsonResponse(200, { results: [{ exists: true, type: 'exists' }] }),
      jsonResponse(200, { results: [{ type: 'press' }] }),
      jsonResponse(200, { results: [{ type: 'hover' }] }),
      jsonResponse(200, { results: [{ type: 'selectOption' }] }),
      jsonResponse(200, { results: [{ type: 'check' }] }),
      jsonResponse(200, { results: [{ type: 'uncheck' }] }),
      jsonResponse(200, { results: [{ type: 'scroll' }] }),
      jsonResponse(200, {
        results: [
          {
            items: [{ href: '/item/1', title: 'One' }],
            type: 'extractList',
          },
        ],
      }),
      jsonResponse(200, {
        results: [
          {
            links: [{ href: 'https://example.test/item/1', text: 'One' }],
            type: 'extractLinks',
          },
        ],
      }),
      jsonResponse(200, {
        results: [{ meta: { title: 'Example' }, type: 'extractMeta' }],
      }),
      jsonResponse(200, {
        results: [
          {
            jsonLd: [{ '@type': 'Thing', name: 'Example' }],
            type: 'extractJsonLd',
          },
        ],
      }),
    ]);
    const client = new CthuBrowserClient({
      baseUrl: 'https://api.example.test',
      fetch,
    });

    const page = await client.newPage({ siteId: 'example' });

    await page.waitForLoadState('networkidle', { timeoutMs: 1000 });
    await page.waitForURL('https://example.test/list');
    await expect(page.waitForResponse({ pattern: '/list' })).resolves.toEqual({
      contentType: 'text/html',
      method: 'GET',
      status: 200,
      url: 'https://example.test/list',
    });
    await expect(page.url()).resolves.toBe('https://example.test/list');
    await expect(page.innerText('h1')).resolves.toBe('Heading');
    await expect(page.innerHTML('h1')).resolves.toBe('<b>Heading</b>');
    await expect(page.getAttribute('a', 'href')).resolves.toBe('/item/1');
    await expect(page.locatorCount('.item')).resolves.toBe(2);
    await expect(page.allTextContents('.item')).resolves.toEqual([
      'One',
      'Two',
    ]);
    await expect(page.exists('.item')).resolves.toBe(true);
    await page.press('input', 'Enter');
    await page.hover('.item');
    await page.selectOption('select', 'new');
    await page.check('#agree');
    await page.uncheck('#agree');
    await page.scroll('page', { y: 600 });
    await expect(
      page.extractList('.item', {
        href: { attribute: 'href', selector: 'a', type: 'attribute' },
        title: { selector: '.title', type: 'text' },
      }),
    ).resolves.toEqual([{ href: '/item/1', title: 'One' }]);
    await expect(page.extractLinks({ selector: '.item a' })).resolves.toEqual([
      { href: 'https://example.test/item/1', text: 'One' },
    ]);
    await expect(page.extractMeta()).resolves.toEqual({ title: 'Example' });
    await expect(page.extractJsonLd()).resolves.toEqual([
      { '@type': 'Thing', name: 'Example' },
    ]);

    expect(JSON.parse(calls[1]?.init?.body ?? '{}')).toEqual({
      actions: [
        { state: 'networkidle', timeoutMs: 1000, type: 'waitForLoadState' },
      ],
    });
    expect(JSON.parse(calls[2]?.init?.body ?? '{}')).toEqual({
      actions: [
        {
          target: { url: 'https://example.test/list' },
          type: 'waitForURL',
        },
      ],
    });
    expect(JSON.parse(calls[17]?.init?.body ?? '{}')).toEqual({
      actions: [
        {
          fields: {
            href: { attribute: 'href', selector: 'a', type: 'attribute' },
            title: { selector: '.title', type: 'text' },
          },
          itemSelector: '.item',
          type: 'extractList',
        },
      ],
    });
  });

  it('does not depend on Playwright', () => {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../package.json'), 'utf8'),
    ) as { readonly dependencies?: Record<string, string> };
    expect(packageJson.dependencies).toBeUndefined();
  });

  it('maps backend structured errors to BrowserClientError', async () => {
    const { fetch } = createMockFetch([
      jsonResponse(403, {
        error: {
          code: 'ORIGIN_NOT_ALLOWED',
          message: 'origin is not allowed',
          metadata: { origin: 'https://blocked.example' },
        },
      }),
    ]);
    const client = new CthuBrowserClient({
      baseUrl: 'https://api.example.test',
      fetch,
    });

    await expect(
      client.createSession({ siteId: 'blocked' }),
    ).rejects.toMatchObject({
      code: 'ORIGIN_NOT_ALLOWED',
      message: 'origin is not allowed',
      metadata: { origin: 'https://blocked.example' },
      status: 403,
    });
  });

  it('maps transport failures to BrowserClientError', async () => {
    const fetch: BrowserClientFetch = async () => {
      throw new Error('network down');
    };
    const client = new CthuBrowserClient({
      baseUrl: 'https://api.example.test',
      fetch,
    });

    await expect(client.createSession()).rejects.toMatchObject({
      code: 'TRANSPORT_ERROR',
      message: 'Browser API request failed: network down',
    });
  });

  it('rejects malformed session and action envelopes', async () => {
    const { fetch } = createMockFetch([
      jsonResponse(200, { session: {} }),
      jsonResponse(200, { ok: true }),
    ]);
    const client = new CthuBrowserClient({
      baseUrl: 'https://api.example.test',
      fetch,
    });

    await expect(client.createSession()).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
      message: 'Browser API create-session response did not include sessionId',
    });
    await expect(
      client.runActions('session-1', [{ type: 'title' }]),
    ).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
      message: 'Browser API run-actions response did not include results',
    });
  });
});

describe('BrowserPage convenience API', () => {
  it('maps page methods to ordered backend actions', async () => {
    const { calls, fetch } = createMockFetch([
      jsonResponse(200, { session: { sessionId: 'session-1' } }),
      jsonResponse(200, {
        results: [{ type: 'goto', finalUrl: 'https://example.test' }],
      }),
      jsonResponse(200, {
        results: [{ type: 'textContent', text: 'Example' }],
      }),
      jsonResponse(200, {
        results: [{ html: '<html></html>', type: 'content' }],
      }),
      jsonResponse(200, {
        results: [{ title: 'Example title', type: 'title' }],
      }),
      jsonResponse(200, {
        results: [
          {
            base64: 'iVBORw0KGgo=',
            mimeType: 'image/png',
            type: 'screenshot',
          },
        ],
      }),
      emptyResponse(204),
    ]);
    const client = new CthuBrowserClient({
      baseUrl: 'https://api.example.test',
      fetch,
    });

    const page = await client.newPage({ siteId: 'example' });
    await page.goto('https://example.test', { waitUntil: 'domcontentloaded' });
    await expect(page.textContent('h1')).resolves.toBe('Example');
    await expect(page.content()).resolves.toBe('<html></html>');
    await expect(page.title()).resolves.toBe('Example title');
    await expect(page.screenshot({ fullPage: true })).resolves.toEqual({
      base64: 'iVBORw0KGgo=',
      mimeType: 'image/png',
    });
    await page.close();

    expect(JSON.parse(calls[1]?.init?.body ?? '{}')).toEqual({
      actions: [
        {
          type: 'goto',
          url: 'https://example.test',
          waitUntil: 'domcontentloaded',
        },
      ],
    });
    expect(JSON.parse(calls[2]?.init?.body ?? '{}')).toEqual({
      actions: [{ selector: 'h1', type: 'textContent' }],
    });
    expect(JSON.parse(calls[5]?.init?.body ?? '{}')).toEqual({
      actions: [{ fullPage: true, type: 'screenshot' }],
    });
    expect(calls[6]).toMatchObject({
      input: 'https://api.example.test/api/browser/sessions/session-1',
      init: { method: 'DELETE' },
    });
  });

  it('supports low-level runActions calls', async () => {
    const { fetch } = createMockFetch([
      jsonResponse(200, [{ title: 'Low-level', type: 'title' }]),
      jsonResponse(200, {
        actionResults: [{ title: 'Envelope', type: 'title' }],
      }),
    ]);
    const client = new CthuBrowserClient({
      baseUrl: 'https://api.example.test',
      fetch,
    });

    await expect(
      client.runActions('session-1', [{ type: 'title' }]),
    ).resolves.toEqual([{ title: 'Low-level', type: 'title' }]);
    await expect(
      client.runActions('session-1', [{ type: 'title' }]),
    ).resolves.toEqual([{ title: 'Envelope', type: 'title' }]);
  });

  it('throws browser operation errors returned in action results', async () => {
    const { fetch } = createMockFetch([
      jsonResponse(200, { sessionId: 'session-1' }),
      jsonResponse(200, {
        results: [
          {
            code: 'SELECTOR_TIMEOUT',
            message: 'selector not found',
            ok: false,
            type: 'click',
          },
        ],
      }),
    ]);
    const client = new CthuBrowserClient({
      baseUrl: 'https://api.example.test',
      fetch,
    });
    const page = await client.newPage();

    await expect(page.click('#missing')).rejects.toMatchObject({
      code: 'SELECTOR_TIMEOUT',
      message: 'selector not found',
    });
  });

  it('rejects actions locally after close', async () => {
    const { calls, fetch } = createMockFetch([
      jsonResponse(200, { sessionId: 'session-1' }),
      emptyResponse(204),
    ]);
    const client = new CthuBrowserClient({
      baseUrl: 'https://api.example.test',
      fetch,
    });
    const page = await client.newPage();

    await page.close();
    await expect(page.title()).rejects.toBeInstanceOf(BrowserClientError);
    await expect(page.title()).rejects.toMatchObject({ code: 'CLOSED_PAGE' });
    expect(calls).toHaveLength(2);
  });

  it('closes withPage sessions with try/finally behavior', async () => {
    const { calls, fetch } = createMockFetch([
      jsonResponse(200, { sessionId: 'session-1' }),
      jsonResponse(200, {
        results: [{ title: 'Scoped title', type: 'title' }],
      }),
      emptyResponse(204),
    ]);
    const client = new CthuBrowserClient({
      baseUrl: 'https://api.example.test',
      fetch,
    });

    await expect(
      client.withPage({ siteId: 'example' }, (page) => page.title()),
    ).resolves.toBe('Scoped title');
    expect(calls.at(-1)).toMatchObject({
      input: 'https://api.example.test/api/browser/sessions/session-1',
      init: { method: 'DELETE' },
    });
  });

  it('normalizes alternate crawler result fields', async () => {
    const { calls, fetch } = createMockFetch([
      jsonResponse(200, { sessionId: 'session-1' }),
      jsonResponse(200, {
        results: [{ type: 'url', value: 'https://example.test/current' }],
      }),
      jsonResponse(200, {
        results: [{ text: null, type: 'textContent' }],
      }),
      jsonResponse(200, {
        results: [{ type: 'textContent', value: 'Fallback text' }],
      }),
      jsonResponse(200, {
        results: [{ type: 'content', value: '<html></html>' }],
      }),
      jsonResponse(200, {
        results: [{ type: 'title', value: 'Fallback title' }],
      }),
      jsonResponse(200, {
        results: [
          {
            mimeType: 'image/jpeg',
            screenshotBase64: '/9j/4AAQSkZJRg==',
            type: 'screenshot',
          },
        ],
      }),
      jsonResponse(200, {
        results: [{ type: 'screenshot', value: 'iVBORw0KGgo=' }],
      }),
      jsonResponse(200, {
        results: [{ attribute: null, type: 'getAttribute' }],
      }),
      jsonResponse(200, {
        results: [{ type: 'scroll' }],
      }),
    ]);
    const client = new CthuBrowserClient({
      baseUrl: 'https://api.example.test',
      fetch,
    });

    const page = await client.newPage();

    await expect(page.url()).resolves.toBe('https://example.test/current');
    await expect(page.textContent('h1')).resolves.toBeNull();
    await expect(page.textContent('h2')).resolves.toBe('Fallback text');
    await expect(page.content()).resolves.toBe('<html></html>');
    await expect(page.title()).resolves.toBe('Fallback title');
    await expect(page.screenshot()).resolves.toEqual({
      base64: '/9j/4AAQSkZJRg==',
      mimeType: 'image/jpeg',
    });
    await expect(page.screenshot()).resolves.toEqual({
      base64: 'iVBORw0KGgo=',
      mimeType: undefined,
    });
    await expect(page.getAttribute('a', 'href')).resolves.toBeNull();
    await page.scroll('.panel', { timeoutMs: 500, x: 10, y: 20 });

    expect(JSON.parse(calls.at(-1)?.init?.body ?? '{}')).toEqual({
      actions: [
        {
          selector: '.panel',
          target: 'selector',
          timeoutMs: 500,
          type: 'scroll',
          x: 10,
          y: 20,
        },
      ],
    });
  });

  it('rejects malformed crawler action payloads', async () => {
    const { fetch } = createMockFetch([
      jsonResponse(200, { sessionId: 'session-1' }),
      jsonResponse(200, { results: [{ type: 'waitForResponse' }] }),
      jsonResponse(200, { results: [{ type: 'url' }] }),
      jsonResponse(200, { results: [{ type: 'content' }] }),
      jsonResponse(200, { results: [{ type: 'innerText' }] }),
      jsonResponse(200, { results: [{ type: 'innerHTML' }] }),
      jsonResponse(200, { results: [{ type: 'locatorCount' }] }),
      jsonResponse(200, { results: [{ type: 'allTextContents' }] }),
      jsonResponse(200, { results: [{ type: 'exists' }] }),
      jsonResponse(200, { results: [{ type: 'extractList' }] }),
      jsonResponse(200, { results: [{ type: 'extractLinks' }] }),
      jsonResponse(200, { results: [{ type: 'extractMeta', meta: [] }] }),
      jsonResponse(200, { results: [{ type: 'extractJsonLd' }] }),
      jsonResponse(200, { results: [{ type: 'screenshot' }] }),
      jsonResponse(200, { results: [] }),
    ]);
    const client = new CthuBrowserClient({
      baseUrl: 'https://api.example.test',
      fetch,
    });
    const page = await client.newPage();

    await expect(page.waitForResponse('/api')).rejects.toMatchObject({
      code: 'MALFORMED_RESPONSE',
    });
    await expect(page.url()).rejects.toMatchObject({
      message: 'Browser API action "url" returned an unexpected result',
    });
    await expect(page.content()).rejects.toMatchObject({
      message: 'Browser API action "content" returned an unexpected result',
    });
    await expect(page.innerText('h1')).rejects.toBeInstanceOf(
      BrowserClientError,
    );
    await expect(page.innerHTML('h1')).rejects.toBeInstanceOf(
      BrowserClientError,
    );
    await expect(page.locatorCount('.item')).rejects.toBeInstanceOf(
      BrowserClientError,
    );
    await expect(page.allTextContents('.item')).rejects.toBeInstanceOf(
      BrowserClientError,
    );
    await expect(page.exists('.item')).rejects.toBeInstanceOf(
      BrowserClientError,
    );
    await expect(page.extractList('.item', {})).rejects.toBeInstanceOf(
      BrowserClientError,
    );
    await expect(page.extractLinks()).rejects.toBeInstanceOf(
      BrowserClientError,
    );
    await expect(page.extractMeta()).rejects.toBeInstanceOf(BrowserClientError);
    await expect(page.extractJsonLd()).rejects.toBeInstanceOf(
      BrowserClientError,
    );
    await expect(page.screenshot()).rejects.toBeInstanceOf(BrowserClientError);
    await expect(page.title()).rejects.toMatchObject({
      message: 'Browser API action "title" returned an unexpected result',
    });
  });

  it('preserves callback failures when cleanup also fails', async () => {
    const { fetch } = createMockFetch([
      jsonResponse(200, { sessionId: 'session-1' }),
      jsonResponse(500, {
        error: {
          code: 'CLOSE_FAILED',
          message: 'close failed',
        },
      }),
    ]);
    const client = new CthuBrowserClient({
      baseUrl: 'https://api.example.test',
      fetch,
    });

    await expect(
      client.withPage({ siteId: 'example' }, async () => {
        throw new Error('callback failed');
      }),
    ).rejects.toThrow('callback failed');
  });
});

function createMockFetch(responses: readonly MockResponse[]): {
  readonly calls: RecordedRequest[];
  readonly fetch: BrowserClientFetch;
} {
  const calls: RecordedRequest[] = [];
  const queue = [...responses];
  const fetch: BrowserClientFetch = async (input, init) => {
    calls.push({ input, init });
    const response = queue.shift();
    if (!response) {
      throw new Error(`unexpected request to ${input}`);
    }
    return response;
  };

  return { calls, fetch };
}

type MockResponse = {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  json(): Promise<unknown>;
  text(): Promise<string>;
};

function jsonResponse(status: number, value: unknown): MockResponse {
  const text = JSON.stringify(value);
  return {
    json: async () => value,
    ok: status >= 200 && status < 300,
    status,
    statusText: statusText(status),
    text: async () => text,
  };
}

function emptyResponse(status: number): MockResponse {
  return {
    json: async () => undefined,
    ok: status >= 200 && status < 300,
    status,
    statusText: statusText(status),
    text: async () => '',
  };
}

function statusText(status: number): string {
  return status >= 200 && status < 300 ? 'OK' : 'Error';
}
