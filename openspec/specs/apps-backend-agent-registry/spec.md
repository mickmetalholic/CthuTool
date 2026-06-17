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

### Requirement: Agent registry delegates command dispatch
The backend agent registry SHALL provide connection lookup and online status to the command gateway without exposing command correlation or business command behavior as registry responsibilities.

#### Scenario: Command gateway asks for active connection
- **WHEN** `AgentCommandGateway` needs to dispatch a command to an online agent
- **THEN** the agent registry or WebSocket server provides the authoritative active connection without making business command decisions

#### Scenario: Business module does not use registry directly
- **WHEN** a browser module needs to execute a desktop command
- **THEN** it uses the command gateway or a browser-facing provider instead of directly using the agent registry or raw WebSocket server

### Requirement: Agent registry is transport-only
The backend agent registry SHALL own only desktop client connection lifecycle, public client metadata, online status, heartbeat freshness, and capability advertisement.

#### Scenario: Browser-capable agent registers
- **WHEN** a desktop agent registers with browser capability
- **THEN** the registry stores the browser capability string as public agent metadata without storing browser profiles, pending auth tasks, browser diagnostics, or browser page state

#### Scenario: Capability-specific message arrives
- **WHEN** a registered desktop agent sends a capability-specific message
- **THEN** the registry delegates or ignores the message according to transport routing policy without mutating capability state in registry storage
