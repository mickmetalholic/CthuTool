## MODIFIED Requirements

### Requirement: Environment-aware Agent lifecycle metadata
The `@cthutool/agent-protocol` package SHALL define bounded environment id,
stable non-secret Agent id, protocol version, and connection-generation fields
for private-network-authenticated lifecycle messages and public status.

#### Scenario: Agent sends hello
- **WHEN** a private-network Agent connection constructs `agent.hello`
- **THEN** the schema validates environment id, Agent id, protocol version,
  client metadata, and generic capabilities without embedding authorization
  material in the payload

#### Scenario: Backend acknowledges registration
- **WHEN** the Backend accepts the hello
- **THEN** `agent.registered` contains environment id, Agent id, connection
  generation, negotiated protocol version, and server time

#### Scenario: Public Agent status is serialized
- **WHEN** lifecycle state is exposed to a private-network operator
- **THEN** protocol status omits operator material, authorization headers, and
  local bridge tickets

## REMOVED Requirements

### Requirement: Static-secret metadata redaction
**Reason**: The Agent WebSocket no longer uses a static Agent secret or
secret-specific authentication metadata.
**Migration**: Apply the retained generic diagnostics redaction rules to
authorization headers, operator sessions, bridge tickets, cookies, and other
credential-shaped values.

## ADDED Requirements

### Requirement: Generic credential metadata redaction
The Agent protocol MUST forbid authorization headers, operator sessions,
bridge tickets, cookies, and other credential-shaped values in public lifecycle
status, observability metadata, and public error data.

#### Scenario: Credential field enters metadata
- **WHEN** lifecycle or command metadata contains a credential-shaped field
- **THEN** protocol validation rejects or strips it before public serialization
  or logging
