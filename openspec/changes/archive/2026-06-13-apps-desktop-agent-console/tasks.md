## 1. Shared Protocol

- [x] 1.1 Define agent message, capability, platform, and public status types or schemas reusable by backend and desktop code.
- [x] 1.2 Add validation helpers for `agent.hello` and heartbeat messages.
- [x] 1.3 Add unit tests for valid registration, invalid registration, heartbeat, empty capabilities, and unknown future capabilities.

## 2. Backend Agent Registry

- [x] 2.1 Add backend dependencies needed for WebSocket agent connections.
- [x] 2.2 Create an agent registry module that stores online agent status, active connection ids, connected timestamps, and last seen timestamps.
- [x] 2.3 Implement duplicate agent id handling so the newest connection becomes authoritative.
- [x] 2.4 Implement heartbeat freshness updates and stale-agent cleanup.
- [x] 2.5 Add structured logging for connect, register, heartbeat, reconnect, invalid payload, and disconnect events without logging raw payload bodies.
- [x] 2.6 Add unit tests for registry registration, replacement, disconnect, heartbeat, stale cleanup, and safe status serialization.

## 3. Backend API and WebSocket Gateway

- [x] 3.1 Add the agent WebSocket endpoint for desktop connections.
- [x] 3.2 Implement `agent.hello`, acknowledgement, heartbeat handling, invalid message rejection, and socket close handling.
- [x] 3.3 Add `GET /api/agents` returning public online agent status without socket internals.
- [x] 3.4 Wire the agent registry module into `AppModule`.
- [x] 3.5 Add integration tests covering successful WebSocket registration, invalid registration rejection, disconnect behavior, and the connected agents API.

## 4. Desktop App Scaffold

- [x] 4.1 Create `apps/desktop` as an Electron workspace package discovered by the root `apps/*` pattern.
- [x] 4.2 Add development, build, typecheck, and test scripts for the desktop package.
- [x] 4.3 Configure Electron main, preload, and renderer entry points with TypeScript.
- [x] 4.4 Add unsigned development build configuration for Windows and macOS without production signing requirements.
- [x] 4.5 Add a focused smoke test or static verification proving the desktop package scripts and entry points are wired correctly.

## 5. Desktop Agent Connection

- [x] 5.1 Implement local desktop configuration for backend URL, stable agent id, display name, and connection enabled state.
- [x] 5.2 Implement the Electron main-process WebSocket client that connects to the backend agent endpoint.
- [x] 5.3 Send `agent.hello` after connection with agent id, display name, platform, app version, and empty capabilities.
- [x] 5.4 Send heartbeat messages on an interval while connected.
- [x] 5.5 Implement disconnected, reconnecting, connected, and error states with backoff reconnection.
- [x] 5.6 Add desktop unit tests for configuration defaults, persisted identity, registration payload construction, heartbeat scheduling, and reconnect state transitions.

## 6. Desktop Management Home Page

- [x] 6.1 Build a management home page showing backend URL, connection state, local agent id, display name, and last connection error.
- [x] 6.2 Add controls for editing backend URL and display name without changing the stable agent id.
- [x] 6.3 Fetch and display connected agents from `GET /api/agents` with id, display name, platform, version, capabilities, state, and last seen time.
- [x] 6.4 Show a recoverable error state when the agent list fetch fails.
- [x] 6.5 Keep browser controls, Douban login controls, host-task controls, and business-data management out of the first UI.
- [x] 6.6 Add renderer tests for connection settings, local state display, agent list rendering, and failed agent list loading.

## 7. Documentation and Verification

- [x] 7.1 Document how to run backend and desktop together in development.
- [x] 7.2 Document first-version limitations and the planned future browser-worker capability boundary.
- [x] 7.3 Run backend tests for the agent registry and WebSocket gateway.
- [x] 7.4 Run desktop package typecheck, tests, and build.
- [x] 7.5 Run OpenSpec validation for `apps-desktop-agent-console`.
