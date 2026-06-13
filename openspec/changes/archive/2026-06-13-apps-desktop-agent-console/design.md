## Context

CthuTool currently has backend and CLI applications, plus an internal browser automation module that can fetch page content through backend services. The next step is a desktop application that can run on a user's own Windows or macOS machine, connect to the backend, and become a visible registered agent. This change deliberately builds the registration and console foundation before adding browser or host-control tasks.

The repository already uses a root pnpm workspace with `apps/*`, so the desktop app can be introduced as `apps/desktop` without changing workspace layout. The backend is a Nest application on Express and does not currently expose an agent WebSocket gateway.

## Goals / Non-Goals

**Goals:**
- Add an Electron desktop app that runs on Windows and macOS during development.
- Let the desktop app store a backend URL and agent identity locally.
- Let the desktop app open a WebSocket connection to the backend, register with metadata, send heartbeats, and reconnect after interruptions.
- Let the backend maintain an online agent registry and expose it through an HTTP API.
- Provide a desktop management home page that displays connection state, local agent identity, and the backend's connected agent list.

**Non-Goals:**
- Do not control Chrome, Playwright, CDP, or host processes in this change.
- Do not implement backend task dispatch, agent-to-agent calls, browser snapshots, or Douban business logic.
- Do not add production code signing, notarization, auto-update, or installer publishing.
- Do not make the desktop renderer an owner of business data or business logic.

## Decisions

### Use one Electron app with a worker role and console UI

`apps/desktop` will contain Electron main-process code and renderer UI. The main process owns native lifecycle concerns and the backend WebSocket connection. The renderer is only a frontend management surface that reads state from the main process and backend APIs.

Alternative considered: a standalone Node host service plus web dashboard. That would be lighter, but the user prefers installing a desktop app over deploying a host Node service. Electron is a better fit for a self-contained long-running desktop companion.

### Make the backend the source of truth for connected agents

The backend will own `AgentRegistry` state and expose connected agents through `GET /api/agents`. Desktop instances will not directly discover or manage each other. A desktop app acting as a console will read backend APIs to see every connected agent.

Alternative considered: direct desktop-to-desktop calls. That would make routing, status, and auditing harder. Keeping all calls through backend preserves a clean control plane for future MCP and browser-worker flows.

### Start with a capability-neutral agent protocol

The first agent registration payload will include `agentId`, `deviceName`, `platform`, `version`, and `capabilities`. `capabilities` will be an empty array in the first version, but the contract will allow future entries such as `browser`.

Alternative considered: add the browser capability immediately. That would make the first change much larger and mix connection reliability with browser automation concerns. A neutral registration contract gives later changes a stable place to attach browser workers.

### Use WebSocket for agent registration and heartbeat

Desktop agents will initiate a persistent WebSocket connection to the backend. The connection starts with `agent.hello`, continues with periodic `agent.heartbeat`, and ends by disconnect or timeout. The backend marks an agent offline when the socket closes or heartbeat freshness expires.

Alternative considered: polling HTTP registration. Polling is simpler but less natural for future task dispatch. WebSocket is the right foundation for backend-to-agent tasks without requiring the desktop app to expose an inbound HTTP server.

### Prefer shared protocol schemas over ad hoc JSON

The implementation should define shared TypeScript types or validation schemas for agent messages and public agent status. These schemas should be reused by backend tests and desktop tests so protocol drift is caught early.

Alternative considered: duplicate message interfaces in each app. That is cheaper for a prototype but fragile once browser tasks are added.

### Keep signing out of the first implementation

The desktop app should support unsigned development builds. Self-signing or platform signing can be documented later, but certificates, notarization, and installer hardening are not required for the connection MVP.

Alternative considered: build signed installers immediately. That would slow down the first loop and does not help validate the backend registration architecture.

## Risks / Trade-offs

- WebSocket lifecycle bugs can make agents appear online after they are gone -> The backend should update registry state on socket close and heartbeat timeout, and tests should cover stale agents.
- Electron adds package weight and a new build pipeline -> Keep `apps/desktop` isolated with focused scripts and avoid introducing desktop dependencies into backend or CLI packages.
- The renderer may accidentally gain business logic -> Keep renderer calls limited to backend APIs and main-process connection state; business services stay in backend modules.
- Agent identity collisions can overwrite the wrong connection -> The backend should treat `agentId` as stable identity and track a connection id/session id for the active socket.
- First version has no useful host capability yet -> The UI should make this explicit by showing registered capabilities and treating an empty list as valid.

## Migration Plan

1. Add the desktop package and backend agent registry modules behind new routes.
2. Add local development scripts and documentation for running backend plus desktop together.
3. Keep existing backend browser automation and CLI auth flows unchanged.
4. If the change needs rollback, remove the desktop package and backend agent registry module without affecting existing browser automation APIs.

## Open Questions

- Should the desktop app default to connecting to `http://localhost:3000` or prompt for a backend URL on first launch?
- Should the first implementation use a dedicated shared package for agent protocol types, or keep schemas in backend and import them from desktop until the protocol grows?
