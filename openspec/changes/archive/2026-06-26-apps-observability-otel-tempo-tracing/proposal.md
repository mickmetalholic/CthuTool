## Why

CthuTool now has metrics, logs, dashboards, alert rules, and client event ingestion, but request-level causality is still limited to log fields. Backend request handling, browser task execution, and agent command dispatch need trace IDs and spans that can be queried in Grafana alongside logs and metrics.

## What Changes

- Deploy Grafana Tempo as the trace store through GitOps.
- Deploy an OpenTelemetry Collector as the OTLP ingestion point through GitOps.
- Add Tempo as a Grafana data source.
- Configure the backend Kubernetes workload to export OTLP traces to the collector.
- Initialize the backend OpenTelemetry Node SDK when an OTLP endpoint is configured.
- Keep metrics on the existing Prometheus path and logs on the existing Loki stdout/stderr path.

## Capabilities

### Modified Capabilities

- `gitops-observability-stack`: Adds Tempo trace storage, OTel Collector trace ingestion, and Grafana trace data source configuration.
- `apps-backend-observability`: Adds backend OpenTelemetry trace export while preserving existing metrics/logs behavior.

## Impact

- Affected code: backend package dependencies, bootstrap tracing initialization, and tests.
- Affected platform: GitOps applications for Tempo and OTel Collector; backend deployment environment variables.
- Runtime behavior: backend exports traces only when OTLP configuration is present.
- Non-goals: no client-side browser tracing, no log export through OTel, no Prometheus metrics migration to OTel, and no custom tracing storage service.
