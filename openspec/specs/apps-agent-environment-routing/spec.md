# apps-agent-environment-routing Specification

## Purpose
TBD - created by archiving change add-agent-environment-routing. Update Purpose after archive.
## Requirements
### Requirement: Trusted environment catalog
The Agent SHALL load environment profiles that bind an environment id and label to an exact deployed Web origin, same-origin Agent-console URL, backend HTTPS URL, backend WSS Agent URL, and environment-scoped local namespace.

#### Scenario: Packaged environment is loaded
- **WHEN** the Agent starts with a valid release-controlled environment catalog
- **THEN** it exposes the supported environment ids and labels without allowing the Web page to replace their trusted URLs

#### Scenario: Catalog entry is invalid
- **WHEN** an environment profile has a non-HTTPS/WSS production endpoint, invalid Web origin, Agent-console URL outside that origin, duplicate id, or missing namespace
- **THEN** the Agent rejects that profile and reports bounded configuration diagnostics

#### Scenario: Custom development environment is added
- **WHEN** the operator explicitly adds a custom environment through the supported CLI/development path
- **THEN** the Agent marks it custom and does not silently treat it as a release-trusted production profile

### Requirement: Single active environment
The Agent SHALL persist and connect exactly one active environment at a time.

#### Scenario: Agent starts with a selected environment
- **WHEN** a valid active environment id is persisted
- **THEN** the Agent loads only that environment's backend connection, profiles, and diagnostics namespace

#### Scenario: No environment is selected
- **WHEN** the Agent has profiles but no active selection
- **THEN** it remains locally ready, does not connect to a backend, and reports environment selection required

### Requirement: Coordinated environment switching
The Agent SHALL switch environments without restarting the tray and SHALL prevent old-environment work from crossing the switch boundary.

#### Scenario: Environment switch succeeds
- **WHEN** the operator selects another valid environment
- **THEN** the Agent rejects new old-environment commands, drains or cancels bounded work, closes controlled browser contexts, invalidates local bridge tickets, disconnects the old backend, activates the new namespace, and reconnects

#### Scenario: New environment connection fails
- **WHEN** the target backend cannot authenticate or connect
- **THEN** the selected environment remains active in an offline/degraded state and the Agent does not reconnect to another environment automatically

#### Scenario: Current environment is selected again
- **WHEN** the operator selects the already active environment
- **THEN** the operation succeeds idempotently without discarding profiles or creating a second connection

### Requirement: Environment-scoped mutable state
The Agent SHALL isolate browser profiles, configuration overrides, logs, and
pending command state by environment. It MUST NOT require or persist a static
Agent secret for an environment.

#### Scenario: Test environment uses a profile
- **WHEN** the test environment launches a site profile
- **THEN** it uses the test namespace and cannot open production profile data
  by default

#### Scenario: Environment diagnostics are read
- **WHEN** status or logs are requested
- **THEN** entries identify their environment id without revealing another
  environment's authorization material or raw profile data

#### Scenario: Legacy secret file exists
- **WHEN** an existing environment directory contains an `agent-secret` file
- **THEN** the Agent ignores the file and does not delete it implicitly

### Requirement: Stable non-secret Agent identity
The Agent SHALL use a persisted random Agent id for correlation and SHALL NOT treat that id as an authentication credential.

#### Scenario: Agent reconnects
- **WHEN** the same installation reconnects to an environment
- **THEN** it reports the same valid Agent id with a new connection generation

#### Scenario: Agent id is observed
- **WHEN** the id appears in status, logs, or protocol metadata
- **THEN** no authentication decision relies on secrecy of the id

### Requirement: Active environment Web-origin binding
The Agent SHALL expose local Web bridge access only to the exact Web origin configured for the active environment.

#### Scenario: Active environment page connects
- **WHEN** a request Origin exactly matches the active environment Web origin and presents a valid local bridge ticket
- **THEN** the Agent may continue the local bridge handshake

#### Scenario: Other environment page connects
- **WHEN** a request comes from a configured but inactive environment Web origin
- **THEN** the Agent rejects it without switching environment

#### Scenario: Environment changes
- **WHEN** the active environment switches
- **THEN** all local bridge tickets and sessions issued for the prior Web origin become invalid

### Requirement: Redacted environment diagnostics
Environment lifecycle diagnostics SHALL include bounded environment,
connection, and switch outcomes while excluding operator sessions, local
tickets, authorization material, and raw browser artifacts.

#### Scenario: Backend rejects a connection
- **WHEN** the Backend rejects an Agent because its socket peer is public or
  its environment id is incorrect
- **THEN** diagnostics report only the bounded rejection category and
  environment id without a submitted credential value

#### Scenario: Environment switch is recorded
- **WHEN** an environment switch starts or finishes
- **THEN** diagnostics record source/target ids, phase, outcome, and timestamp
  without profile contents
