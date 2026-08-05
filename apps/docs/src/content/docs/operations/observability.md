---
title: Observability
description: Application-level metrics, logs, traces, and readiness for CthuTool services.
---

Use this page when operating CthuTool and you need to inspect service health beyond a single `/health` request. The cluster-wide observability platform is an external deployment platform responsibility; CthuOps may take it over later. CthuTool keeps application-level diagnostics so runtime behavior and local troubleshooting data are preserved.

## Application Diagnostics

The backend exposes diagnostics directly from its HTTP service:

```text
GET /health
GET /health/ready
GET /metrics
```

- `/health` is process liveness.
- `/health/ready` is dependency readiness.
- `/metrics` exposes Prometheus-compatible metrics in the text exposition format and is not a Kubernetes probe.

Backend structured logs are written to stdout/stderr as JSON records and remain available to local tooling or whatever external log collector is selected by the deployment platform. Correlation values such as request IDs, trace IDs, and command IDs remain structured log fields rather than storage-platform labels.

## Metrics

The backend exposes Prometheus metrics at `GET /metrics` through the existing backend HTTP service so an external metrics consumer can scrape it when configured. CthuTool does not require a particular GitOps-managed Prometheus stack; scraping and alerting are configured by the owning deployment platform.

## Logs

Backend logs are written to pod stdout/stderr as structured JSON records. Cluster log storage and collection (for example Loki or Grafana Alloy) are configured by the owning operations platform and are not part of CthuTool's source repository.

## Traces

The backend exports OpenTelemetry traces only when an OTLP endpoint is configured in its environment (`OTEL_SDK_DISABLED=true` disables tracing entirely). The deployment platform configures any collector and trace backend; CthuTool keeps the optional trace export code but does not own collector or Tempo deployment state.

## Dashboards and Alerts

Dashboards and alert rules for the Backend are owned by the deployment platform (for example CthuOps) using the retained Backend health and metrics contracts. CthuTool no longer provisions Grafana dashboards, Prometheus alert rules, or notification receivers.

## Safety Boundary

Observability output must not expose cookies, tokens, authorization headers, localStorage, sessionStorage, Playwright storage-state contents, raw screenshots, raw HTML, local profile paths, raw URLs as labels, or unbounded user-provided values as labels.

Requirement sources:

- `openspec/specs/apps-backend-observability/spec.md`
- `openspec/specs/apps-runtime-structured-logs/spec.md`
- `openspec/specs/packages-config-observability/spec.md`
