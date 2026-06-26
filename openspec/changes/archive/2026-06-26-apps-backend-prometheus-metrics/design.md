## Context

The GitOps observability stack is already managed through Argo CD and deploys Prometheus, Grafana, Loki, and Alloy. Prometheus is configured to discover annotated CthuTool backend services and scrape `/metrics`, while Loki/Alloy collect Kubernetes stdout/stderr logs. The backend currently has request context, readiness, and structured observability events, but it does not expose a Prometheus-compatible metrics endpoint or maintain numeric metric instruments.

This change is the backend implementation counterpart to the existing platform contract. It should keep metrics independent from Loki logging and future Tempo tracing work.

## Goals / Non-Goals

**Goals:**

- Expose `GET /metrics` from `apps/backend` on the existing HTTP port.
- Record low-cardinality Prometheus metrics for HTTP requests, readiness, browser task queue/execution, and agent command dispatch.
- Keep metric labels bounded and safe for Prometheus cardinality.
- Add focused tests for scrape output and sensitive-label exclusion.
- Reuse the existing GitOps scrape annotations rather than introducing a custom metrics service.

**Non-Goals:**

- Do not deploy or modify the observability platform stack.
- Do not add Tempo, OpenTelemetry tracing, or distributed trace storage.
- Do not change Loki collection or structured log formatting beyond what is needed to keep metrics separate.
- Do not use request IDs, trace IDs, command IDs, raw URLs, or user-provided values as metric labels.

## Decisions

### Use a Prometheus client library inside the backend

Use a Node Prometheus client library, such as `prom-client`, to define counters, gauges, and histograms and render the `/metrics` response. This avoids hand-rendering Prometheus text exposition and keeps histogram/counter behavior conventional.

Alternatives considered:

- Hand-written text exposition: rejected because it is easy to produce invalid exposition, duplicate metric names, or incorrect histogram buckets.
- A separate metrics sidecar: rejected because the metrics are application semantics and are already available in backend code.

### Keep `/metrics` on the existing backend HTTP service

Expose `/metrics` on the same Nest application and port as `/health` and `/health/ready`. The existing Kubernetes Service already exposes port `3000` and has Prometheus scrape annotations for `/metrics`.

Alternatives considered:

- Add a second metrics port: rejected for the first implementation because it requires extra Service and scrape configuration without clear benefit.
- Put metrics under `/health/metrics`: rejected because Prometheus conventions and existing platform scrape config use `/metrics`.

### Instrument existing critical-path services at their boundaries

Metrics should be recorded where the backend already knows bounded domain outcomes:

- HTTP request middleware/filter path for request count and duration.
- Health readiness service for dependency readiness status.
- Browser task runner for queue length, active count, task duration, and task outcomes.
- Agent command gateway for command dispatch outcome and duration.

This matches existing observability event boundaries and avoids adding broad cross-cutting hooks throughout business code.

### Use bounded labels only

Metric labels should use controlled values such as `method`, normalized `route`, numeric `status_class`, dependency name, command type, task label, outcome, and detection kind when values are enumerated or internally controlled. Labels must not include request IDs, trace IDs, command IDs, raw URLs, subject IDs, tokens, cookies, browser profile paths, screenshots, HTML, or free-form error messages.

Alternatives considered:

- Label by request path or raw URL: rejected because URL parameters and user-controlled path segments can explode cardinality.
- Label by request/trace/command identifiers: rejected because identifiers belong in logs/traces, not metrics.

### Enable default Node.js process metrics with a backend prefix

Enable `prom-client` default process metrics in the backend registry with the `cthutool_backend_` prefix. This gives CPU, memory, event-loop, and process-level visibility without requiring a separate exporter, while keeping project-specific metric names explicit.

Alternatives considered:

- Defer default metrics: rejected because process health metrics are useful immediately and low risk when prefixed.
- Expose default metrics through a separate registry: rejected because Prometheus already scrapes one backend `/metrics` endpoint.

## Risks / Trade-offs

- [Risk] Metric label cardinality grows accidentally as new code paths are instrumented. -> Mitigation: centralize metric helper APIs or tests that reject unsafe label keys and values.
- [Risk] `/metrics` may include default process metrics that are noisy in tests. -> Mitigation: explicitly decide whether default metrics are enabled and keep tests focused on required CthuTool metric families.
- [Risk] Metrics can double-count if middleware and filters both observe the same request. -> Mitigation: record HTTP metrics from one request lifecycle point, preferably response `finish`.
- [Risk] Prometheus scrape errors may appear before the backend image with `/metrics` is deployed. -> Mitigation: platform scrape config already tolerates the endpoint boundary; rollout order should deploy backend implementation after this change lands.

## Migration Plan

1. Add backend metrics dependency and a small metrics module/service.
2. Add `/metrics` controller endpoint returning Prometheus text exposition with the correct content type.
3. Instrument existing request, readiness, browser task, and agent command boundaries.
4. Add unit/e2e tests for endpoint shape, metric family presence, and label safety.
5. Deploy backend image; existing Prometheus scrape configuration should begin collecting metrics without new GitOps resources.

Rollback is standard backend rollback: revert the backend image or code. The observability platform can continue scraping; failed scrapes should not affect backend request handling.

## Open Questions

- Should browser task and agent command histogram buckets be tuned after real production latency data is available?
