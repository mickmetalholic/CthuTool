## ADDED Requirements

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
