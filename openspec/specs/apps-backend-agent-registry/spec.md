# apps-backend-agent-registry Specification

## Purpose
Define the backend desktop agent registry for WebSocket registration, heartbeat freshness, connected-agent status, diagnostics, and transport-only delegation.
## Requirements
### Requirement: Agent WebSocket endpoint
The backend SHALL expose a WebSocket endpoint that authenticates the configured environment's static Agent secret before accepting Agent registration.

#### Scenario: Environment Agent connects
- **WHEN** an Agent opens WSS with a valid environment id and matching static Agent secret and then sends a valid versioned `agent.hello`
- **THEN** the backend authenticates the environment and registers the stable non-secret Agent id

#### Scenario: Invalid registration is rejected
- **WHEN** a socket omits or fails environment authentication, sends invalid registration, or reports an unexpected environment id
- **THEN** the backend closes the socket without registering the Agent and records a redacted failure category

#### Scenario: Registered Agent is acknowledged
- **WHEN** an authenticated socket sends a valid `agent.hello`
- **THEN** the backend records it online and acknowledges environment id, Agent id, connection generation, negotiated protocol version, and server time

### Requirement: Agent registry state
The backend SHALL maintain an in-memory registry keyed by environment id and stable non-secret Agent id, with one authoritative connection for the personal-use deployment.

#### Scenario: Agent status is recorded
- **WHEN** an environment Agent registers successfully
- **THEN** the registry stores environment id, Agent id, connection id/generation, display metadata, platform, version, capabilities, connected time, and last-seen time without storing the presented secret

#### Scenario: Same Agent reconnects
- **WHEN** a new authenticated connection registers with the same environment and Agent id
- **THEN** the backend replaces the previous connection, increments generation, and marks only the latest connection authoritative

#### Scenario: Agent disconnects
- **WHEN** the authoritative socket closes
- **THEN** the registry marks that environment Agent offline and does not substitute a connection from another environment

### Requirement: Agent heartbeat handling
The backend SHALL use heartbeat messages to keep agent freshness current and detect stale connections.

#### Scenario: Heartbeat updates freshness
- **WHEN** a registered agent sends a valid heartbeat message
- **THEN** the backend updates that agent's last seen time

#### Scenario: Stale agent is removed
- **WHEN** a registered agent does not heartbeat before the configured stale timeout
- **THEN** the backend marks that agent offline or removes it from the active agent list

### Requirement: Connected agents API
The backend SHALL expose Agent connection state only through the configured single-operator access boundary when publicly reachable.

#### Scenario: Operator lists environment Agent
- **WHEN** an authenticated operator requests Agent state for the deployment environment
- **THEN** the backend returns environment id, Agent id, display metadata, platform, version, capabilities, connected time, last-seen time, generation, and connection state

#### Scenario: Anonymous caller lists Agents
- **WHEN** an unauthenticated caller requests the public Agent status API
- **THEN** the backend rejects the request without revealing whether an Agent is online

#### Scenario: Raw internals are hidden
- **WHEN** Agent state is returned
- **THEN** it excludes WebSocket objects, raw headers, static secrets, operator sessions, local bridge tickets, and socket internals

### Requirement: Agent registry is capability-neutral
The backend SHALL store agent capabilities generically without requiring browser-specific behavior in this change.

#### Scenario: Empty capabilities are accepted
- **WHEN** a desktop agent registers with an empty capabilities list
- **THEN** the backend accepts the registration and reports the agent as online

#### Scenario: Unknown future capabilities are preserved
- **WHEN** a desktop agent registers with a syntactically valid capability string unknown to the backend
- **THEN** the registry preserves the capability value in status output without attempting to execute it

### Requirement: Agent registry diagnostics
The backend SHALL expose enough diagnostics to troubleshoot environment authentication and connection lifecycle without leaking sensitive values.

#### Scenario: Connection event is logged
- **WHEN** an Agent connects, authenticates, registers, reconnects, heartbeats, or disconnects
- **THEN** the backend logs environment id, Agent id when available, connection id/generation, event type, and timestamp

#### Scenario: Authentication or payload is invalid
- **WHEN** a socket fails static-secret or protocol validation
- **THEN** diagnostics include a bounded failure category without secret values, authorization headers, cookies, or arbitrary payload bodies

### Requirement: Agent registry delegates command dispatch
The registry SHALL provide authoritative connection lookup for an explicit environment and Agent id without owning operator authentication, command correlation, or capability-specific business behavior.

#### Scenario: Gateway asks for environment connection
- **WHEN** `AgentCommandGateway` dispatches for a trusted environment context
- **THEN** the registry returns only that environment's authoritative Agent connection and generation

#### Scenario: Business module needs browser execution
- **WHEN** a browser module needs an Agent command
- **THEN** it uses the command gateway or browser-facing provider with environment context instead of the registry or raw socket server

### Requirement: Agent registry is transport-only
The backend agent registry SHALL own only desktop client connection lifecycle, public client metadata, online status, heartbeat freshness, and generic capability advertisement.

#### Scenario: Browser-capable agent registers
- **WHEN** a desktop agent registers with browser capability
- **THEN** the registry stores the browser capability string as public agent metadata without storing browser profiles, pending auth tasks, browser diagnostics, browser page state, or browser state snapshots

#### Scenario: Capability-specific message arrives
- **WHEN** a registered desktop agent sends a capability-specific non-JSON-RPC message
- **THEN** the registry rejects, delegates, or ignores the message according to transport routing policy without mutating capability state in registry storage

### Requirement: Registry accepts generic JSON-RPC command responses
The backend agent registry and WebSocket server SHALL route JSON-RPC command responses to the command gateway without understanding the capability that produced the response.

#### Scenario: JSON-RPC success arrives
- **WHEN** a registered desktop agent sends a JSON-RPC success response with an id
- **THEN** the WebSocket server forwards the response to the command gateway correlation path without inspecting the result payload

#### Scenario: JSON-RPC error arrives
- **WHEN** a registered desktop agent sends a JSON-RPC error response with an id
- **THEN** the WebSocket server forwards the response to the command gateway correlation path without interpreting application error codes or browser challenges

### Requirement: Agent state excludes capability state
The backend SHALL NOT use agent state modules to store capability-specific browser profiles, pending auth tasks, page state, diagnostics, or site-specific browser status.

#### Scenario: Browser status is needed
- **WHEN** a backend service needs browser profile or runtime status
- **THEN** it queries the desktop browser runtime on demand rather than reading agent state projection

#### Scenario: Agent status is needed
- **WHEN** a caller needs connected desktop client status
- **THEN** it reads registry-owned public agent status containing only client metadata, online state, freshness, and capabilities
