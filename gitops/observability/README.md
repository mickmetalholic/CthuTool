# Observability Stack

The observability stack is managed by Argo CD Applications under `gitops/apps/` and runs in the `observability` namespace.

## Components

| Component | GitOps Application | Upstream chart | Purpose |
|-----------|--------------------|----------------|---------|
| Prometheus and Grafana | `observability-kube-prometheus-stack` | `prometheus-community/kube-prometheus-stack` | Metrics collection, alerting foundation, dashboards, and Kubernetes workload views |
| Loki | `observability-loki` | `grafana/loki` | Structured log storage and query |
| Grafana Alloy | `observability-alloy` | `grafana/alloy` | Kubernetes stdout/stderr log collection into Loki |

The stack intentionally does not create an `apps/observability` service. It uses upstream open source components and keeps desired state in GitOps manifests.

## CthuTool Backend Metrics Boundary

The CthuTool backend is expected to expose a Prometheus-compatible `/metrics` endpoint in a later backend implementation change. This change only defines the platform-side discovery contract:

- Services opt in with `prometheus.io/scrape: "true"`.
- Prometheus scrapes the annotated path and port, currently `/metrics` on port `3000`.
- Prometheus attaches bounded labels: `namespace`, `app`, `component`, `service`, and `instance`.
- No alert in this change requires `/metrics` to exist yet, so the platform configuration can land before backend instrumentation.

Metric labels must not include request IDs, raw URLs, tokens, cookies, browser profile paths, screenshots, or user-provided free-form values.

## Logs

Alloy collects CthuTool pod stdout/stderr logs from Kubernetes and writes them to Loki. Loki labels are intentionally bounded to:

- `namespace`
- `app`
- `component`
- `pod`
- `container`

Correlation values such as request IDs, session IDs, URLs, and user-provided values must remain structured log fields, not Loki labels.

## Dashboards

The kube-prometheus-stack values include a starter Grafana dashboard named `CthuTool Kubernetes Workloads`. It includes:

- Backend scrape target status.
- Backend pod readiness.
- A Loki logs panel for `namespace="cthutool", app="cthutool", component="backend"`.

## Alert Rule Extension Point

Custom alert and recording rules should be added through the
`kube-prometheus-stack` chart's `additionalPrometheusRulesMap` values or a
future GitOps-managed `PrometheusRule` manifest that matches the chart-managed
Prometheus rule selector. Do not override the stack's default `ruleSelector`;
doing so can exclude kube-prometheus-stack's built-in rules.

Rules kept outside the chart values should use the project ownership label:

```yaml
observability.cthutool.io/rule-scope: platform
```

This label is for ownership and review; the Prometheus selector compatibility
must still be verified when the rule manifest is introduced.

## Future Telemetry Ingestion

Grafana Alloy is the reserved first telemetry ingestion point for future OTLP metrics, logs, and traces. This change only deploys Alloy for Kubernetes log collection. A later change should define any OTLP receiver ports, routing, sampling, authentication, retention, and trace storage.

Tempo is intentionally not deployed by this change. Trace storage, sampling, and trace dashboards belong in a separate tracing change.
