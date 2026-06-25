## Why

Third-party applications should be able to use CthuTool's browser capability
without hand-writing backend HTTP requests or learning the desktop agent model.
A small TypeScript SDK can provide a Playwright-like client surface while still
using the backend's controlled browser session API.

## What Changes

- Add a new workspace package for a browser client SDK, tentatively published as
  `@cthutool/browser-client`.
- Provide a typed client for creating sessions, running page actions, and
  closing sessions through the backend public browser API.
- Provide a Playwright-like convenience layer with `client.newPage()`,
  `page.goto()`, `page.click()`, `page.fill()`, `page.textContent()`,
  `page.content()`, `page.title()`, `page.screenshot()`, and `page.close()`.
- Keep the SDK transport explicit and backend-bound; it does not connect to
  Playwright, desktop agents, or CDP directly.
- Defer API key support until backend authentication is introduced.

## Capabilities

### New Capabilities

- `packages-browser-client-sdk`: TypeScript SDK for third-party applications to
  consume the backend public browser session API.

### Modified Capabilities

- None.

## Impact

- Affected code: new package under `packages/browser-client`, package exports,
  TypeScript config, tests, and README/examples.
- Depends on the backend public browser API shape proposed by
  `apps-backend-browser-public-api`.
- No desktop or backend runtime behavior is changed by this SDK change.
