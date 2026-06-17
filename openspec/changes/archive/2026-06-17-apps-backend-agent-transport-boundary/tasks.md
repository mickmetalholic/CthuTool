## 1. Agent Transport Boundary

- [x] 1.1 Move agent registry, WebSocket, command gateway, and shared agent types under `apps/backend/src/modules/agent/`.
- [x] 1.2 Refactor agent WebSocket handling so it accepts registration, heartbeat, disconnect, stale pruning, and generic command response routing only.
- [x] 1.3 Remove browser state snapshot routing, browser profile projection hooks, and browser-specific pending command storage from agent registry/WebSocket code.
- [x] 1.4 Replace browser-specific gateway methods with a generic typed command dispatch API.
- [x] 1.5 Update agent registry and command gateway unit tests for generic command correlation, timeout, disconnect, and capability-neutral behavior.

## 2. Desktop Browser Runtime

- [x] 2.1 Create `apps/backend/src/modules/browser/desktop-runtime/` with module, service, types, and provider tokens as needed.
- [x] 2.2 Move browser command mapping from the agent-named capture/auth providers into desktop browser runtime operations.
- [x] 2.3 Add runtime operations for capture, open login, verify profile, profile/status lookup, and runtime diagnostics/status lookup.
- [x] 2.4 Map runtime auth-required outcomes to operation-scoped interaction challenges without creating backend pending auth tasks.
- [x] 2.5 Add desktop browser runtime tests for command dispatch, result mapping, error mapping, and challenge shaping.

## 3. Browser Module Organization

- [x] 3.1 Move browser content code under `apps/backend/src/modules/browser/content/`.
- [x] 3.2 Move browser auth code under `apps/backend/src/modules/browser/auth/`.
- [x] 3.3 Move browser-facing site config routes and services under `apps/backend/src/modules/browser/sites/` or wire them from that module boundary.
- [x] 3.4 Remove `BrowserAutomationModule` as a standalone domain/composition module and update `AppModule` imports.
- [x] 3.5 Remove `BrowserAgentCaptureModule` and replace its consumers with desktop browser runtime.

## 4. Browser Auth and Content Behavior

- [x] 4.1 Refactor browser auth to query desktop browser runtime on demand instead of reading agent state projection.
- [x] 4.2 Remove backend profile registry and pending auth task stores from browser auth/agent state.
- [x] 4.3 Replace profile and pending-auth task APIs with explicit status/challenge/runtime APIs or compatibility responses selected during implementation.
- [x] 4.4 Refactor browser content to use desktop browser runtime for capture execution.
- [x] 4.5 Ensure browser content reports login-required detection and challenge metadata without mutating agent-owned state.

## 5. Consumers and Protocol Compatibility

- [x] 5.1 Update backend imports and tests after module path reorganization.
- [x] 5.2 Update desktop/renderer API clients that call browser profiles or pending-auth-task endpoints.
- [x] 5.3 Update shared agent protocol types so agent transport stays generic while browser command/result types remain available to browser runtime callers.
- [x] 5.4 Update Douban movie info backend usage to consume browser content through the new module paths without depending on agent modules.

## 6. Verification

- [x] 6.1 Run focused backend unit tests for agent, desktop browser runtime, browser auth, browser content, and sites modules.
- [x] 6.2 Run affected desktop renderer/unit tests for browser auth/status UI API changes.
- [x] 6.3 Run `pnpm -C apps/backend build`.
- [x] 6.4 Run `openspec validate apps-backend-agent-transport-boundary --type change --strict`.
- [x] 6.5 Run `openspec validate --specs --strict --no-interactive`.
