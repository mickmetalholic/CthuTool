## 1. Agent State Module

- [x] 1.1 Create `AgentStateModule` with public agent state projection services and types.
- [x] 1.2 Move browser profile summary storage into an agent browser state slice.
- [x] 1.3 Move pending browser auth task storage into the same agent browser state slice while preserving public task shape.
- [x] 1.4 Move browser state snapshot listener/projection ownership from browser automation into agent state.
- [x] 1.5 Keep existing `browser.stateSnapshot` WebSocket message compatibility while routing the handler to `AgentStateModule`.
- [x] 1.6 Add tests for replacement snapshots, empty snapshots, stale connection snapshots, malformed snapshots, and sensitive field exclusion.

## 2. Agent Command Gateway

- [x] 2.1 Create `AgentCommandGatewayModule` with command dispatch, command correlation, timeout, and structured error handling.
- [x] 2.2 Wrap existing agent WebSocket command send behavior behind `AgentCommandGateway`.
- [x] 2.3 Add capability-based online agent selection without putting business command logic in `AgentRegistryService`.
- [x] 2.4 Update browser command dispatch to use the gateway instead of directly using `AgentWebSocketServer`.
- [x] 2.5 Add tests for successful command response, command error, timeout, missing capability, offline agent, and reconnect behavior.

## 3. Browser Capture Boundary

- [x] 3.1 Rename or wrap `BrowserProvider` as a browser capture provider port.
- [x] 3.2 Rename or wrap `AgentBrowserProvider` as an agent-backed browser capture provider implementation.
- [x] 3.3 Ensure `BrowserContentService` depends on sites config and browser capture provider ports, not agent registry, raw WebSocket server, or agent state storage internals.
- [x] 3.4 Preserve existing content result shape, diagnostics behavior, block detection behavior, and origin allowlist behavior.
- [x] 3.5 Update browser content tests for the new provider naming and dependency graph.

## 4. Browser Auth Boundary

- [x] 4.1 Create `BrowserAuthModule` with browser auth status and workflow services.
- [x] 4.2 Move browser auth status interpretation out of generic agent state and into browser auth services.
- [x] 4.3 Keep desktop as the source of truth for real login state; backend stores only public projections and workflow intent.
- [x] 4.4 Route required-auth missing/expired handling through browser auth services while preserving existing pending-auth API response shape.
- [x] 4.5 Add provider ports for future desktop login and profile verification commands through `AgentCommandGateway`.
- [x] 4.6 Add tests for missing auth, expired auth, verified profile resolution, duplicate pending task coalescing, and sensitive auth data exclusion.

## 5. Module Wiring and Compatibility

- [x] 5.1 Update `BrowserAutomationModule` to import agent state, agent command gateway, browser auth, browser content, and sites config modules with no circular dependency.
- [x] 5.2 Keep public `/api/browser/sites`, `/api/browser/profiles`, and `/api/browser/pending-auth-tasks` route paths and response shapes compatible.
- [x] 5.3 Keep desktop WebSocket message names compatible unless a later protocol change explicitly renames them.
- [x] 5.4 Update backend module compile tests for the new module graph.
- [x] 5.5 Update CLI/Desktop-facing tests that read browser sites, profiles, or pending auth tasks if their imports or fixtures depend on old service names.

## 6. Verification

- [x] 6.1 Run `openspec validate apps-backend-agent-browser-layer-split --type change --strict`.
- [x] 6.2 Run focused backend tests for agent registry, agent state, agent command gateway, browser auth, and browser automation.
- [x] 6.3 Run focused desktop protocol/browser host tests if WebSocket payload fixtures are touched. No desktop/protocol payload fixtures were touched.
- [x] 6.4 Run backend typecheck or build.
- [x] 6.5 Run `git diff --check`.
