# apps-agent-environment-routing Specification

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Self-use environment selection boundary

The self-use Agent SHALL expose one fixed environment identity and SHALL reject environment switching through tray, CLI, Web, or local bridge operations.

#### Scenario: Self-use environment is requested

- **WHEN** status, bridge launch, or Web bootstrap requests the self-use environment
- **THEN** the Agent uses the fixed `self-use` id and its derived namespace

#### Scenario: Self-use environment switch is requested

- **WHEN** a caller requests a different environment id from a self-use installation
- **THEN** the Agent rejects the request with an actionable single-environment error and leaves the active configuration unchanged
