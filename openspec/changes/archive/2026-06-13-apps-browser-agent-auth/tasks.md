## 1. Shared Protocol

- [x] 1.1 Add browser capability, browser command, browser response, and browser error message schemas to `packages/agent-protocol`.
- [x] 1.2 Add protocol parsing and serialization tests for `browser.capturePage`, `browser.verifyProfile`, `browser.openLogin`, and `browser.clearProfile`.
- [x] 1.3 Update desktop agent hello payload construction to advertise browser capability only when the desktop browser host is ready.

## 2. Backend Browser Orchestration

- [x] 2.1 Replace request-level allowed origin/auth profile resolution with backend-owned browser site configuration.
- [x] 2.2 Implement required/anonymous auth policy resolution and reject unknown or disallowed origins before agent dispatch.
- [x] 2.3 Implement public browser profile summary storage keyed by agent id, site id, and profile name.
- [x] 2.4 Implement pending auth task creation, coalescing, status updates, and read APIs.
- [x] 2.5 Implement `AgentBrowserProvider` that selects an online browser-capable desktop agent and dispatches correlated browser commands over WebSocket.
- [x] 2.6 Remove `LocalPlaywrightProvider` and backend-local auth bundle storage from the supported provider wiring.
- [x] 2.7 Update `BrowserContentService` results and errors for agent metadata, `SITE_NOT_CONFIGURED`, `AGENT_NOT_AVAILABLE`, `AUTH_PROFILE_REQUIRED`, and expired profile reports.
- [x] 2.8 Keep diagnostics support while ensuring diagnostics never include cookies, localStorage, storage-state contents, or desktop profile paths.

## 3. Desktop Browser Host

- [x] 3.1 Add a desktop `PlaywrightHost` that executes controlled browser commands and rejects arbitrary script payloads.
- [x] 3.2 Add a local `BrowserProfileStore` under Electron app data for persistent profile directories and non-sensitive profile metadata.
- [x] 3.3 Implement anonymous capture with temporary isolated contexts.
- [x] 3.4 Implement required-auth capture with verified persistent profiles and structured missing/expired profile errors.
- [x] 3.5 Implement login opening, profile verification, public profile summary reporting, and profile clearing.
- [x] 3.6 Implement desktop-side timeout, concurrency, resource blocking, and payload size controls for browser commands.
- [x] 3.7 Mark profiles expired on login-required runtime failures and stop using expired profiles for required tasks.

## 4. Desktop UI

- [x] 4.1 Add browser sites/profile status view populated from backend site config and local profile metadata.
- [x] 4.2 Add pending auth task UI that merges local preflight, backend-requested, and runtime-failure tasks.
- [x] 4.3 Add login, verify, re-login, and clear-and-relogin actions for required site profiles.
- [x] 4.4 Report profile summary and pending task status changes back to backend after verification or expiry.

## 5. CLI and Documentation

- [x] 5.1 Remove or deprecate CLI login/auth-bundle commands so they do not open login browsers or create/upload storage-state bundles.
- [x] 5.2 Add or update CLI status commands that read backend browser sites, profile summaries, and pending auth tasks without accessing local browser storage.
- [x] 5.3 Update user documentation to describe CthuDesktop as the only login surface and backend as the browser orchestration surface.

## 6. Verification

- [x] 6.1 Add backend unit tests for site config resolution, agent dispatch selection, pending auth task coalescing, profile summaries, and removed local provider behavior.
- [x] 6.2 Add protocol tests for browser command request/response parsing.
- [x] 6.3 Add desktop unit tests for profile store state transitions, pending task creation, and browser command validation.
- [x] 6.4 Add CLI tests proving legacy login commands are unavailable or deprecated and JSON status output remains parseable.
- [x] 6.5 Run `openspec validate --change apps-browser-agent-auth --strict`.
- [x] 6.6 Run focused backend, desktop, protocol, and CLI tests touched by this change.

## 7. State Sync Refinement

- [x] 7.1 Publish a non-sensitive desktop browser state snapshot to backend when the desktop agent connects or reconnects.
- [x] 7.2 Automatically verify a required profile when the user closes its headed login browser window.
