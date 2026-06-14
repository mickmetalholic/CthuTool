## Why

Backend browser automation currently owns agent-facing state projection, pending auth tasks, and browser command dispatch even though those concerns are fundamentally about connected agents. With site configuration moving into `SitesConfigModule`, the next split should make agent infrastructure capability-neutral and leave browser modules focused on browser use cases.

## What Changes

- Add an `AgentStateModule` that owns public agent state projections, including browser profile and pending-auth state as a browser state slice.
- Add an `AgentCommandGatewayModule` that owns capability-based agent selection, command dispatch, command correlation, timeout handling, and agent protocol error mapping.
- Add a `BrowserAuthModule` that owns browser login workflows, auth status interpretation, login task APIs, and auth provider ports while keeping desktop as the source of truth for real browser login state.
- Refactor browser content capture around a browser-facing capture provider port; `BrowserContentService` uses site config and a capture provider, while the agent-backed provider uses the agent command gateway and agent state.
- Move browser state snapshot handling out of browser automation services and into agent state projection, while preserving existing WebSocket message names and public API response shapes.
- Keep existing desktop protocol messages, `/api/browser/*` routes, CLI status behavior, and sensitive-auth-data boundaries compatible.
- Defer broad route renames, protocol redesigns, persistent state storage, and any non-browser agent capability implementation.

## Capabilities

### New Capabilities
- `apps-backend-agent-state`: Capability-neutral backend projection of public state reported by connected desktop agents.
- `apps-backend-agent-command-gateway`: Capability-neutral backend command dispatch and response correlation for desktop agents.
- `apps-backend-browser-auth`: Browser login workflow, public auth status, and pending-auth task coordination built on agent state and commands.

### Modified Capabilities
- `apps-backend-agent-registry`: Agent registry delegates state projection and command dispatch to agent-specific modules instead of owning browser-specific handlers.
- `apps-backend-browser-automation`: Browser automation becomes a browser content use-case layer that consumes sites config, browser auth, and agent-backed capture ports instead of owning agent state and command gateway behavior.

## Impact

- Affected code: `apps/backend/src/modules/agent-registry`, `apps/backend/src/modules/browser-automation`, new agent state / agent command gateway / browser auth module directories, and focused backend tests.
- Affected APIs: public HTTP route paths and response shapes remain compatible; internal module imports and service names change.
- Affected protocol: existing desktop WebSocket message names can remain compatible, but backend ownership of handlers moves to agent state and command gateway services.
- Dependency: this change assumes the site configuration split exists or is applied first so browser use cases consume `SitesConfigService` rather than owning site configuration.
