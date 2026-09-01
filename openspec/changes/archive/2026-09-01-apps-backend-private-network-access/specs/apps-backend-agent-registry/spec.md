## MODIFIED Requirements

### Requirement: Agent WebSocket endpoint
The Backend SHALL expose a WebSocket endpoint that authenticates a private
network socket peer and the configured environment id before accepting Agent
registration. The endpoint MUST NOT require a static Agent secret.

#### Scenario: Environment Agent connects
- **WHEN** an Agent opens WSS from a private-network peer with the matching
  environment id and then sends a valid versioned `agent.hello`
- **THEN** the Backend authenticates the peer and environment and registers
  the stable non-secret Agent id

#### Scenario: Invalid network or environment registration is rejected
- **WHEN** a socket comes from a public peer, omits environment authentication,
  fails environment authentication, or reports an unexpected environment id
- **THEN** the Backend closes the socket without registering the Agent and
  records a redacted failure category

#### Scenario: Registered Agent is acknowledged
- **WHEN** a private-network socket sends a valid `agent.hello` for the
  configured environment
- **THEN** the Backend records it online and acknowledges environment id, Agent
  id, connection generation, negotiated protocol version, and server time

### Requirement: Connected agents API
The Backend SHALL expose Agent connection state only through the fixed
private-network access boundary when the Backend is reachable through an
external ingress.

#### Scenario: Private-network operator lists environment Agent
- **WHEN** a private-network operator requests Agent state for the deployment
  environment
- **THEN** the Backend returns environment id, Agent id, display metadata,
  platform, version, capabilities, connected time, last-seen time, generation,
  and connection state

#### Scenario: Public caller lists Agents
- **WHEN** a public socket peer requests the Agent status API
- **THEN** the Backend rejects the request without revealing whether an Agent
  is online

#### Scenario: Raw internals are hidden
- **WHEN** Agent state is returned
- **THEN** it excludes WebSocket objects, raw headers, authorization material,
  local bridge tickets, and socket internals

### Requirement: Agent registry diagnostics
The Backend SHALL expose enough diagnostics to troubleshoot private-network
peer validation, environment authentication, and connection lifecycle without
leaking credentials or raw request data.

#### Scenario: Connection event is logged
- **WHEN** an Agent connects, authenticates, registers, reconnects, heartbeats,
  or disconnects
- **THEN** the Backend logs environment id, Agent id when available,
  connection id/generation, event type, and timestamp

#### Scenario: Network or environment authentication is invalid
- **WHEN** a socket fails private-network or environment validation
- **THEN** diagnostics include a bounded failure category without authorization
  headers, cookies, or arbitrary payload bodies
