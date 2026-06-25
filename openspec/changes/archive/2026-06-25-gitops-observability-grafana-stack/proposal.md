## Why

CthuTool has application-level observability semantics, but the Kubernetes and GitOps layer does not yet define a standard stack for metrics, dashboards, logs, and future telemetry ingestion. A platform-owned observability baseline is needed before backend services expose production metrics so collection, labels, dashboards, and alerting are consistent from the start.

## What Changes

- Add a GitOps-managed observability stack based on existing open source components: Prometheus for metrics and alerting foundations, Grafana for dashboards, and Loki for structured log collection and query.
- Define OpenTelemetry Collector or Grafana Alloy as the future ingestion extension point for metrics, logs, and traces without implementing Tempo tracing in this change.
- Keep deployment ownership in `gitops/` and `k8s/`, avoiding a custom `apps/observability` service or bespoke log backend.
- Define platform-side scrape, logging, dashboard, and label conventions for the CthuTool backend, including a future `/metrics` endpoint contract that backend implementation can satisfy in a later change.
- Correct Kubernetes readiness planning so CthuTool workloads use `/health/ready` for readiness checks instead of treating `/health` as dependency readiness.
- Explicitly leave Tempo and end-to-end distributed tracing for a later phase.

## Capabilities

### New Capabilities

- `gitops-observability-stack`: GitOps-managed observability stack, platform integration points, label conventions, and readiness probe expectations for CthuTool Kubernetes deployments.

### Modified Capabilities

- `apps-backend-observability`: Clarify that the backend must expose a future Prometheus-compatible `/metrics` endpoint with bounded labels, while this change only defines platform-side integration and does not implement backend metrics.

## Impact

- Affected areas: `gitops/`, `k8s/`, and OpenSpec observability specifications.
- Expected future dependencies: upstream Helm charts or Kubernetes manifests for Prometheus, Grafana, Loki, and either OpenTelemetry Collector or Grafana Alloy.
- No new custom observability application under `apps/`.
- No business-code changes are required for this proposal except later backend work to expose `/metrics` and any minimal labels or annotations needed by platform discovery.
