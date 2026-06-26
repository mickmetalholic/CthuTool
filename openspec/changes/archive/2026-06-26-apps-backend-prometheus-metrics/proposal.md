## Why

The GitOps observability stack already defines Prometheus scrape discovery for a future backend `/metrics` endpoint, but the backend does not yet expose scrape-compatible business metrics. Implementing backend metrics now closes that platform/application gap and makes CthuTool backend latency, readiness, browser task pressure, and agent command outcomes visible in Grafana and Prometheus alerts.

## What Changes

- Add a Prometheus-compatible `/metrics` endpoint to `apps/backend`.
- Record bounded backend metrics for HTTP requests, readiness checks, browser task queue/execution, and agent command dispatch outcomes.
- Reuse the existing Kubernetes scrape annotations and observability stack rather than adding a custom logging or metrics service.
- Keep request identifiers, trace identifiers, command identifiers, raw URLs, tokens, cookies, screenshots, browser profile paths, and user-provided free-form values out of metric labels.
- Add tests that verify `/metrics` is scrape-compatible and sensitive or high-cardinality values are not exposed as labels.

## Capabilities

### New Capabilities

### Modified Capabilities

- `apps-backend-observability`: Backend Prometheus metrics move from a future platform contract to an implemented backend endpoint with concrete metric families and bounded label semantics.

## Impact

- Affected code: `apps/backend/src`, backend tests, and possibly `apps/backend/package.json` for a Prometheus metrics dependency.
- Affected runtime API: new `GET /metrics` endpoint on the existing backend HTTP port.
- Affected platform: existing Prometheus scrape configuration can begin collecting backend metrics once the backend image is deployed.
- Affected security/privacy: metric labels must remain low-cardinality and must not contain sensitive artifacts or user-provided free-form values.
