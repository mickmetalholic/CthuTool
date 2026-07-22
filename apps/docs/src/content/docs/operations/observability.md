---
title: Observability
description: Metrics, logs, traces, readiness, and dashboards for Kubernetes-managed CthuTool services.
---

Use this page when operating CthuTool in Kubernetes and you need to inspect service health beyond a single `/health` request.

## Stack Components

The observability stack is managed by ArgoCD Applications under `gitops/apps/` and runs in the `observability` namespace.

| Component | Application | Purpose |
| --- | --- | --- |
| Prometheus and Grafana | `observability-kube-prometheus-stack` | Metrics collection, alerting foundation, dashboards, and Kubernetes workload views |
| Loki | `observability-loki` | Structured log storage and query |
| Grafana Alloy | `observability-alloy` | Kubernetes stdout/stderr log collection into Loki |
| Tempo | `observability-tempo` | Trace storage and query |
| OpenTelemetry Collector | `observability-otel-collector` | OTLP trace ingestion and forwarding to Tempo |

Source details live in `gitops/observability/README.md`.

## Health and Readiness

The backend exposes separate health endpoints:

```text
GET /health
GET /health/ready
```

`/health` is process liveness. Kubernetes uses it for the liveness probe.

`/health/ready` is dependency readiness. Kubernetes uses it for the readiness probe so degraded dependencies can keep a pod out of Service traffic without treating the process as dead.

## Metrics

The backend exposes Prometheus metrics at:

```text
GET /metrics
```

`k8s/service.yaml` opts the backend Service into scraping with annotations:

```yaml
prometheus.io/scrape: "true"
prometheus.io/path: /metrics
prometheus.io/port: "3000"
```

`/metrics` is not a Kubernetes probe. Use `/health` and `/health/ready` for probes.

## Logs

Backend logs are written to pod stdout/stderr. Grafana Alloy collects Kubernetes logs and writes them to Loki.

Use bounded Loki labels for lookup:

```text
namespace
app
component
pod
container
```

Request IDs, trace IDs, command IDs, URLs, session IDs, and user-provided values should remain structured log fields rather than Loki labels.

## Traces

The backend exports OpenTelemetry traces when an OTLP endpoint is configured. In Kubernetes, `k8s/configmap.yaml` points the backend at:

```text
http://otel-collector.observability.svc.cluster.local:4318
```

The OpenTelemetry Collector accepts OTLP HTTP and gRPC and forwards traces to Tempo. Prometheus remains the metrics path and Loki remains the log path.

## Dashboards and Alerts

The kube-prometheus-stack values include a starter Grafana dashboard for CthuTool Kubernetes workloads. The current alert rule foundation covers backend target availability, readiness degradation, HTTP error rate, HTTP p95 latency, browser task timeouts, and local Agent command failures.

Notification receivers such as email, Slack, PagerDuty, or webhooks are environment-specific and are not configured by this repository.

## Safety Boundary

Observability output must not expose cookies, tokens, authorization headers, localStorage, sessionStorage, Playwright storage-state contents, raw screenshots, raw HTML, local profile paths, raw URLs as labels, or unbounded user-provided values as labels.

Requirement sources:

- `openspec/specs/apps-backend-observability/spec.md`
- `openspec/specs/apps-runtime-structured-logs/spec.md`
- `openspec/specs/gitops-observability-stack/spec.md`
- `openspec/specs/packages-config-observability/spec.md`
