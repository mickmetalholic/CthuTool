## ADDED Requirements

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

## MODIFIED Requirements

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
