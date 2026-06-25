## ADDED Requirements

### Requirement: Web package behavior is covered beyond utility smoke tests
The web package SHALL include runtime tests for app-owned utilities and project shell behavior.

#### Scenario: Web shell behavior is tested
- **WHEN** web runtime tests execute
- **THEN** they verify user-observable project shell behavior or rendering contracts
- **AND** they include meaningful assertions beyond module import success

#### Scenario: Web utilities cover edge cases
- **WHEN** web utility tests execute
- **THEN** they cover normal, empty, and conflicting input cases
- **AND** expected output normalization is asserted

### Requirement: Docs content validity is covered
The docs package SHALL include tests for content metadata and route discoverability.

#### Scenario: Docs content has required metadata
- **WHEN** docs content tests inspect pages
- **THEN** every docs page has required title and description metadata
- **AND** generated coverage or build artifacts are excluded from content validation

#### Scenario: Docs links and routes are validated
- **WHEN** docs content references internal routes or links
- **THEN** tests verify those references are discoverable or explicitly allowed
- **AND** failures identify the affected content file

### Requirement: Web and docs coverage gate decisions are explicit
Web and docs SHALL remain visibility-only unless this change records baselines and explicitly promotes one or both packages to threshold-gated coverage.

#### Scenario: Baselines drive gating decisions
- **WHEN** package coverage is expanded
- **THEN** the coverage policy records web and docs baselines
- **AND** any threshold gates are package-local and conservative
