## ADDED Requirements

### Requirement: Obsidian enhancer domain behavior is covered
The Obsidian enhancer package SHALL include behavior tests for its domain utilities and adapter-facing boundaries.

#### Scenario: Tag and exclusion logic is covered
- **WHEN** package tests exercise tag and excluded root utilities
- **THEN** they cover valid inputs, invalid inputs, empty inputs, and duplicate or normalized values
- **AND** expected normalization behavior is asserted

#### Scenario: Obsidian adapter boundaries are covered
- **WHEN** package behavior depends on Obsidian-facing APIs
- **THEN** tests use typed fakes or stable adapters
- **AND** tests do not require a live Obsidian application

### Requirement: Obsidian enhancer coverage graduation is evaluated
The Obsidian enhancer package SHALL record a coverage baseline and explicitly decide whether it becomes threshold-gated.

#### Scenario: Coverage gate decision is documented
- **WHEN** package coverage is expanded
- **THEN** the coverage policy records the baseline and gating decision
- **AND** any package-local thresholds are visible in runner configuration
