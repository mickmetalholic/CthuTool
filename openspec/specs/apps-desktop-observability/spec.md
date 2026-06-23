# apps-desktop-observability Specification

## Purpose
TBD - created by archiving change apps-desktop-observability-semantics. Update Purpose after archive.
## Requirements
### Requirement: Desktop agent observability
CthuDesktop SHALL define structured observability events for agent connection lifecycle, registration, reconnect attempts, heartbeat state, backend rejection, and local stop/start transitions.

#### Scenario: Agent reconnect is observable
- **WHEN** the desktop agent connection closes and reconnects
- **THEN** desktop observability records connection state transitions, backend URL, agent id, attempt timing, and last error when available

#### Scenario: Backend rejection is observable
- **WHEN** the backend rejects an agent message
- **THEN** desktop observability records a structured warning without logging raw protocol payloads

### Requirement: Desktop browser host observability
CthuDesktop SHALL define structured observability events for browser command receipt, runtime readiness, profile checks, access detection, command duration, command failure, and payload bounding.

#### Scenario: Browser command execution is observable
- **WHEN** CthuDesktop executes a browser command
- **THEN** desktop observability records command id, command type, site id, profile name when non-sensitive, duration, detection kind, and outcome

#### Scenario: Runtime diagnostic is observable
- **WHEN** the browser runtime is pending, ready, or unavailable
- **THEN** desktop observability exposes a local diagnostic summary without exposing profile directories or browser storage

### Requirement: Desktop safe local diagnostics
CthuDesktop SHALL prevent local logs and diagnostics summaries from containing cookies, storage state, localStorage values, raw screenshots, raw HTML, tokens, or browser profile directory internals.

#### Scenario: Sensitive payload is excluded
- **WHEN** a browser command captures HTML or screenshot data
- **THEN** desktop observability records only bounded metadata, command context, and diagnostic identifiers rather than raw captured artifacts

