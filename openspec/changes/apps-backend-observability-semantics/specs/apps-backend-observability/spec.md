## ADDED Requirements

### Requirement: Backend request context
The backend SHALL assign or preserve a request context for HTTP entry points that includes a request identifier, start time, method, route or path, response status, duration, and optional upstream correlation metadata.

#### Scenario: Request id is generated
- **WHEN** an HTTP request enters the backend without an existing request identifier
- **THEN** the backend creates one request identifier and makes it available to downstream logs, errors, diagnostics, and command dispatches for that request

#### Scenario: Request id is preserved
- **WHEN** an HTTP request includes a supported request identifier header
- **THEN** the backend preserves that identifier as the request context identifier unless validation rejects it as malformed

### Requirement: Structured backend events
The backend SHALL emit structured observability events for request lifecycle, exceptions, browser content tasks, diagnostics persistence, agent command dispatch, and readiness checks.

#### Scenario: Request completion is logged
- **WHEN** an HTTP request completes
- **THEN** the backend emits a structured event containing the request identifier, route or path, status, duration, and error code when applicable

#### Scenario: Sensitive artifacts are excluded
- **WHEN** backend observability events include browser or diagnostics context
- **THEN** the events do not include raw HTML, screenshots, cookies, storage-state values, tokens, or browser profile directories

### Requirement: Backend metrics and traces
The backend SHALL define stable metric and trace names for request latency, browser task queue behavior, command dispatch outcomes, blocked detections, and readiness status.

#### Scenario: Browser task metrics are recorded
- **WHEN** a browser content task is queued, started, completed, timed out, or failed
- **THEN** backend observability records queue length, active count, duration, outcome, and detection kind when available using bounded label values

#### Scenario: Agent command metrics are recorded
- **WHEN** the backend dispatches a command to a desktop agent
- **THEN** backend observability records command type, timeout, completion, failure, and selected agent status without exposing raw WebSocket payloads

### Requirement: Backend readiness semantics
The backend SHALL distinguish liveness from readiness and report dependency readiness for browser agent availability, diagnostics storage, and configured runtime dependencies.

#### Scenario: Liveness remains process scoped
- **WHEN** the liveness endpoint is checked
- **THEN** the backend reports process availability without requiring a desktop browser agent to be online

#### Scenario: Readiness includes dependencies
- **WHEN** the readiness endpoint is checked
- **THEN** the backend reports dependency status for browser agent availability and diagnostics storage separately from process liveness
