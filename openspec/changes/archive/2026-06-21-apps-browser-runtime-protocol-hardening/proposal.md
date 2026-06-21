## Why

The previous agent/browser split moved browser business logic out of backend agent modules, but the wire protocol, desktop state flow, renderer task model, and backend shared browser types still preserve old coupling points. This change makes the boundary explicit and breaking: agent transport becomes JSON-RPC-style command plumbing, browser runtime owns browser-specific protocol, and auth work is represented by operation-scoped challenges instead of persisted tasks or mirrored backend state.

## What Changes

- **BREAKING** Replace the current agent command wire messages with JSON-RPC-style request, response, and error envelopes that use a stable `id` for correlation.
- **BREAKING** Split browser command/result/challenge contracts out of the generic agent transport protocol boundary so agent transport does not expose browser-specific message types.
- **BREAKING** Remove `browser.stateSnapshot` and all backend/desktop state projection paths for browser profiles and pending auth tasks.
- **BREAKING** Remove backend compatibility APIs for `/api/browser/profiles` and `/api/browser/pending-auth-tasks`; browser status must be queried through explicit runtime/status APIs or returned from the active operation.
- **BREAKING** Remove desktop pending-auth task storage, renderer task aggregation, task-center browser-auth flows, and Playwright-host pending-task mutations.
- Represent missing login, expired login, verification failure, blocked access, and other required user action as operation-scoped browser runtime challenges.
- Introduce backend `BrowserService` as the single browser business facade that owns site policy, profile/auth policy, permission checks, content capture, screenshot capture, status, login, verification, detection, and diagnostics workflows over `DesktopBrowserRuntimeService`.
- Remove the thin `BrowserSitesModule` and the `/api/browser/sites` compatibility route; backend code should consume effective site configuration directly from `SitesConfigModule`.
- Refactor backend browser shared code so `apps/backend/src/modules/browser-automation/` is deleted and its remaining errors, types, auth helpers, and stores move under browser-owned module boundaries.
- Update backend browser content, browser auth, Douban movie info, desktop browser host, renderer APIs, and protocol tests to use `BrowserService`, the new protocol, and challenge contracts.

## Capabilities

### New Capabilities

- `packages-agent-protocol`: Defines the generic agent transport protocol, including registration, heartbeat, public agent status, and JSON-RPC-style command request/response/error envelopes.
- `packages-browser-runtime-protocol`: Defines browser runtime command payloads, results, public profile/status metadata, and operation-scoped interaction challenge contracts outside the generic agent transport package.
- `apps-backend-browser-service`: Defines the backend `BrowserService` facade that external backend business modules use for browser workflows while runtime, auth, content, detection, diagnostics, and site policy stay internal implementation details.

### Modified Capabilities

- `apps-backend-agent-command-gateway`: Replace typed command correlation with JSON-RPC-style command dispatch and errors while remaining capability-neutral.
- `apps-backend-agent-registry`: Remove capability-specific message handling from registry/WebSocket behavior and reject or ignore unsupported non-transport messages without mutating browser state.
- `apps-backend-desktop-browser-runtime`: Dispatch browser runtime operations through the JSON-RPC agent command envelope and map browser protocol outcomes to runtime results or challenges.
- `apps-backend-browser-auth`: Remove profile-list and pending-auth-task compatibility behavior; move auth workflow behavior behind `BrowserService` and expose auth status and user action needs through runtime status/challenge contracts only.
- `apps-backend-browser-content`: Move content workflow behavior behind `BrowserService`, returning or surfacing browser runtime challenges from content and screenshot operations without creating backend or desktop pending tasks.
- `apps-backend-browser-automation`: Retire the remaining `browser-automation` shared directory and move surviving shared browser code into browser-owned service, auth, content, desktop-runtime, or shared boundaries.
- `apps-backend-sites-config`: Keep ownership of effective browser site configuration while removing the thin browser sites listing route and `BrowserSitesModule`.
- `apps-desktop-browser-host`: Consume JSON-RPC-style browser runtime commands, stop publishing browser state snapshots, and remove pending-auth task creation from browser host execution.
- `apps-desktop-task-center`: Remove browser-auth task aggregation and task-center requirements that depend on backend or local pending auth task state.
- `apps-desktop-douban-movie-info`: Update Douban login/status presentation to use browser runtime challenges and public profile/status APIs instead of pending auth task summaries.

## Impact

- Affected packages: `packages/agent-protocol`, a new browser runtime protocol package or equivalent package boundary, and dependent package build/test configuration.
- Affected backend code: `apps/backend/src/modules/agent`, `apps/backend/src/modules/browser`, `apps/backend/src/modules/browser-automation`, `apps/backend/src/modules/douban-movie-info`, and `apps/backend/src/app.module.ts`.
- Affected desktop code: `apps/desktop/src/main/agent-client.ts`, Playwright host/auth/profile code, pending auth task store/preload APIs, renderer browser status APIs, task center UI logic, and Douban browser status display.
- Affected APIs and wire contracts: agent WebSocket command messages, browser runtime command/result/error payloads, browser profile/pending-task HTTP compatibility endpoints, and renderer browser status fetches.
- Validation should include protocol package tests, backend build/tests, desktop focused tests/typecheck, targeted Biome checks, and strict OpenSpec validation.
