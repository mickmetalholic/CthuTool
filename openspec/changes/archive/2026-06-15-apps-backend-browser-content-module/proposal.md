## Why

`BrowserAutomationModule` has become a composition point for several browser concerns after the agent capture, auth, and sites config splits. The content retrieval pipeline is now a distinct backend use case, but its service, task controls, block detection, diagnostics storage, and provider wiring still live directly under `browser-automation`.

Extracting a dedicated browser content module makes the boundary explicit: browser automation owns the public `/api/browser/*` facade and module composition, while browser content owns controlled page content retrieval.

## What Changes

- Add a new `BrowserContentModule` under `apps/backend/src/modules/browser-content`.
- Move `BrowserContentService`, `BrowserTaskRunner`, `BrowserBlockDetector`, `BrowserDiagnosticsStore`, and their focused tests from `browser-automation` into the new module.
- Register task runner and diagnostics store factories in `BrowserContentModule`, using the existing browser configuration values.
- Make `BrowserContentModule` import `BrowserAgentCaptureModule` and `SitesConfigModule`, and export `BrowserContentService`.
- Update `BrowserAutomationModule` to consume `BrowserContentModule` instead of directly owning browser content pipeline providers.
- Preserve `BrowserContentService` request/result behavior, diagnostics behavior, task execution controls, and `/api/browser/*` route behavior.
- Keep shared request/result/error types in their current location for this change unless a small compatibility re-export is needed.
- Do not move auth bundle storage or browser auth extension helpers in this change; those remain a follow-up cleanup.

## Capabilities

### New Capabilities
- `apps-backend-browser-content`: Backend browser content retrieval pipeline, including site-aware request normalization, origin allowlist enforcement, task execution controls, block detection, diagnostics storage, and capture provider consumption.

### Modified Capabilities
- `apps-backend-browser-automation`: Browser automation becomes a public API and composition module that imports browser content rather than directly registering content pipeline providers.

## Impact

- Affected backend code:
  - `apps/backend/src/modules/browser-automation/*`
  - new `apps/backend/src/modules/browser-content/*`
  - `apps/backend/src/app.module.ts` only if import paths need adjustment indirectly through module exports
- Affected OpenSpec specs:
  - new `openspec/specs/apps-backend-browser-content/spec.md`
  - update `openspec/specs/apps-backend-browser-automation/spec.md`
- Public API impact:
  - No route, request shape, response shape, or error code changes are intended.
- Test impact:
  - Move/update focused unit tests for browser content service, block detector, diagnostics store, task runner, and module wiring.
  - Keep or update browser automation controller/module tests to verify public facade behavior still compiles through the new module.
