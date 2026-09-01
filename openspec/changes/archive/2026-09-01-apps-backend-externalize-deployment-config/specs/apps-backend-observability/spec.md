## MODIFIED Requirements

### Requirement: Structured backend events
The backend SHALL emit structured observability events for request lifecycle, exceptions, browser content tasks, diagnostics persistence, agent command dispatch, readiness checks, and accepted client diagnostic events as JSON records suitable for stdout/stderr consumption by local tooling or an externally selected log collector.

#### Scenario: Client event is logged safely
- **WHEN** the backend accepts a client observability event
- **THEN** the backend emits a structured JSON log record with event `client.event_received`
- **AND** the record includes the backend ingestion request id, client source, client level, client event name, scope, route, status, duration, and safe error code when present
- **AND** the record does not include raw HTML, screenshots, cookies, storage-state values, tokens, form values, or browser profile directories

### Requirement: Backend Prometheus metrics endpoint
The backend SHALL expose a Prometheus-compatible `/metrics` endpoint through the existing backend HTTP service so an external metrics consumer can scrape it when configured. CthuTool SHALL NOT require a particular GitOps-managed Prometheus stack.

#### Scenario: Metrics endpoint is scrape compatible
- **WHEN** an external Prometheus-compatible consumer scrapes the backend metrics endpoint
- **THEN** the backend exposes metrics at `/metrics`
- **AND** the response uses the Prometheus text exposition format
- **AND** the response content type is compatible with Prometheus scraping
- **AND** metrics use stable names and bounded label values

#### Scenario: Metrics endpoint avoids sensitive data
- **WHEN** backend metrics include request, browser task, command dispatch, or readiness dimensions
- **THEN** metric labels do not include raw URLs, request identifiers, trace identifiers, command identifiers, tokens, cookies, screenshots, browser profile paths, or user-provided free-form values

#### Scenario: External platform can discover endpoint
- **WHEN** an external deployment configures the backend `/metrics` endpoint for scraping
- **THEN** the endpoint is available through the backend HTTP service
- **AND** `/metrics` is not used as the Kubernetes liveness or readiness probe
