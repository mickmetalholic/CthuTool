## ADDED Requirements

### Requirement: Environment-aware Agent lifecycle metadata
The `@cthutool/agent-protocol` package SHALL define bounded environment id, stable non-secret Agent id, protocol version, and connection-generation fields for lifecycle messages and public status.

#### Scenario: Agent sends hello
- **WHEN** an authenticated environment connection constructs `agent.hello`
- **THEN** the schema validates environment id, Agent id, protocol version, client metadata, and generic capabilities without embedding the static Agent secret in the payload

#### Scenario: Backend acknowledges registration
- **WHEN** the backend accepts the hello
- **THEN** `agent.registered` contains environment id, Agent id, connection generation, negotiated protocol version, and server time

#### Scenario: Public Agent status is serialized
- **WHEN** lifecycle state is exposed to an authenticated operator
- **THEN** protocol status omits Agent secrets, operator material, and local bridge tickets

### Requirement: Environment command correlation
The Agent protocol SHALL define capability-neutral environment and connection-generation metadata for JSON-RPC command correlation.

#### Scenario: Environment command is encoded
- **WHEN** the gateway sends a machine command
- **THEN** bounded metadata identifies the environment, Agent, command correlation, and authoritative generation without browser-specific fields

#### Scenario: Stale generation responds
- **WHEN** a response generation differs from the pending request
- **THEN** consumers can reject it as stale without resolving the current connection's command

### Requirement: Static-secret metadata redaction
The Agent protocol MUST forbid static Agent secrets, operator passwords/sessions, authorization headers, and local bridge tickets in public lifecycle status, observability metadata, and public error data.

#### Scenario: Secret field enters metadata
- **WHEN** lifecycle or command metadata contains a forbidden secret-shaped field
- **THEN** protocol validation rejects or strips it before public serialization or logging
