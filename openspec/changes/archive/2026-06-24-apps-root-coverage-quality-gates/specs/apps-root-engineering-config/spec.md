## ADDED Requirements

### Requirement: Coverage quality gates are package-aware
Root-managed runtime coverage quality gates SHALL be configured per package so mature test suites can block regressions without imposing premature thresholds on smoke-test-focused packages.

#### Scenario: Initial gated packages are explicit
- **WHEN** root engineering contract tests inspect coverage quality gate configuration
- **THEN** `@cthutool/backend`, `@cthutool/config`, and `@cthutool/agent-protocol` are listed as threshold-gated packages
- **AND** each listed package has explicit threshold values for the coverage metrics enforced by its test runner

#### Scenario: Visibility-only packages stay non-blocking
- **WHEN** root-managed runtime packages without coverage quality gates run coverage
- **THEN** they still produce and publish coverage artifacts according to the coverage artifact contract
- **AND** their coverage percentages do not fail CI solely because they are below a threshold

#### Scenario: No root aggregate threshold masks package regressions
- **WHEN** root coverage verification runs
- **THEN** threshold enforcement is based on package-local coverage results for threshold-gated packages
- **AND** a repository-wide aggregate coverage percentage is not the only quality gate

### Requirement: Coverage thresholds are conservative and reviewable
Coverage threshold values SHALL be explicit, conservative, and reviewable so they prevent large regressions while leaving room for normal refactoring noise.

#### Scenario: Threshold values are recorded in package configuration
- **WHEN** a threshold-gated package coverage configuration is inspected
- **THEN** the enforced coverage thresholds are visible in that package's runner configuration or an explicitly referenced coverage policy file
- **AND** the thresholds are not hidden in CI-only shell logic

#### Scenario: Thresholds are lower than or equal to recorded baseline intent
- **WHEN** a threshold is introduced or changed
- **THEN** the change records the baseline or rationale used to choose the threshold
- **AND** the initial threshold does not require immediate broad test rewrites for the package to pass

#### Scenario: Threshold failures identify ownership
- **WHEN** a threshold-gated package fails coverage verification
- **THEN** the command output or CI failure identifies the package and coverage metric that failed
- **AND** the failure can be investigated without reading combined coverage artifacts manually

### Requirement: Coverage gate graduation policy is documented
The repository SHALL document how root-managed packages move from visibility-only coverage to threshold-gated coverage.

#### Scenario: Graduation criteria are documented
- **WHEN** root engineering coverage policy documentation is inspected
- **THEN** it describes criteria for adding a package to the threshold-gated set
- **AND** the criteria include stable coverage artifact production, meaningful behavioral tests, and an agreed baseline

#### Scenario: New gates require contract updates
- **WHEN** a package is promoted to threshold-gated coverage
- **THEN** root engineering contract tests or policy data are updated to include that package
- **AND** CI coverage verification enforces the package's configured thresholds

#### Scenario: CLI runner differences remain explicit
- **WHEN** coverage gate policy discusses `@cthutool/cli`
- **THEN** it preserves Bun coverage as the CLI runner
- **AND** any future CLI threshold decision accounts for Bun coverage output differences instead of requiring Vitest-specific artifacts
