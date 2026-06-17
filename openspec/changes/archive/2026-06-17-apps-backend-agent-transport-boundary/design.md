## Context

The backend agent layer was introduced to connect desktop clients to the backend. Browser work then grew on top of that connection, and several browser-specific concerns now sit in agent-owned modules: browser command correlation, browser state snapshots, profile summaries, pending auth tasks, and agent-named browser capture providers.

This change re-centers the backend architecture around two separate ideas:

- `agent` is the transport substrate for connected desktop clients.
- `browser` is a capability domain that can use that substrate through a typed command gateway.

The current backend module layout is also flat, which makes the boundary harder to see. The new layout should make ownership obvious from paths:

```text
apps/backend/src/modules/
  agent/
    registry/
    command-gateway/
    websocket/
    types/
  browser/
    desktop-runtime/
    auth/
    content/
    sites/
  douban-movie-info/
  health/
```

## Goals / Non-Goals

**Goals:**

- Keep agent modules limited to desktop client connection lifecycle, public client metadata, online state, capability advertisement, and generic typed command transport.
- Move browser capability access behind `browser/desktop-runtime`.
- Remove `browser-automation` as a standalone browser domain module.
- Move browser routes into owning browser modules.
- Query desktop browser profile/status data on demand instead of mirroring it into backend agent state.
- Represent required user action as operation-scoped interaction challenges rather than global pending auth tasks.
- Keep current browser content and Douban workflows possible through the new runtime boundary.

**Non-Goals:**

- Do not add a backend-local Playwright implementation.
- Do not build a task center or global product inbox.
- Do not store raw cookies, localStorage, storage-state contents, desktop profile paths, screenshots, or HTML outside the existing diagnostics rules.
- Do not redesign the desktop client implementation beyond the protocol and API changes needed for the backend boundary.
- Do not rename unrelated non-agent, non-browser backend features.

## Decisions

### Agent modules are transport-only

Agent-owned code will handle WebSocket lifecycle, `agent.hello`, heartbeat, disconnects, stale pruning, public agent status, and generic command request/response correlation. It will not inspect browser command names, browser payload fields, profile status, or pending auth tasks.

Alternative considered: keep a capability state projection hook in agent registry. This keeps browser status display easy, but it keeps the agent layer responsible for capability-specific lifecycle and stale-state semantics. The user explicitly prefers agent state to mean agent-owned state only.

### Commands are typed at the boundary but generic in agent code

The gateway should expose a generic command API such as `sendCommand<TCommand, TResult>()` or an equivalent typed envelope. Browser modules own the concrete command/result types. Agent modules only understand target agent selection, correlation id, timeout, and transport result delivery.

Alternative considered: expose browser-specific helpers such as `sendBrowserCommand`. This is simpler for current callers but guarantees future capability coupling.

### `desktop-browser-runtime` is the browser capability access layer

Backend browser services will use `browser/desktop-runtime` for browser execution. That module hides the agent command gateway and exposes browser capability operations such as capture, login, verification, profile/status lookup, and diagnostics/status lookup.

The module is not a Playwright wrapper in backend code. Playwright remains a desktop-side implementation detail. Backend code depends on capability contracts, not browser driver APIs.

### Browser profile state is queried on demand

Backend should not mirror desktop browser profiles into agent state. Profile/status reads should call the desktop browser runtime when a workflow needs them. Capture/login/verify operations can return structured interaction challenges when user action is required.

Alternative considered: keep public browser state snapshots in memory. This improves cheap listing but introduces stale snapshot handling, reconnection authority questions, and product state inside the agent layer.

### Interaction challenges replace pending auth tasks

When an operation cannot proceed without user login or verification, the result should include an operation-scoped challenge. The caller can surface the challenge where the workflow is already happening.

Alternative considered: keep pending auth tasks. This was useful for a task-center style UI, but it creates global task state before the product shape is clear.

### Browser modules move under a browser area

`browser-auth`, `browser-content`, `browser-agent-capture`, `browser-automation`, and browser-facing `sites-config` should become browser-owned modules under `modules/browser/`. `browser-automation` is removed as a composition module; its routes move to `browser/auth`, `browser/content`, or `browser/sites`.

`sites-config` remains capability-neutral internally, but the browser-facing site API belongs with browser modules because it configures browser site policy.

## Risks / Trade-offs

- Current renderer or desktop consumers may call `/api/browser/profiles` or `/api/browser/pending-auth-tasks` directly -> provide explicit replacement endpoints or staged compatibility during implementation.
- On-demand profile queries can cost more than reading memory -> keep commands focused and cache only within a single operation if needed.
- Generic typed command transport can become too loose -> keep shared protocol schemas/types for each capability command at the capability boundary.
- Moving many files can obscure behavior changes -> make the implementation in phases and keep tests close to the moved modules.
- Removing browser state snapshots may leave old desktop messages unused -> update protocol handling so unsupported capability messages are rejected or ignored without affecting agent connection health.

## Migration Plan

1. Introduce the target module structure and generic agent command gateway while keeping behavior equivalent.
2. Add `browser/desktop-runtime` and move browser command mapping behind it.
3. Move browser content/auth/sites modules under `modules/browser/` and route controllers to owning modules.
4. Replace backend profile/pending-task reads with on-demand runtime queries and interaction challenges.
5. Remove obsolete browser snapshot handling, agent state projection, and `browser-automation` composition wiring.
6. Update backend, desktop renderer, and protocol tests around the new contracts.

Rollback is a source-level revert of this change before archive. If implementation is staged, keep compatibility endpoints until desktop/renderer callers are migrated.

## Open Questions

- Which exact replacement endpoints should the renderer use for current profile and pending-auth views?
- Should `apps-backend-agent-state` be archived as removed, or folded into `apps-backend-agent-registry` during spec archive?
- Should `sites-config` remain a top-level module internally while exposing browser routes from `browser/sites`, or move fully under `modules/browser/sites`?
