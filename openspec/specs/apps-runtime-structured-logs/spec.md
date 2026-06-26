# apps-runtime-structured-logs Specification

## Purpose
TBD - created by archiving change apps-runtime-structured-logs. Update Purpose after archive.
## Requirements
### Requirement: Shared runtime log envelope
CthuTool application runtimes SHALL use a shared structured log envelope for application diagnostics so events can be correlated across backend, web, desktop, and CLI without relying on runtime-specific formatting.

#### Scenario: Runtime log fields are stable
- **WHEN** a runtime emits a structured diagnostic event
- **THEN** the event uses stable fields for source, level, event name, message, timestamp, and safe details
- **AND** the event carries available correlation fields such as request id, trace id, command id, operation, duration, status, and error code using consistent field names

#### Scenario: Sensitive values are excluded
- **WHEN** a runtime structured log includes contextual details
- **THEN** cookies, tokens, authorization headers, localStorage, sessionStorage, storage-state values, HTML, screenshots, profile paths, passwords, secrets, and raw unbounded payloads are redacted or replaced with bounded summaries

#### Scenario: Correlation values remain log fields
- **WHEN** structured logs are collected into Loki
- **THEN** request identifiers, trace identifiers, command identifiers, raw URLs, and user-provided free-form values remain JSON log fields
- **AND** they are not promoted to Loki labels by application logging behavior

### Requirement: Local-first client runtime diagnostics
Web, Desktop, and CLI runtimes SHALL align local diagnostic events with the shared runtime log envelope while remaining local-first until an explicit client-event upload change is implemented.

#### Scenario: Client runtimes do not require remote upload
- **WHEN** Web, Desktop, or CLI emits a local diagnostic event
- **THEN** the event can be inspected locally or exported through existing diagnostics paths
- **AND** the event is not required to be sent to the backend, Loki, or an OpenTelemetry collector by this capability
