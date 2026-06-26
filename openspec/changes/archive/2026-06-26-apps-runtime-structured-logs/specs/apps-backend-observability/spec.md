## MODIFIED Requirements

### Requirement: Structured backend events
The backend SHALL emit structured observability events for request lifecycle, exceptions, browser content tasks, diagnostics persistence, agent command dispatch, and readiness checks as JSON records suitable for stdout/stderr collection into Loki.

#### Scenario: Request completion is logged
- **WHEN** an HTTP request completes
- **THEN** the backend emits one JSON log record containing the request identifier, trace identifier when available, route or path, status, duration, event name, level, service, source, and error code when applicable
- **AND** the record can be parsed as a single JSON object from stdout or stderr

#### Scenario: Sensitive artifacts are excluded
- **WHEN** backend observability events include browser or diagnostics context
- **THEN** the JSON log record does not include raw HTML, screenshots, cookies, storage-state values, tokens, or browser profile directories

#### Scenario: Readiness evaluation is logged
- **WHEN** the backend readiness endpoint evaluates browser agent and diagnostics storage dependencies
- **THEN** the backend emits a structured readiness JSON record with overall readiness, dependency status labels, and safe dependency identifiers without logging raw dependency payloads

#### Scenario: Common fields are queryable
- **WHEN** backend observability event details contain common fields such as command id, operation, duration, status, or error code
- **THEN** those fields are available as top-level JSON fields in the emitted log record when present
- **AND** less common safe fields remain under a sanitized details object
