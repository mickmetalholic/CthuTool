## MODIFIED Requirements

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
