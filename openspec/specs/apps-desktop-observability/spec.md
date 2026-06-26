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
CthuDesktop SHALL prevent local logs and diagnostics summaries from containing cookies, storage state, localStorage values, raw screenshots, raw HTML, tokens, browser profile directory internals, or other fields excluded by the shared runtime log envelope.

#### Scenario: Sensitive payload is excluded
- **WHEN** a browser command captures HTML or screenshot data
- **THEN** desktop observability records only bounded metadata, command context, and diagnostic identifiers rather than raw captured artifacts

#### Scenario: Desktop diagnostics use shared field names
- **WHEN** CthuDesktop records a local diagnostic event
- **THEN** the event uses stable fields for level, event, message, timestamp, safe details, and available correlation fields such as request id, trace id, command id, and operation
- **AND** the event remains local unless a separate client-event upload capability is implemented

### Requirement: Desktop diagnostics and observability contract
The Desktop app SHALL emit structured local diagnostics that align with the shared CthuTool client-event envelope and SHALL NOT upload diagnostics remotely unless explicitly configured by a later change.

#### Scenario: Desktop event remains local-first
- **WHEN** Desktop observability records a diagnostic event
- **THEN** the event includes a stable source, level, event name, message, timestamp, and safe details
- **AND** the event is not sent to `POST /api/client-events` by default

