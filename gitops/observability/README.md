# Observability Stack

The observability stack is managed by Argo CD Applications under `gitops/apps/` and runs in the `observability` namespace.

## Components

| Component | GitOps Application | Upstream chart | Purpose |
|-----------|--------------------|----------------|---------|
| Prometheus and Grafana | `observability-kube-prometheus-stack` | `prometheus-community/kube-prometheus-stack` | Metrics collection, alerting foundation, dashboards, and Kubernetes workload views |
| Loki | `observability-loki` | `grafana/loki` | Structured log storage and query |
| Grafana Alloy | `observability-alloy` | `grafana/alloy` | Kubernetes stdout/stderr log collection into Loki |
| Tempo | `observability-tempo` | `grafana/tempo` | Trace storage and query |
| OpenTelemetry Collector | `observability-otel-collector` | `open-telemetry/opentelemetry-collector` | OTLP trace ingestion and forwarding to Tempo |

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

## Traces

Backend traces are exported through OpenTelemetry only when the backend has an
OTLP endpoint configured. In Kubernetes, the backend sends OTLP HTTP traces to:

```text
http://otel-collector.observability.svc.cluster.local:4318
```

The collector accepts OTLP HTTP and gRPC and forwards trace data to Tempo. This
keeps app configuration stable while Tempo remains an internal trace store.
Prometheus remains the metrics path and Loki remains the log path; traces do not
replace either.

## Dashboards

The kube-prometheus-stack values include a starter Grafana dashboard named `CthuTool Kubernetes Workloads`. It includes:

- Backend scrape target status.
- Backend pod readiness.
- A Loki logs panel for `namespace="cthutool", app="cthutool", component="backend"`.

Grafana data sources include Prometheus, Loki, and Tempo. The Tempo data source
is configured with a logs link through the Loki data source so trace IDs can be
used to pivot into backend structured logs when those fields are present.

## Alert Rule Extension Point

CthuTool-specific alert rules are managed through the `kube-prometheus-stack`
chart's `additionalPrometheusRulesMap` values. The first rule group covers:

- backend scrape target down for 5 minutes
- backend readiness degraded for 5 minutes
- backend HTTP error rate above 5% for 10 minutes
- backend HTTP p95 latency above 2 seconds for 10 minutes
- browser task timeout activity for 10 minutes
- desktop agent command timeout or unavailable activity for 10 minutes

These thresholds are intentionally conservative starting points and should be
tuned after real operational data is available. Alertmanager is enabled, but
environment-specific notification receivers such as email, Slack, PagerDuty, or
webhooks are not configured in this repository yet.

Future standalone `PrometheusRule` manifests must match the chart-managed
Prometheus rule selector. Do not override the stack's default `ruleSelector`;
doing so can exclude kube-prometheus-stack's built-in rules.

Rules kept outside the chart values should use the project ownership label:

```yaml
observability.cthutool.io/rule-scope: platform
```

This label is for ownership and review; the Prometheus selector compatibility
must still be verified when the rule manifest is introduced.

## Telemetry Ingestion

Grafana Alloy collects Kubernetes stdout/stderr logs into Loki. The
OpenTelemetry Collector is the OTLP ingestion point for backend traces and
forwards them to Tempo. Do not send raw client payloads, logs, or metrics through
the trace pipeline without a separate design update.
