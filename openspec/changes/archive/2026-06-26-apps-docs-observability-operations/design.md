## Context

The docs site already documents Kubernetes/GitOps as the official homelab deployment path. The latest source state adds observability behavior in backend code and GitOps manifests:

- `k8s/deployment.yaml` uses `/health` for liveness and `/health/ready` for readiness.
- `k8s/service.yaml` is annotated for Prometheus scraping at `/metrics`.
- `k8s/configmap.yaml` sets OTEL trace export environment variables.
- `gitops/apps/observability-*` defines Prometheus/Grafana, Loki, Alloy, Tempo, and OpenTelemetry Collector Applications.
- `gitops/observability/README.md` documents platform observability boundaries.

The docs should expose those facts to operators without duplicating every chart value.

## Decisions

### Add an operations observability page

Create `operations/observability.md` for the operator journey. It should explain:

- what runs in the observability stack
- how backend metrics are scraped
- how structured logs reach Loki
- how traces flow through OTEL Collector to Tempo
- how readiness differs from liveness
- what is intentionally out of scope, such as environment-specific alert receivers

### Keep deployment configuration source-bound

Update deployment/configuration and GitOps reference pages to name the source manifests instead of reprinting large chart values. The docs should stay stable and point readers to `gitops/observability/README.md`, `gitops/apps/observability-*`, and `k8s/*`.

### Keep sensitive data boundaries explicit

Observability docs must repeat the redaction boundary: no cookies, storage state, raw screenshots, raw HTML, profile paths, tokens, raw URLs, request IDs, trace IDs, or command IDs as metric/log labels.

## Risks / Trade-offs

- GitOps chart values can change frequently; docs should summarize stable paths and operator checks rather than duplicate full values.
- Alert receiver setup is environment-specific; docs should note that receivers are deferred rather than inventing unsupported notification steps.

## Open Questions

- Should future docs include screenshots or dashboard exports once the Grafana dashboard stabilizes?
