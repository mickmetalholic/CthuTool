## Why

The current browser SDK exposes a small page API that is enough for basic content capture, but it is too narrow for external crawler integrations that need common Playwright-like navigation, interaction, extraction, and diagnostics workflows. Expanding the controlled browser action model now lets CthuTool become a practical remote browser automation platform while preserving the existing backend and desktop safety boundary.

## What Changes

- Extend the public browser action DSL with crawler-focused actions for load-state waiting, URL inspection, selector existence/counting, attribute and HTML extraction, list extraction, page metadata extraction, JSON-LD extraction, scrolling, keyboard input, hover, option selection, checkbox controls, and bounded response waiting.
- Expand `@cthutool/browser-client` with Playwright-like convenience methods that map to those controlled actions without depending on Playwright or exposing raw browser handles.
- Update backend public browser session validation, routing, result shaping, limits, and errors for the expanded action set.
- Update the browser runtime protocol and CthuDesktop browser host so backend and desktop share typed schemas and execute the expanded structured actions in order.
- Preserve the existing security posture: no raw cookies, localStorage, storage-state, profile paths, arbitrary Playwright scripts, or unrestricted cross-origin navigation are exposed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `packages-browser-client-sdk`: Add crawler-focused Playwright-like SDK methods and typed extraction result models.
- `apps-backend-browser-public-api`: Accept, validate, route, and return expanded browser session action types for trusted external callers.
- `packages-browser-runtime-protocol`: Define shared typed schemas for the expanded controlled browser action DSL and result shapes.
- `apps-desktop-browser-host`: Execute the expanded controlled action set through local Playwright sessions while keeping browser state desktop-owned.

## Impact

- Affected packages: `packages/browser-client`, `packages/browser-runtime-protocol`.
- Affected backend modules: `apps/backend/src/modules/browser/public-api`, `apps/backend/src/modules/browser/desktop-runtime`.
- Affected desktop modules: `apps/desktop/src/main/playwright-host.ts`, browser action tests, and related docs.
- Affected documentation: browser automation, browser client SDK, backend API reference, and configuration guidance for crawler site policy.
- No new runtime dependency on Playwright in the SDK; Playwright remains owned by CthuDesktop.
