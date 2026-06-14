## 1. Browser Agent Capture Module

- [x] 1.1 Create `apps/backend/src/modules/browser-agent-capture` with `BrowserAgentCaptureModule`.
- [x] 1.2 Move `AgentBrowserCaptureProvider` out of `browser-automation` into the new module.
- [x] 1.3 Register and export the existing `BROWSER_CAPTURE_PROVIDER` binding from `BrowserAgentCaptureModule`.
- [x] 1.4 Import `AgentCommandGatewayModule` and `BrowserAuthModule` from `BrowserAgentCaptureModule`.

## 2. Browser Automation Wiring

- [x] 2.1 Import `BrowserAgentCaptureModule` from `BrowserAutomationModule`.
- [x] 2.2 Remove direct `AgentBrowserCaptureProvider` provider registration from `BrowserAutomationModule`.
- [x] 2.3 Keep `BrowserContentService` injection through `BROWSER_CAPTURE_PROVIDER` unchanged.
- [x] 2.4 Preserve `/api/browser/*` routes and response shapes.

## 3. Tests

- [x] 3.1 Move or update `agent-browser-capture.provider.spec.ts` under the new module.
- [x] 3.2 Add or update `BrowserAgentCaptureModule` wiring coverage.
- [x] 3.3 Update `BrowserAutomationModule` tests to confirm it compiles through `BrowserAgentCaptureModule`.
- [x] 3.4 Confirm agent selection, command payload mapping, success response mapping, auth error mapping, pending auth updates, and non-auth error behavior.

## 4. Verification

- [x] 4.1 Run `openspec validate apps-backend-browser-agent-capture-module --type change --strict`.
- [x] 4.2 Run focused backend tests for browser agent capture, browser content service, and browser automation module wiring.
- [x] 4.3 Run backend typecheck or build.
- [x] 4.4 Run `git diff --check`.
