## 1. Browser Content Module

- [x] 1.1 Create `apps/backend/src/modules/browser-content` with `BrowserContentModule`.
- [x] 1.2 Move `BrowserContentService` and `assertAllowedOrigin` from `browser-automation` into the new module.
- [x] 1.3 Move `BrowserTaskRunner`, `BrowserBlockDetector`, and `BrowserDiagnosticsStore` into the new module.
- [x] 1.4 Register `BrowserTaskRunner` and `BrowserDiagnosticsStore` factories in `BrowserContentModule` using existing browser configuration values.
- [x] 1.5 Import `BrowserAgentCaptureModule` and `SitesConfigModule` from `BrowserContentModule`.
- [x] 1.6 Export `BrowserContentService` from `BrowserContentModule`.

## 2. Browser Automation Wiring

- [x] 2.1 Import `BrowserContentModule` from `BrowserAutomationModule`.
- [x] 2.2 Remove direct `BrowserContentService`, `BrowserTaskRunner`, `BrowserBlockDetector`, and `BrowserDiagnosticsStore` provider registration from `BrowserAutomationModule`.
- [x] 2.3 Keep `BrowserAutomationController` in `browser-automation` and preserve `/api/browser/*` routes.
- [x] 2.4 Keep `BrowserAutomationModule` exports compatible for existing backend consumers of `BrowserContentService`, `BrowserAuthModule`, and `SitesConfigModule`.
- [x] 2.5 Leave `BrowserAuthStateStore` and browser extension auth bundle helpers in `browser-automation` for a separate follow-up change.

## 3. Imports and Contracts

- [x] 3.1 Update imports for moved browser content files and tests.
- [x] 3.2 Keep browser content request/result/error behavior unchanged.
- [x] 3.3 Avoid broad type extraction from `browser-automation.types.ts` unless a small compatibility re-export is necessary.
- [x] 3.4 Confirm `BrowserAgentCaptureModule` still consumes the same capture request/result/error contracts.

## 4. Tests

- [x] 4.1 Move or update `browser-content.service.spec.ts` under the new browser content module.
- [x] 4.2 Move or update `browser-task-runner.spec.ts`, `browser-block-detector.spec.ts`, and `browser-diagnostics.store.spec.ts`.
- [x] 4.3 Add or update `BrowserContentModule` wiring coverage.
- [x] 4.4 Update `BrowserAutomationModule` tests to confirm it compiles through `BrowserContentModule`.
- [x] 4.5 Confirm content snapshot mapping, site resolution, origin allowlist enforcement, auth usage mapping, task timeout, block detection, diagnostics persistence, and public route behavior remain unchanged.

## 5. Verification

- [x] 5.1 Run `openspec validate apps-backend-browser-content-module --type change --strict`.
- [x] 5.2 Run focused backend tests for browser content, browser automation module wiring, and browser automation controller.
- [x] 5.3 Run backend build.
- [x] 5.4 Run `git diff --check`.
