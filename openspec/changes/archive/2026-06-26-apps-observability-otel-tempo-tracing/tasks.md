## 1. OpenSpec Contract

- [x] 1.1 Define GitOps Tempo and OTel Collector requirements.
- [x] 1.2 Define backend OpenTelemetry trace export requirements.

## 2. GitOps Tracing Stack

- [x] 2.1 Add a Tempo Argo CD Application.
- [x] 2.2 Add an OpenTelemetry Collector Argo CD Application configured for OTLP traces to Tempo.
- [x] 2.3 Add Tempo as a Grafana data source.
- [x] 2.4 Configure backend Kubernetes OTLP environment variables.
- [x] 2.5 Document tracing topology and operational boundaries.

## 3. Backend Trace Export

- [x] 3.1 Add backend OpenTelemetry SDK/exporter dependencies.
- [x] 3.2 Add backend tracing bootstrap that starts only when OTLP export is configured.
- [x] 3.3 Initialize tracing before Nest application creation.
- [x] 3.4 Add backend tests for tracing enablement and bootstrap wiring.

## 4. Verification

- [x] 4.1 Add contract tests for Tempo, OTel Collector, Grafana datasource, and backend OTLP env configuration.
- [x] 4.2 Run affected backend tests and typecheck.
- [x] 4.3 Run tracing contract tests.
- [x] 4.4 Run `openspec validate apps-observability-otel-tempo-tracing --strict`.
