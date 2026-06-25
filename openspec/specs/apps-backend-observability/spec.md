# apps-backend-observability Specification

## Purpose
Define backend request context, structured event, readiness, metrics, and trace semantics so CthuTool backend operations can be safely correlated and monitored.
## Requirements
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

#### Scenario: Readiness evaluation is logged
- **WHEN** the backend readiness endpoint evaluates browser agent and diagnostics storage dependencies
- **THEN** the backend emits a structured readiness event with overall readiness, dependency status labels, and safe dependency identifiers without logging raw dependency payloads

### Requirement: Backend metrics and traces
The backend SHALL define stable metric and trace names for request latency, browser task queue behavior, command dispatch outcomes, blocked detections, and readiness status.

#### Scenario: Browser task metrics are recorded
- **WHEN** a browser content task is queued, started, completed, timed out, or failed
- **THEN** backend observability records queue length, active count, duration, outcome, and detection kind when available using bounded label values

#### Scenario: Agent command metrics are recorded
- **WHEN** the backend dispatches a command to a desktop agent
- **THEN** backend observability records command type, timeout, completion, failure, and selected agent status without exposing raw WebSocket payloads

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

### Requirement: Backend Prometheus metrics endpoint
The backend SHALL expose a Prometheus-compatible `/metrics` endpoint in a future backend implementation so the GitOps-managed Prometheus stack can scrape backend metrics.

#### Scenario: Metrics endpoint is scrape compatible
- **WHEN** Prometheus scrapes the backend metrics endpoint
- **THEN** the backend exposes metrics at `/metrics`
- **AND** the response is compatible with Prometheus scraping
- **AND** metrics use stable names and bounded label values

#### Scenario: Metrics endpoint avoids sensitive data
- **WHEN** backend metrics include request, browser task, command dispatch, or readiness dimensions
- **THEN** metric labels do not include raw URLs, request identifiers, tokens, cookies, screenshots, browser profile paths, or user-provided free-form values

#### Scenario: Platform change does not implement endpoint
- **WHEN** this GitOps observability stack change is implemented
- **THEN** the platform may define scrape configuration for `/metrics`
- **AND** backend code changes to implement `/metrics` remain a separate task boundary unless a later change explicitly includes them
