## Context

`apps/backend/src/modules/browser-automation` has already shed several responsibilities:

- `SitesConfigModule` owns browser site configuration loading and merging.
- `BrowserAuthModule` owns browser profile and pending-auth coordination through agent state.
- `BrowserAgentCaptureModule` owns agent-backed browser capture execution and the `BROWSER_CAPTURE_PROVIDER` binding.

The remaining `BrowserAutomationModule` still directly registers the browser content pipeline: `BrowserContentService`, `BrowserTaskRunner`, `BrowserBlockDetector`, and `BrowserDiagnosticsStore`. That makes the module name cover both public `/api/browser/*` endpoints and internal page-content retrieval orchestration.

The next boundary should make browser content retrieval a first-class backend module while keeping the public browser API stable.

## Goals / Non-Goals

**Goals:**

- Create `BrowserContentModule` under `apps/backend/src/modules/browser-content`.
- Move the content pipeline service and support providers into the new module.
- Keep `BrowserContentService` as the internal service exported for backend consumers.
- Keep `BrowserAutomationModule` as the public browser API facade and composition module.
- Preserve existing request/result shapes, route behavior, task controls, detection behavior, diagnostics behavior, and error codes.
- Keep implementation churn focused on module/file moves and import updates.

**Non-Goals:**

- Do not move `BrowserAuthStateStore` or browser extension auth bundle helpers; those need a separate auth-bundle cleanup.
- Do not redesign the browser capture provider contract.
- Do not change desktop agent protocol messages.
- Do not change `/api/browser/*` routes or response envelopes.
- Do not introduce new external dependencies.
- Do not extract shared browser types into a package in this change.

## Decisions

### Decision: Extract `BrowserContentModule` as the next boundary

`BrowserContentModule` will import `BrowserAgentCaptureModule` and `SitesConfigModule`, register content pipeline providers, and export `BrowserContentService`.

This matches the actual dependency direction:

```text
BrowserAutomationModule
  -> BrowserContentModule
     -> BrowserAgentCaptureModule
     -> SitesConfigModule
```

Alternative considered: move only `BrowserContentService` and leave task runner, detection, and diagnostics providers in `BrowserAutomationModule`. That would reduce file movement, but it would keep browser automation responsible for content pipeline internals and make the new module thin in the wrong way.

### Decision: Keep `BrowserAutomationModule` as the public API facade

`BrowserAutomationController` will stay in `browser-automation`. It uses `SitesConfigService` and `BrowserAuthService` to expose `/api/browser/sites`, `/api/browser/profiles`, and `/api/browser/pending-auth-tasks`. Those routes are public browser API endpoints, not content pipeline internals.

Alternative considered: create a `BrowserApiModule` and move the controller there. That may be useful later, but it would be a broader rename and would not reduce the content pipeline coupling as directly.

### Decision: Keep shared types and errors stable for this change

`browser-automation.types.ts` and `browser-automation.errors.ts` are used by browser automation, browser content, browser auth state helpers, and browser agent capture. This change may update import paths, but it should not split those files unless a compatibility re-export is needed for a clean move.

Alternative considered: extract `browser-content.types.ts` and `browser-capture.types.ts` immediately. That would create a cleaner long-term contract but increase churn across several modules. It is better handled after the module boundaries are stable.

### Decision: Leave auth bundle storage for a follow-up

`BrowserAuthStateStore` and `browser-auth-extension` still live under `browser-automation`, but they are not part of the content pipeline split. Moving them belongs in a separate cleanup that decides whether backend-stored auth bundles are still supported or should be deprecated.

Alternative considered: move auth bundle storage into `BrowserAuthModule` in the same change. That would mix two boundaries and make verification noisier.

## Risks / Trade-offs

- Import churn may obscure behavior preservation -> keep moves mechanical, preserve class names, and run focused tests before broader build checks.
- Nest provider wiring can fail if `BrowserContentModule` does not export the right service or import provider dependencies -> add module wiring coverage for both `BrowserContentModule` and `BrowserAutomationModule`.
- Shared type ownership remains imperfect -> explicitly document it as a non-goal and avoid opportunistic type extraction.
- Diagnostics and task runner factory configuration can drift during the move -> keep existing `parseBrowserConfiguration(process.env)` usage and assert equivalent registration in tests.

## Migration Plan

1. Create `apps/backend/src/modules/browser-content`.
2. Move content pipeline files and tests into the new directory.
3. Add `BrowserContentModule` with imports, providers, factories, and exports.
4. Update `BrowserAutomationModule` to import/export `BrowserContentModule` and remove direct content provider registration.
5. Update import paths in moved tests and dependent modules.
6. Run focused backend tests for browser content, browser automation module wiring, and controller behavior.
7. Run backend build and `git diff --check`.

Rollback is a normal git revert of the module extraction because no runtime data migration or public API change is involved.
