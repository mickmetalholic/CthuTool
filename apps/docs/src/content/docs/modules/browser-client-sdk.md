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

## Crawler Usage

```ts
const data = await client.withPage({ siteId: 'example_public' }, async (page) => {
  await page.goto('https://example.com/list');
  await page.waitForLoadState('networkidle');
  await page.scroll('page', { y: 800 });

  const items = await page.extractList('.result', {
    title: { selector: '.title', type: 'text' },
    href: { selector: 'a', type: 'attribute', attribute: 'href' },
  });
  const meta = await page.extractMeta();
  const jsonLd = await page.extractJsonLd();

  return { items, meta, jsonLd };
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
- Provides a crawler-focused Playwright-like subset, not full Playwright API compatibility.
- Does not expose raw Playwright objects or arbitrary `evaluate` script execution.
- Does not expose route interception, browser context storage, downloads, uploads, or Playwright Test assertions.
- Does not connect directly to CthuDesktop agents, CDP, or browser WebSocket endpoints.
- Does not expose cookies, localStorage, Playwright storage-state contents, desktop profile paths, or raw browser handles.
- Navigation is constrained by configured site `allowedOrigins`.

Source reference: `packages/browser-client/README.md`.

Requirements sources:

- `openspec/specs/apps-backend-browser-public-api/spec.md`
- `openspec/specs/packages-browser-client-sdk/spec.md`
