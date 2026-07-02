## 1. Protocol Contract

- [x] 1.1 Extend `packages/browser-runtime-protocol` action type unions with crawler actions for URL/load waiting, selector extraction, interactions, scrolling, structured extraction, metadata extraction, JSON-LD extraction, and bounded response waiting.
- [x] 1.2 Add typed descriptor models for extraction fields, list extraction, link extraction, metadata extraction, JSON-LD extraction, scroll targets, URL matching, and response matching.
- [x] 1.3 Add typed result models for selector values, structured extraction arrays, page metadata, links, JSON-LD records, URL results, and response summaries.
- [x] 1.4 Add protocol validation tests that accept every supported crawler action and reject unsupported executable script, function predicate, malformed selector, malformed URL, and oversized descriptor payloads.

## 2. Backend Public API

- [x] 2.1 Update public browser action validation to use or mirror the expanded protocol action schema while preserving current action count, payload size, and timeout limits.
- [x] 2.2 Add backend validation for concrete navigational URL origins in crawler actions that can be checked before desktop dispatch.
- [x] 2.3 Preserve ordered crawler action result pass-through and structured public errors without exposing raw request headers, response headers, response bodies, cookies, storage, profile paths, WebSocket objects, or Playwright handles.
- [x] 2.4 Add backend unit and e2e tests for accepted crawler action lists, rejected invalid crawler actions, rejected executable payloads, origin policy, and safe result envelopes.

## 3. Desktop Browser Host

- [x] 3.1 Implement CthuDesktop execution for selector extraction actions: `url`, `innerText`, `innerHTML`, `getAttribute`, `locatorCount`, `allTextContents`, and `exists`.
- [x] 3.2 Implement CthuDesktop execution for interaction actions: `press`, `hover`, `selectOption`, `check`, `uncheck`, and `scroll`.
- [x] 3.3 Implement CthuDesktop execution for waiting actions: `waitForLoadState`, `waitForURL`, and bounded `waitForResponse` with safe response summaries.
- [x] 3.4 Implement CthuDesktop execution for crawler-native extraction actions: `extractList`, `extractLinks`, `extractMeta`, and `extractJsonLd`.
- [x] 3.5 Enforce desktop payload, timeout, and item-count limits for new crawler results and return structured size-limit or timeout errors.
- [x] 3.6 Add desktop browser host tests for ordered execution, extraction result shapes, interaction final URL metadata, blocked executable payloads, response summary redaction, and large-result bounding.

## 4. SDK Surface

- [x] 4.1 Extend `packages/browser-client` public types with crawler action inputs, extraction descriptors, extraction result records, response summaries, and method option types.
- [x] 4.2 Add `BrowserPage` convenience methods for navigation helpers, selector extraction helpers, interaction helpers, scrolling, crawler-native extraction, and response waiting.
- [x] 4.3 Normalize new action result envelopes into typed SDK return values and keep malformed-result errors for unexpected backend responses.
- [x] 4.4 Add SDK tests that assert method-to-action mapping, typed return normalization, closed-page rejection, and no Playwright dependency.

## 5. Documentation

- [x] 5.1 Update `packages/browser-client/README.md` with a crawler workflow example using navigation, waiting, `extractList`, metadata extraction, and session cleanup.
- [x] 5.2 Update docs site browser automation, browser client SDK, and backend API reference pages with the expanded action set and explicit non-goals.
- [x] 5.3 Document that `evaluate`, raw Playwright objects, route interception, browser context storage, downloads, uploads, and Playwright Test assertions remain unsupported.

## 6. Verification

- [x] 6.1 Run targeted protocol, backend, desktop, and SDK test suites affected by this change.
- [x] 6.2 Run package typechecks for `@cthutool/browser-runtime-protocol`, `@cthutool/browser-client`, `@cthutool/backend`, and `@cthutool/desktop`.
- [x] 6.3 Run OpenSpec validation/status for `add-browser-crawler-automation-platform` and confirm the change is apply-ready.
- [x] 6.4 Confirm generated agent adapter files under `.claude/`, `.codex/`, and `.cursor/` remain unchanged unless a separate regeneration is explicitly requested.
