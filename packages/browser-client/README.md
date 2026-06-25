# @cthutool/browser-client

TypeScript SDK for third-party applications that use CthuTool's backend public
browser session API.

The SDK provides a small Playwright-like page interface, but it does not connect
to Playwright, CthuDesktop agents, CDP, or a browser process directly. All
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

For scoped usage, `withPage()` closes the session with `try/finally` behavior:

```ts
const title = await client.withPage({ siteId: 'douban' }, async (page) => {
  await page.goto('https://movie.douban.com/subject/1292052/');
  return page.textContent('h1');
});
```

## Supported Page Methods

- `page.goto(url, options)`
- `page.waitForSelector(selector, options)`
- `page.click(selector, options)`
- `page.fill(selector, value, options)`
- `page.textContent(selector, options)`
- `page.content()`
- `page.title()`
- `page.screenshot(options)`
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
- Does not expose raw Playwright objects or arbitrary Playwright script
  execution.
- Does not connect to CthuDesktop agents, CDP, or browser WebSocket endpoints.
- Does not expose cookies, localStorage, Playwright storage-state contents,
  desktop profile paths, or raw browser handles.
- Assumes a trusted backend deployment until backend API authentication is
  introduced.
