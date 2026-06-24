## MODIFIED Requirements

### Requirement: Structured backend events
The backend SHALL emit structured observability events for request lifecycle, exceptions, browser content tasks, diagnostics persistence, agent command dispatch, and readiness checks.

#### Scenario: Request completion is logged
- **WHEN** an HTTP request completes
- **THEN** the backend emits a structured event containing the request identifier, route or path, status, duration, and error code when applicable

#### Scenario: Sensitive artifacts are excluded
- **WHEN** backend observability events include browser or diagnostics context
- **THEN** the events do not include raw HTML, screenshots, cookies, storage-state values, tokens, or browser profile directories

#### Scenario: Readiness evaluation is logged
- **WHEN** the backend readiness endpoint evaluates browser agent and diagnostics storage dependencies
- **THEN** the backend emits a structured readiness event with overall readiness, dependency status labels, and safe dependency identifiers without logging raw dependency payloads

### Requirement: Backend readiness semantics
The backend SHALL distinguish liveness from readiness, report dependency readiness for browser agent availability, diagnostics storage, and configured runtime dependencies, and expose readiness status through both the readiness response and structured observability events.

#### Scenario: Liveness remains process scoped
- **WHEN** the liveness endpoint is checked
- **THEN** the backend reports process availability without requiring a desktop browser agent to be online

#### Scenario: Readiness includes dependencies
- **WHEN** the readiness endpoint is checked
- **THEN** the backend reports dependency status for browser agent availability and diagnostics storage separately from process liveness

#### Scenario: Degraded readiness is observable
- **WHEN** the readiness endpoint reports a degraded dependency
- **THEN** backend observability records which dependency is degraded using bounded status labels and a warning level
