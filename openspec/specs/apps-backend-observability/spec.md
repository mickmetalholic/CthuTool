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
The backend SHALL emit structured observability events for request lifecycle, exceptions, browser content tasks, diagnostics persistence, agent command dispatch, readiness checks, and accepted client diagnostic events as JSON records suitable for stdout/stderr collection into Loki.

#### Scenario: Client event is logged safely
- **WHEN** the backend accepts a client observability event
- **THEN** the backend emits a structured JSON log record with event `client.event_received`
- **AND** the record includes the backend ingestion request id, client source, client level, client event name, scope, route, status, duration, and safe error code when present
- **AND** the record does not include raw HTML, screenshots, cookies, storage-state values, tokens, form values, or browser profile directories

### Requirement: Backend metrics and traces
The backend SHALL define stable metric and trace names for request latency, browser task queue behavior, command dispatch outcomes, blocked detections, and readiness status, and SHALL export OpenTelemetry traces when an OTLP endpoint is configured.

#### Scenario: Browser task metrics are recorded
- **WHEN** a browser content task is queued, started, completed, timed out, or failed
- **THEN** backend observability records queue length, active count, duration, outcome, and detection kind when available using bounded label values

#### Scenario: Agent command metrics are recorded
- **WHEN** the backend dispatches a command to a desktop agent
- **THEN** backend observability records command type, timeout, completion, failure, and selected agent status without exposing raw WebSocket payloads

#### Scenario: Backend traces are exported
- **WHEN** the backend starts with OTLP trace export configured
- **THEN** it initializes OpenTelemetry before creating the Nest application
- **AND** it exports spans with service name `cthutool-backend` to the configured OTLP endpoint
- **AND** tracing can be disabled by `OTEL_SDK_DISABLED=true`

#### Scenario: Backend tracing is local-safe by default
- **WHEN** the backend starts without an OTLP endpoint
- **THEN** it does not start the OpenTelemetry SDK
- **AND** existing request logs, metrics, and health endpoints continue to work

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

### Requirement: Backend Prometheus metric families
The backend SHALL record stable Prometheus metric families for HTTP request lifecycle, readiness dependency state, browser task runner pressure, browser task duration, and agent command dispatch outcomes.

#### Scenario: HTTP request metrics are recorded
- **WHEN** an HTTP request completes
- **THEN** the backend records a request counter and duration metric with bounded labels for method, normalized route or path category, status class, and outcome
- **AND** the metrics do not include request identifiers, trace identifiers, raw URLs, query strings, or user-provided values as labels

#### Scenario: Readiness metrics are recorded
- **WHEN** the backend readiness endpoint evaluates dependencies
- **THEN** the backend records readiness state metrics for browser agent availability and diagnostics storage using bounded dependency and status labels

#### Scenario: Browser task metrics are recorded
- **WHEN** a browser task is queued, started, completed, timed out, or failed
- **THEN** the backend records queue length, active count, task duration, and task outcome metrics using bounded labels

#### Scenario: Agent command metrics are recorded
- **WHEN** the backend dispatches a command to a desktop agent and receives success, error, timeout, or unavailable outcome
- **THEN** the backend records command count and duration metrics using bounded command type and outcome labels

#### Scenario: Metric labels exclude sensitive artifacts
- **WHEN** backend metrics are exposed for browser task, agent command, readiness, or HTTP request activity
- **THEN** metric labels do not include raw HTML, screenshots, cookies, storage-state values, tokens, browser profile directories, request IDs, trace IDs, command IDs, raw URLs, subject IDs, or free-form error messages

### Requirement: Backend Prometheus metrics endpoint
The backend SHALL expose a Prometheus-compatible `/metrics` endpoint so the GitOps-managed Prometheus stack can scrape backend metrics from the existing backend HTTP service.

#### Scenario: Metrics endpoint is scrape compatible
- **WHEN** Prometheus scrapes the backend metrics endpoint
- **THEN** the backend exposes metrics at `/metrics`
- **AND** the response uses the Prometheus text exposition format
- **AND** the response content type is compatible with Prometheus scraping
- **AND** metrics use stable names and bounded label values

#### Scenario: Metrics endpoint avoids sensitive data
- **WHEN** backend metrics include request, browser task, command dispatch, or readiness dimensions
- **THEN** metric labels do not include raw URLs, request identifiers, trace identifiers, command identifiers, tokens, cookies, screenshots, browser profile paths, or user-provided free-form values

#### Scenario: Existing platform scrape discovers endpoint
- **WHEN** the backend is deployed with the `/metrics` endpoint
- **THEN** the existing GitOps-managed Prometheus scrape configuration can collect backend metrics through the annotated backend Service
- **AND** `/metrics` is not used as the Kubernetes liveness or readiness probe

### Requirement: Backend client event ingestion
The backend SHALL expose a bounded client observability event ingestion endpoint for Web, Desktop, and CLI diagnostic summaries.

#### Scenario: Client event is accepted
- **WHEN** a client submits a valid event to `POST /api/client-events`
- **THEN** the backend returns an accepted response containing the backend request id for the ingestion request
- **AND** the backend logs the event through the structured backend observability logger

#### Scenario: Client event is rejected
- **WHEN** a client submits an event with an unsupported source, unsupported level, missing event name, missing message, malformed body, or oversized payload
- **THEN** the backend rejects the request with a client error
- **AND** the backend does not log the rejected client payload as an accepted client event

#### Scenario: Client event rate limit is enforced
- **WHEN** one client source and remote address submits too many events in the configured window
- **THEN** the backend rejects additional events with a rate-limit response
- **AND** the response still participates in backend request context logging
