## Context

Backend browser automation has grown into two different layers:

- Agent infrastructure: connected agent state, browser state snapshot handling, pending-auth projections, browser command dispatch, command correlation, timeout/error handling.
- Browser use cases: content capture, login/auth workflows, block detection, diagnostics, and site-aware auth decisions.

Those layers currently live together under `BrowserAutomationModule`. That made sense when browser automation was the only agent capability, but it will not scale if desktop agents later report more state or execute more non-browser commands. The site configuration split is the first boundary extraction; this change handles the next boundary by making agent state and command dispatch capability-neutral.

## Goals / Non-Goals

**Goals:**

- Establish `AgentStateModule` as the owner of public state projections reported by desktop agents.
- Establish `AgentCommandGatewayModule` as the owner of backend-to-agent command dispatch, response correlation, timeout handling, and capability-based selection.
- Establish `BrowserAuthModule` as the owner of browser login workflows, auth status interpretation, and pending-auth task coordination.
- Keep `BrowserContentService` focused on page content capture orchestration: site config, origin checks, task controls, capture provider calls, detection, and diagnostics.
- Keep desktop as the source of truth for real browser login state; backend stores only public projections and workflow intent.
- Preserve current public API shapes and protocol compatibility while changing internal module ownership.

**Non-Goals:**

- Do not redesign the WebSocket protocol names in this change.
- Do not move cookie, localStorage, storage-state, or profile directory data into backend.
- Do not add persistent storage for agent state or pending auth tasks.
- Do not implement new non-browser agent capabilities yet.
- Do not rename public `/api/browser/*` routes yet.
- Do not change site configuration ownership; this change assumes `SitesConfigModule` is available.

## Decisions

### Decision: Split into agent infrastructure and browser use-case layers

Agent infrastructure owns generic connected-agent concerns. Browser modules consume those generic services through browser-facing providers/adapters.

Target dependency direction:

```text
BrowserContentModule
  -> SitesConfigModule
  -> BrowserCaptureProvider

BrowserAuthModule
  -> SitesConfigModule
  -> BrowserAuthProvider
  -> AgentStateModule

AgentBrowserCaptureProvider
  -> AgentCommandGatewayModule
  -> AgentStateModule when agent/profile preflight is needed

AgentBrowserAuthProvider
  -> AgentCommandGatewayModule
  -> AgentStateModule

AgentCommandGatewayModule
  -> AgentRegistryModule
  -> AgentWebSocketServer

AgentStateModule
  -> AgentWebSocketServer snapshot events
```

Alternative considered: keep `BrowserAgentBridgeModule`. That still frames WebSocket command dispatch as a browser concern, which would make future non-browser agent commands repeat the same infrastructure.

### Decision: Treat browser state as an agent state slice

Browser profile summaries and pending auth tasks are public state reported by a desktop agent. They belong in an agent state projection with a browser-specific slice, not in a browser profile ownership module.

Desktop remains the source of truth for actual browser login state. Backend state is a projection used for UI, CLI, orchestration, and pending workflow visibility.

Alternative considered: create `BrowserProfilesModule`. That name suggests backend owns browser profiles, which is misleading because real profile directories and auth storage are desktop-owned.

### Decision: Keep login as browser auth workflow, not agent state

`AgentStateModule` stores public facts such as profile status and pending auth tasks. `BrowserAuthModule` owns login semantics: which site requires auth, which profile name to use, which login and verify URLs apply, how to present pending auth, and how to interpret missing/expired/blocked auth.

Alternative considered: put login inside `AgentStateModule`. That would mix state storage with browser-specific workflow decisions and make the agent layer less reusable.

### Decision: Introduce browser-facing ports for capture and auth

Browser use-case services should depend on browser-facing ports:

- `BrowserCaptureProvider` for page snapshots.
- `BrowserAuthProvider` for login and verification operations.

Agent-backed implementations adapt those ports to `AgentCommandGatewayModule`.

Alternative considered: let `BrowserContentService` call `AgentCommandGateway` and `AgentStateService` directly. That would reintroduce agent selection and state preflight into the browser content use case.

### Decision: Preserve API and protocol compatibility first

The internal ownership changes should not force desktop, CLI, or UI clients to update routes or payload shapes in the same change. Existing WebSocket messages can be routed to new modules behind the same message names.

Alternative considered: rename routes and messages together with modules. That would increase blast radius without changing the fundamental boundary.

## Risks / Trade-offs

- Module extraction may create circular imports -> keep ports in browser modules and implementations in adapter modules that depend downward on agent infrastructure.
- Names can become abstract too early -> keep module responsibilities narrow and testable: state projection, command gateway, browser auth, browser content.
- Preserving route/protocol names may hide new ownership -> document ownership in specs and tests while leaving wire compatibility stable.
- Pending auth tasks span browser auth and agent state -> make state storage live in agent state and workflow interpretation live in browser auth.
- Existing tests may be tightly coupled to old service names -> migrate tests by behavior first, then update imports.

## Migration Plan

1. Add `AgentStateModule` and move browser profile / pending-auth projection storage into a browser state slice.
2. Move browser state snapshot listener ownership from browser automation into agent state while keeping current WebSocket message names.
3. Add `AgentCommandGatewayModule` around existing `AgentWebSocketServer.sendBrowserCommand` behavior, then route browser command dispatch through the gateway.
4. Rename or wrap `BrowserProvider` as `BrowserCaptureProvider`, and rename the agent-backed implementation to `AgentBrowserCaptureProvider`.
5. Add `BrowserAuthModule` around login status, pending-auth workflow, and future login/verify commands.
6. Update `BrowserContentService` to consume sites config and browser capture/auth ports without direct agent registry, WebSocket, profile registry, or pending task dependencies.
7. Preserve existing HTTP route shapes and CLI/Desktop behavior.
8. Run focused agent registry, agent state, command gateway, browser auth, browser automation, and desktop protocol tests.

Rollback can restore the old providers inside `BrowserAutomationModule` because this change should not alter persistent data or external protocol formats.

## Open Questions

- Should pending auth task APIs remain under `/api/browser/pending-auth-tasks`, or should a later change expose a neutral agent workflow endpoint in parallel?
- Should command dispatch support only request/response commands at first, or also long-running command progress events?
- Should agent state projections expire automatically when an agent disconnects, or should they remain visible with an offline status?
