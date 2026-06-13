# apps-backend-agent-registry Specification

## Purpose
TBD - created by archiving change apps-desktop-agent-console. Update Purpose after archive.
## Requirements
### Requirement: Agent WebSocket endpoint
The backend SHALL expose a WebSocket endpoint that accepts desktop agent connections.

#### Scenario: Desktop agent connects
- **WHEN** a desktop agent opens a WebSocket connection to the agent endpoint
- **THEN** the backend accepts the socket and waits for an `agent.hello` registration message

#### Scenario: Invalid registration is rejected
- **WHEN** a socket sends an invalid registration message or omits required agent metadata
- **THEN** the backend closes the socket without registering the agent

#### Scenario: Registered agent is acknowledged
- **WHEN** a socket sends a valid `agent.hello` registration message
- **THEN** the backend records the agent as online and sends an acknowledgement containing the registered agent id and server time

### Requirement: Agent registry state
The backend SHALL maintain an in-memory registry of currently connected desktop agents.

#### Scenario: Agent status is recorded
- **WHEN** an agent registers successfully
- **THEN** the registry stores the agent id, connection id, display name, platform, version, capabilities, connected time, and last seen time

#### Scenario: Duplicate agent id reconnects
- **WHEN** a new connection registers with an agent id that is already online
- **THEN** the backend replaces the previous active connection for that agent id and marks the latest connection as authoritative

#### Scenario: Agent disconnects
- **WHEN** a registered agent socket closes
- **THEN** the backend removes or marks that connection offline so it no longer appears as an active agent

### Requirement: Agent heartbeat handling
The backend SHALL use heartbeat messages to keep agent freshness current and detect stale connections.

#### Scenario: Heartbeat updates freshness
- **WHEN** a registered agent sends a valid heartbeat message
- **THEN** the backend updates that agent's last seen time

#### Scenario: Stale agent is removed
- **WHEN** a registered agent does not heartbeat before the configured stale timeout
- **THEN** the backend marks that agent offline or removes it from the active agent list

### Requirement: Connected agents API
The backend SHALL expose an HTTP API for reading connected agent state.

#### Scenario: Online agents are listed
- **WHEN** a caller requests the connected agent list
- **THEN** the backend returns currently online agents with id, display name, platform, version, capabilities, connected time, last seen time, and connection state

#### Scenario: Raw socket internals are hidden
- **WHEN** the connected agent list is returned
- **THEN** it does not include WebSocket objects, raw headers, private connection tokens, or implementation-specific socket internals

### Requirement: Browser state snapshot WebSocket messages
The backend agent WebSocket server SHALL accept browser state snapshot messages from registered desktop agents and dispatch them without exposing raw WebSocket internals to browser automation services.

#### Scenario: Registered agent sends browser state snapshot
- **WHEN** a registered desktop agent sends a valid `browser.stateSnapshot` message over its active WebSocket connection
- **THEN** the backend dispatches the snapshot to the browser automation state projection handler with the registered agent id and snapshot payload

#### Scenario: Unregistered socket sends browser state snapshot
- **WHEN** a socket sends a `browser.stateSnapshot` message before successful `agent.hello` registration
- **THEN** the backend rejects or ignores the message without updating browser profile or pending-auth state

#### Scenario: Replaced connection sends stale snapshot
- **WHEN** an older connection for an agent id sends a `browser.stateSnapshot` after a newer connection has become authoritative
- **THEN** the backend ignores the stale snapshot and keeps the authoritative connection's state projection

#### Scenario: Invalid browser state snapshot is rejected
- **WHEN** a registered agent sends a malformed `browser.stateSnapshot` payload
- **THEN** the backend logs a validation summary and does not update browser profile or pending-auth state

### Requirement: Agent registry is capability-neutral
The backend SHALL store agent capabilities generically without requiring browser-specific behavior in this change.

#### Scenario: Empty capabilities are accepted
- **WHEN** a desktop agent registers with an empty capabilities list
- **THEN** the backend accepts the registration and reports the agent as online

#### Scenario: Unknown future capabilities are preserved
- **WHEN** a desktop agent registers with a syntactically valid capability string unknown to the backend
- **THEN** the registry preserves the capability value in status output without attempting to execute it

### Requirement: Agent registry diagnostics
The backend SHALL expose enough diagnostics to troubleshoot registration without leaking sensitive data.

#### Scenario: Connection events are logged
- **WHEN** an agent connects, registers, reconnects, heartbeats, or disconnects
- **THEN** the backend logs a structured event with agent id when available, connection id, event type, and timestamp

#### Scenario: Invalid payloads are summarized
- **WHEN** a socket sends an invalid agent message
- **THEN** the backend logs the validation failure summary without logging arbitrary large payload bodies
