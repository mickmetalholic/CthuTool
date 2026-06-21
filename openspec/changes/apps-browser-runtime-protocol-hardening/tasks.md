## 1. Protocol Boundaries

- [ ] 1.1 Update `@cthutool/agent-protocol` so command traffic uses JSON-RPC 2.0-compatible request, success response, and error response schemas.
- [ ] 1.2 Normalize `agent.*` lifecycle message types in `@cthutool/agent-protocol` as exported constants, a closed literal union, and discriminated union schemas.
- [ ] 1.3 Remove browser method, result, profile, auth task, detection, and challenge exports from `@cthutool/agent-protocol`.
- [ ] 1.4 Create `@cthutool/browser-runtime-protocol` with browser method names, params, results, public status metadata, detections, application error codes, and operation-scoped challenge schemas.
- [ ] 1.5 Add browser runtime protocol helpers for building typed JSON-RPC browser requests and parsing typed browser results/errors.
- [ ] 1.6 Update package manifests, workspace references, exports, and protocol tests for the agent/browser protocol split.

## 2. Backend Agent Transport

- [ ] 2.1 Update the backend agent WebSocket server to parse lifecycle messages through normalized `@cthutool/agent-protocol` schemas and accept them separately from JSON-RPC command responses.
- [ ] 2.2 Update `AgentCommandGateway` to dispatch commands by JSON-RPC id, method, params, timeout, and selected agent connection.
- [ ] 2.3 Ensure `AgentCommandGateway` resolves JSON-RPC success responses and structured JSON-RPC errors without importing browser runtime protocol code.
- [ ] 2.4 Remove handling of browser-specific state snapshot or capability messages from backend agent registry/WebSocket storage.
- [ ] 2.5 Replace ad hoc backend `agent.*` string comparisons with imported lifecycle type constants or schema guards.
- [ ] 2.6 Update agent registry tests to prove unknown lifecycle types are rejected, browser capabilities remain metadata only, and browser state is not stored in registry state.

## 3. Backend Browser Runtime And Service

- [ ] 3.1 Update `DesktopBrowserRuntimeModule` and service code to build browser JSON-RPC requests through `@cthutool/browser-runtime-protocol`.
- [ ] 3.2 Map browser JSON-RPC errors into runtime errors or operation-scoped interaction challenges in the desktop browser runtime service.
- [ ] 3.3 Add `BrowserModule` as the backend browser aggregate module and export `BrowserService` as its public facade.
- [ ] 3.4 Move site config resolution, allowed-origin checks, auth/profile option resolution, content capture, screenshot capture, block detection, diagnostics, auth status, login, and verification workflows behind `BrowserService`.
- [ ] 3.5 Update `BrowserAuthModule` behavior to be internal to `BrowserService` or replaced by `BrowserService` methods that query desktop runtime status on demand instead of reading agent state projections.
- [ ] 3.6 Update `BrowserContentModule` behavior to be internal to `BrowserService` or replaced by `BrowserService` methods that surface auth-required outcomes as detections/challenges without creating pending tasks.
- [ ] 3.7 Remove backend compatibility APIs and handlers for `/api/browser/profiles` and `/api/browser/pending-auth-tasks`.
- [ ] 3.8 Update backend Douban movie info paths to use `BrowserService` and propagate browser runtime challenges to desktop-facing responses.
- [ ] 3.9 Prevent backend business modules from depending directly on `BrowserContentService`, `BrowserAuthService`, `DesktopBrowserRuntimeService`, agent gateway, or browser protocol packages for normal browser workflows.
- [ ] 3.10 Delete `BrowserSitesModule` and the `/api/browser/sites` compatibility route.

## 4. Desktop Agent And Browser Host

- [ ] 4.1 Update desktop agent client lifecycle handling to use normalized `agent.*` constants and discriminated union schemas.
- [ ] 4.2 Update desktop agent client command handling to receive JSON-RPC requests and return correlated JSON-RPC success/error responses.
- [ ] 4.3 Update the desktop browser host dispatcher to route browser runtime methods from `@cthutool/browser-runtime-protocol`.
- [ ] 4.4 Remove desktop `browser.stateSnapshot` publishing after registration, reconnect, profile changes, and pending auth changes.
- [ ] 4.5 Remove desktop pending-auth task store mutations from profile preflight, runtime failures, login verification, and Douban verifier paths.
- [ ] 4.6 Return missing login, expired login, verification failure, captcha, blocked, and rate-limit cases as browser runtime challenges or detections.
- [ ] 4.7 Keep raw cookies, storage state, localStorage, raw HTML, screenshots, and profile paths out of browser status and challenge payloads.

## 5. Desktop Renderer And Task Center

- [ ] 5.1 Remove renderer preload/backend calls that fetch or aggregate browser pending-auth tasks.
- [ ] 5.2 Remove `browser-auth` task-center rows, grouping, pending counts, and task actions from the desktop task center.
- [ ] 5.3 Remove desktop renderer calls to `/api/browser/sites` and replace them with browser facade/status data needed by the active workflow.
- [ ] 5.4 Update browser profile/status UI to show explicit runtime status and operation-scoped challenges where browser login action is still needed.
- [ ] 5.5 Update Douban movie lookup UI to display browser runtime challenges and invoke browser runtime actions without reading task-center pending auth state.
- [ ] 5.6 Ensure user-driven login remains explicit and no browser window opens automatically when a challenge is shown.

## 6. Backend Browser Automation Directory Removal

- [ ] 6.1 Move surviving backend browser errors into `apps/backend/src/modules/browser/shared`.
- [ ] 6.2 Move content request/result/detection/diagnostic types into `apps/backend/src/modules/browser` service, content, or shared module paths.
- [ ] 6.3 Move auth bundle helpers and auth state stores into `BrowserService` internals, browser auth helper paths, or browser shared module paths.
- [ ] 6.4 Delete `apps/backend/src/modules/browser-automation/`.
- [ ] 6.5 Delete the standalone `apps/backend/src/modules/browser/sites/` module boundary if it only delegates to `SitesConfigService`.
- [ ] 6.6 Remove all `browser-automation` and obsolete browser-sites imports and update backend module registration to use browser-owned modules or `SitesConfigModule` directly.

## 7. Validation

- [ ] 7.1 Run protocol package tests for `@cthutool/agent-protocol` and `@cthutool/browser-runtime-protocol`.
- [ ] 7.2 Run focused backend tests covering agent gateway, registry, desktop browser runtime, BrowserService, sites config, browser auth/content internals, and Douban movie info.
- [ ] 7.3 Run focused desktop tests or typecheck covering agent client, browser host, profile/status UI, task center, and Douban lookup.
- [ ] 7.4 Run targeted Biome checks for modified backend, desktop, and protocol package files.
- [ ] 7.5 Run `openspec validate apps-browser-runtime-protocol-hardening --strict`.
