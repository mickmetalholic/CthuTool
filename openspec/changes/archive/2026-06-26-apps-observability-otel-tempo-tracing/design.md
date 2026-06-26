## Context

Prometheus already scrapes backend metrics, Loki already stores backend JSON logs, and Grafana already provides dashboards. Tracing should extend this stack rather than replacing it. Tempo is the natural trace backend for the existing Grafana stack, while an OpenTelemetry Collector gives applications a stable OTLP endpoint and keeps Tempo-specific details out of app configuration.

## Goals / Non-Goals

**Goals:**

- Add Tempo as the trace store.
- Add OpenTelemetry Collector as the cluster OTLP trace ingestion endpoint.
- Add Grafana Tempo data source configuration.
- Configure backend pods with OTLP trace export environment variables.
- Start backend OpenTelemetry Node SDK only when an OTLP endpoint is configured.
- Preserve existing Prometheus and Loki paths.

**Non-Goals:**

- Do not move metrics to OpenTelemetry.
- Do not move logs to OpenTelemetry.
- Do not add browser, Desktop, or CLI tracing in this change.
- Do not require tracing to be enabled in local development.

## Decisions

### Use OTel Collector between backend and Tempo

The backend sends OTLP HTTP traces to `otel-collector` in the observability namespace. The collector forwards trace data to Tempo. This keeps application configuration stable if Tempo topology changes later.

### Use Tempo single-binary chart first

The project is currently running single-binary Loki and a small single-replica backend. Tempo single binary is enough for the first trace storage path and can be replaced with `tempo-distributed` later without changing app instrumentation.

### Keep tracing opt-in by endpoint

The backend starts OpenTelemetry only when `OTEL_EXPORTER_OTLP_ENDPOINT` or `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` is set and `OTEL_SDK_DISABLED` is not true. This avoids extra local development behavior and keeps tests deterministic.

## Risks / Trade-offs

- [Risk] Auto instrumentation must be initialized early. -> Mitigation: initialize tracing before creating the Nest application.
- [Risk] Trace volume can grow quickly. -> Mitigation: send traces through collector/Tempo with bounded retention and defer broader client tracing.
- [Risk] Chart defaults can expose unneeded pipelines. -> Mitigation: configure collector with traces-only OTLP receiver, batch processor, and Tempo exporter.

## Migration Plan

1. Add GitOps applications for Tempo and OTel Collector.
2. Add Tempo datasource to Grafana.
3. Add backend OTLP environment variables.
4. Add backend tracing bootstrap and tests.
5. Add contract tests for tracing GitOps configuration.
6. Validate OpenSpec and affected tests/typechecks.

Rollback removes the backend OTLP environment variables and tracing GitOps applications. Metrics and logs continue to work independently.
