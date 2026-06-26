---
title: Browser Client SDK
description: TypeScript SDK for trusted applications that use CthuTool browser sessions.
---

`@cthutool/browser-client` is a TypeScript SDK for third-party applications that use CthuTool's backend public browser session API.

The SDK provides a small Playwright-like page interface, but it does not connect to Playwright, CthuDesktop agents, CDP, or a browser process directly. It sends controlled session and action requests to the configured CthuTool backend.

## Runtime Flow

```text
Third-party app
  -> @cthutool/browser-client
  -> Backend public browser API
  -> Online CthuDesktop browser agent
  -> Desktop-owned Playwright context and page
```

The SDK stores only the public session ID. The backend stores thin routing metadata. CthuDesktop owns the real Playwright context, page, browser profile, and browser storage.

## Basic Usage

```ts
import { CthuBrowserClient } from '@cthutool/browser-client';

const client = new CthuBrowserClient({
  baseUrl: 'https://cthutool.example.test',
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

Use `withPage()` for scoped work that always closes the session:

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

Low-level callers can use `client.createSession()`, `client.runActions()`, and `client.closeSession()` directly.

## Configuration

```ts
const client = new CthuBrowserClient({
  baseUrl: 'https://cthutool.example.test',
  headers: {
    'x-request-source': 'my-crawler',
  },
  fetch: customFetch,
});
```

The first public browser API does not include API key handling. Use it only behind a trusted deployment boundary until backend API authentication is added.

## Limitations

- Talks only to the CthuTool backend public browser API.
- Does not expose raw Playwright objects or arbitrary Playwright script execution.
- Does not connect directly to CthuDesktop agents, CDP, or browser WebSocket endpoints.
- Does not expose cookies, localStorage, Playwright storage-state contents, desktop profile paths, or raw browser handles.
- Navigation is constrained by configured site `allowedOrigins`.

Source reference: `packages/browser-client/README.md`.

Requirements sources:

- `openspec/specs/apps-backend-browser-public-api/spec.md`
- `openspec/specs/packages-browser-client-sdk/spec.md`
