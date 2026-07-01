## Context

CthuTool already has a backend public browser session API, a TypeScript SDK, a shared browser runtime protocol, and a CthuDesktop Playwright host. The current public session action set covers basic navigation, selector interaction, page HTML/text extraction, title, screenshot, and close. That shape is useful for simple page capture, but external crawler integrations need a broader set of common Playwright-like operations and crawler-native extraction helpers.

The platform boundary remains important: external callers talk to the backend, the backend routes typed commands to one desktop agent, and CthuDesktop owns Playwright contexts, pages, profiles, cookies, storage, and local browser execution. This change expands the controlled action DSL without turning the backend into a raw Playwright proxy.

## Goals / Non-Goals

**Goals:**

- Provide a practical remote browser automation surface for crawler and authenticated content extraction workflows.
- Keep SDK methods familiar to Playwright users while mapping every operation to serializable, validated action payloads.
- Add crawler-native extraction actions that reduce round trips for common list, metadata, link, and structured-data scraping.
- Preserve site origin allowlists, payload limits, session TTLs, profile isolation, and sensitive-state redaction.
- Keep Playwright as a desktop-only dependency and implementation detail.

**Non-Goals:**

- Full Playwright API compatibility.
- Exposing raw `Browser`, `BrowserContext`, `Page`, `Locator`, `Request`, `Response`, `Route`, cookie, localStorage, sessionStorage, or storage-state objects.
- Arbitrary script execution as the default crawler extension point.
- General-purpose browser test runner behavior, assertions, tracing, video, downloads, uploads, or request mocking.
- Bypassing captcha, rate limits, blocked pages, or login requirements.

## Decisions

### Use an expanded declarative action DSL instead of raw Playwright remoting

External callers will continue to submit action lists made of known action types. New crawler actions will be represented as typed JSON payloads such as `innerText`, `innerHTML`, `getAttribute`, `locatorCount`, `allTextContents`, `extractList`, `extractLinks`, `extractMeta`, `extractJsonLd`, `scroll`, `press`, `hover`, `selectOption`, `check`, `uncheck`, `waitForLoadState`, `waitForURL`, and bounded `waitForResponse`.

This keeps validation, origin policy, timeout limits, payload limits, and audit logging enforceable at the backend and protocol boundaries. The alternative was exposing a direct Playwright-like RPC layer, but that would create false compatibility expectations and make sensitive state leakage harder to reason about.

### Add crawler-native extraction helpers

The platform will include high-level extraction actions rather than forcing callers to issue many small selector actions. `extractList` will extract repeated item fields in one desktop round trip, and metadata actions will return links, meta tags, and JSON-LD from the current page.

The alternative was to only mirror more Playwright methods. That would be simpler at the SDK surface but inefficient over a backend-to-desktop transport and more brittle for real crawler workloads.

### Keep `evaluate` out of the initial default surface

Arbitrary page JavaScript execution will not be included in this change's default action set. Many crawler needs can be covered by declarative extraction, scrolling, selector, metadata, and response-waiting actions. If future trusted deployments need JavaScript evaluation, it should be proposed as a separate opt-in capability with site policy, payload limits, return-value limits, and audit semantics.

The alternative was to add `evaluate` now, but that would move the product closer to a remote code execution platform and weaken the current controlled-command guarantee.

### Model response waiting as bounded descriptors

`waitForResponse` will use serializable match descriptors such as URL string, glob-like pattern, method, status range, and timeout. It will return safe response summary metadata, not raw response bodies or Playwright `Response` handles.

The alternative was accepting arbitrary predicate functions, which is not serializable and would require executable script transport.

### Keep backend origin policy on navigational actions

The backend will continue to validate `goto` and any future navigation-like action against the configured site's `allowedOrigins`. Non-navigation extraction actions operate only on the already-open page for that session. If an action can trigger navigation, such as click or form interaction, the desktop result will include the final URL so callers and backend diagnostics can detect unexpected redirects.

## Risks / Trade-offs

- Expanded action surface increases validation and compatibility work -> Mitigate by defining action schemas in `packages/browser-runtime-protocol` first and deriving SDK/backend/desktop behavior from those shared types.
- High-level extraction can grow into a second selector language -> Keep field descriptors small: selector, extraction type, attribute name, optional required flag, and bounded text normalization options.
- Payloads can become large for list extraction, HTML, screenshots, and JSON-LD -> Preserve existing byte limits and truncate or fail with structured size-limit errors.
- More Playwright-like names may imply full compatibility -> Document the SDK as Playwright-like and crawler-focused, with explicit non-goals and unsupported APIs.
- Response waiting can expose sensitive URLs or headers -> Return bounded response summaries and continue avoiding cookies, authorization headers, bodies, and raw request/response handles.
- Clicks and form actions can navigate outside the configured origin after dispatch -> Preserve final URL reporting and classify disallowed or blocked outcomes without exposing browser state.

## Migration Plan

The change is additive. Existing SDK methods, public API action payloads, and desktop runtime behavior remain valid.

1. Extend shared action and result schemas in the browser runtime protocol.
2. Update backend public API validation and pass-through result handling.
3. Update CthuDesktop action execution and payload bounding.
4. Add SDK convenience methods and typed results.
5. Update docs and examples for crawler workflows.

Rollback is to stop sending the new action types and deploy versions that reject unsupported actions. Existing basic actions remain compatible.
