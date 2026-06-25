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
      jsonResponse(200, {
        actionResults: [{ title: 'Low-level', type: 'title' }],
      }),
    ]);
    const client = new CthuBrowserClient({
      baseUrl: 'https://api.example.test',
      fetch,
    });

    await expect(
      client.runActions('session-1', [{ type: 'title' }]),
    ).resolves.toEqual([{ title: 'Low-level', type: 'title' }]);
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
