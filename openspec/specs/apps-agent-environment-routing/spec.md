# apps-agent-environment-routing Specification

## Purpose
Define how the local Agent selects trusted deployment environments, scopes mutable state and identity, coordinates switching, and reports redacted diagnostics.

## Requirements

### Requirement: Trusted environment catalog

The Agent SHALL load a user-scoped self-use deployment profile derived from one exact Origin for self-use releases, while retaining an explicitly enabled external catalog only for non-production development paths; a self-use release SHALL NOT require a packaged deployment catalog.

#### Scenario: Packaged environment is loaded

- **WHEN** a self-use Agent starts with a valid user deployment Origin
- **THEN** it constructs one `self-use` profile with the exact Web Origin, same-origin `/agent` URL, same-origin Backend HTTP base, WSS `/ws/agents` endpoint, and `self-use` namespace without allowing the Web page to replace those values

#### Scenario: Catalog entry is invalid

- **WHEN** a self-use profile has a non-HTTPS Origin, a URL with a path/query/fragment, or an invalid derived endpoint
- **THEN** the Agent remains in SetupRequired or degraded configuration state and reports bounded diagnostics without attempting an unauthorised connection

#### Scenario: Custom development environment is added

- **WHEN** the operator explicitly enables the supported non-production development catalog path
- **THEN** the Agent may load custom profiles, marks them as development profiles, and does not silently treat them as self-use release configuration

### Requirement: Single active environment

The self-use Agent SHALL persist and connect exactly one active `self-use` profile at a time; multi-profile selection remains limited to the explicit development path.

#### Scenario: Agent starts with a selected environment

- **WHEN** a valid self-use Origin is persisted
- **THEN** the Agent loads only the derived self-use Backend connection, Secret reference, profiles, and diagnostics namespace

#### Scenario: No environment is selected

- **WHEN** no valid self-use Origin is persisted
- **THEN** it remains locally controllable in SetupRequired state, does not connect to a Backend, and reports configuration required

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

### Requirement: Self-use environment selection boundary

The self-use Agent SHALL expose one fixed environment identity and SHALL reject environment switching through tray, CLI, Web, or local bridge operations.

#### Scenario: Self-use environment is requested

- **WHEN** status, bridge launch, or Web bootstrap requests the self-use environment
- **THEN** the Agent uses the fixed `self-use` id and its derived namespace

#### Scenario: Self-use environment switch is requested

- **WHEN** a caller requests a different environment id from a self-use installation
- **THEN** the Agent rejects the request with an actionable single-environment error and leaves the active configuration unchanged
