## MODIFIED Requirements

### Requirement: Shared runtime log envelope
CthuTool application runtimes SHALL use a shared structured log envelope for application diagnostics so events can be correlated across backend, web, desktop, and CLI without relying on runtime-specific formatting or a particular log storage platform.

#### Scenario: Runtime log fields are stable
- **WHEN** a runtime emits a structured diagnostic event
- **THEN** the event uses stable fields for source, level, event name, message, timestamp, and safe details
- **AND** the event carries available correlation fields such as request id, trace id, command id, operation, duration, status, and error code using consistent field names

#### Scenario: Sensitive values are excluded
- **WHEN** a runtime structured log includes contextual details
- **THEN** cookies, tokens, authorization headers, localStorage, sessionStorage, storage-state values, HTML, screenshots, profile paths, passwords, secrets, and raw unbounded payloads are redacted or replaced with bounded summaries

#### Scenario: Correlation values remain log fields
- **WHEN** structured logs are consumed by local diagnostics or an external log collector
- **THEN** request identifiers, trace identifiers, command identifiers, raw URLs, and user-provided free-form values remain JSON log fields
- **AND** they are not required to become storage-platform labels by application logging behavior
