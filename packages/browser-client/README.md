# @cthutool/browser-client

TypeScript SDK for third-party applications that use CthuTool's backend public
browser session API.

The SDK provides a small Playwright-like page interface, but it does not connect
to Playwright, local Agents, CDP, or a browser process directly. All
browser work is sent to the configured CthuTool backend as controlled session
and action requests.

## Install

From this monorepo:

```bash
pnpm --filter @cthutool/browser-client build
```

## Basic Usage

```ts
import { CthuBrowserClient } from '@cthutool/browser-client';

const client = new CthuBrowserClient({
  baseUrl: 'https://api.example.test',
});

const page = await client.newPage({ siteId: 'douban' });

try {
  await page.goto('https://movie.douban.com/subject/1292052/', {
    waitUntil: 'domcontentloaded',
  });

  const title = await page.textContent('h1');
  const html = await page.content();

  console.log({ title, htmlLength: html.length });
} finally {
  await page.close();
}
```

Session TTL can be configured with `ttlMs`:

```ts
const page = await client.newPage({ siteId: 'douban', ttlMs: 10 * 60 * 1000 });
```

For scoped usage, `withPage()` closes the session with `try/finally` behavior:

```ts
const title = await client.withPage({ siteId: 'douban' }, async (page) => {
  await page.goto('https://movie.douban.com/subject/1292052/');
  return page.textContent('h1');
});
```

## Crawler Usage

Crawler workflows can use Playwright-like waits and crawler-native extraction in
one backend-routed browser session:

```ts
const rows = await client.withPage({ siteId: 'example_public' }, async (page) => {
  await page.goto('https://example.com/list', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await page.scroll('page', { y: 800 });

  const items = await page.extractList('.result', {
    title: { selector: '.title', type: 'text' },
    href: { selector: 'a', type: 'attribute', attribute: 'href' },
    summary: { selector: '.summary', type: 'innerText' },
  });
  const meta = await page.extractMeta();
  const links = await page.extractLinks({ selector: '.result a' });

  return { items, links, meta };
});
```

## Supported Page Methods

- `page.goto(url, options)`
- `page.waitForSelector(selector, options)`
- `page.waitForLoadState(state, options)`
- `page.waitForURL(target, options)`
- `page.waitForResponse(target, options)`
- `page.url()`
- `page.click(selector, options)`
- `page.fill(selector, value, options)`
- `page.press(selector, key, options)`
- `page.hover(selector, options)`
- `page.selectOption(selector, value, options)`
- `page.check(selector, options)`
- `page.uncheck(selector, options)`
- `page.scroll(target, options)`
- `page.textContent(selector, options)`
- `page.innerText(selector, options)`
- `page.innerHTML(selector, options)`
- `page.getAttribute(selector, name, options)`
- `page.locatorCount(selector, options)`
- `page.allTextContents(selector, options)`
- `page.exists(selector, options)`
- `page.content()`
- `page.title()`
- `page.screenshot(options)`
- `page.extractList(itemSelector, fields, options)`
- `page.extractLinks(options)`
- `page.extractMeta(options)`
- `page.extractJsonLd(options)`
- `page.close()`

Low-level callers can use `client.createSession()`, `client.runActions()`, and
`client.closeSession()` directly.

## Configuration

```ts
const client = new CthuBrowserClient({
  baseUrl: 'https://api.example.test',
  headers: {
    'x-request-source': 'my-crawler',
  },
  fetch: customFetch,
});
```

The first version does not include API key handling because backend
authentication is not part of the public browser API yet. Custom headers are
available so a future authentication layer can be adopted without changing the
client shape.

## Session Lifecycle

`newPage()` creates a backend browser session. The backend routes that session
to a desktop browser host, while the SDK only stores the public session ID. Call
`page.close()` when work is complete so the backend and desktop can release the
browser session.

## Limitations

- Talks only to the CthuTool backend public browser API.
- Provides a crawler-focused Playwright-like subset, not full Playwright API
  compatibility.
- Does not expose raw Playwright objects or arbitrary `evaluate` script
  execution.
- Does not expose route interception, browser context storage, downloads,
  uploads, or Playwright Test assertions.
- Does not connect to local Agents, CDP, or browser WebSocket endpoints.
- Does not expose cookies, localStorage, Playwright storage-state contents,
  desktop profile paths, or raw browser handles.
- Assumes a trusted backend deployment until backend API authentication is
  introduced.
