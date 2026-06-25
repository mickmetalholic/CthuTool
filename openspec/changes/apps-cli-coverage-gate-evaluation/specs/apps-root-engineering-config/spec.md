## ADDED Requirements

### Requirement: CLI Bun coverage inputs are evaluated before gating
The CLI package SHALL evaluate its Bun coverage output before introducing any coverage threshold gate.

#### Scenario: CLI coverage baseline is recorded
- **WHEN** `@cthutool/cli` coverage is evaluated
- **THEN** the current Bun coverage baseline is recorded for statements or the metrics Bun reports
- **AND** the baseline identifies package-owned source coverage separately from generated or external paths where possible

#### Scenario: CLI coverage paths are classified
- **WHEN** coverage reports include bundled scripts, temporary execution paths, or external plugin scripts
- **THEN** the change documents whether those paths count toward CLI coverage
- **AND** any exclusions are explicit and narrow

### Requirement: CLI remains on Bun test
The CLI package SHALL preserve Bun test and Bun coverage as its runtime-specific validation path.

#### Scenario: CLI gate decision preserves Bun runner
- **WHEN** the CLI coverage gate decision is made
- **THEN** CLI test and coverage scripts continue to use Bun
- **AND** no Vitest migration is required to satisfy the coverage policy

### Requirement: CLI coverage gate decision is explicit
The CLI package SHALL explicitly document whether it remains visibility-only or graduates to a Bun-compatible coverage gate.

#### Scenario: CLI gate outcome is recorded
- **WHEN** CLI coverage evaluation is complete
- **THEN** the coverage policy records the gate decision and rationale
- **AND** any future threshold values are tied to Bun coverage output rather than Vitest-specific artifacts
