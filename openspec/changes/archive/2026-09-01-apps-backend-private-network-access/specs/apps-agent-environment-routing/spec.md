## MODIFIED Requirements

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
