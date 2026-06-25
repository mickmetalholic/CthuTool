## ADDED Requirements

### Requirement: Desktop runtime coverage covers persistence and browser orchestration
The root-managed desktop package SHALL include runtime tests for browser profile persistence, pending auth state, and Playwright host orchestration paths that can affect desktop reliability.

#### Scenario: Browser profile metadata replacement is covered
- **WHEN** desktop tests exercise browser profile persistence
- **THEN** they cover successful metadata writes and retryable replacement failures
- **AND** the tests verify that profile state remains readable after replacement

#### Scenario: Playwright profile verification flows are covered
- **WHEN** desktop tests exercise login and verification flows
- **THEN** they cover verified, login-required, blocked, and pending auth resolution outcomes
- **AND** the tests assert profile and pending task state changes

### Requirement: Desktop renderer coverage includes user workflows
The desktop package SHALL include renderer tests for workflows that coordinate settings, agent status, task state, and browser actions.

#### Scenario: Renderer workflow tests validate state transitions
- **WHEN** desktop renderer tests run
- **THEN** they cover user-visible state changes rather than only import smoke checks
- **AND** mocked desktop APIs are asserted through observable workflow effects

### Requirement: Desktop coverage baseline is reviewed before gating
Desktop coverage SHALL remain visibility-only unless this change records a baseline and explicitly graduates it to threshold-gated coverage.

#### Scenario: Desktop coverage policy remains explicit
- **WHEN** the desktop coverage baseline is reviewed
- **THEN** the coverage policy documents whether desktop remains visibility-only or becomes threshold-gated
- **AND** any threshold values are conservative relative to the recorded baseline
