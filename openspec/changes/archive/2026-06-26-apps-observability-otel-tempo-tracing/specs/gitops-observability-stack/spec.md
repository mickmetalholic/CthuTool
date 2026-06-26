## MODIFIED Requirements

### Requirement: GitOps-managed observability stack
The repository SHALL define a GitOps-managed observability stack for the Kubernetes cluster using existing open source components rather than a custom CthuTool observability or logging service.

#### Scenario: Stack components are declared
- **WHEN** the observability GitOps manifests are inspected
- **THEN** they declare Prometheus for metrics collection and alerting foundations
- **AND** they declare Grafana for dashboards
- **AND** they declare Loki for structured log collection and query
- **AND** they declare Tempo for trace storage
- **AND** they declare an OpenTelemetry Collector for OTLP trace ingestion
- **AND** they do not declare a custom `apps/observability` service

### Requirement: Grafana dashboards and data sources
The observability stack SHALL configure Grafana to query Prometheus metrics, Loki logs, and Tempo traces for CthuTool operational views.

#### Scenario: Grafana data sources are configured
- **WHEN** Grafana configuration is inspected
- **THEN** Prometheus is available as a metrics data source
- **AND** Loki is available as a logs data source
- **AND** Tempo is available as a traces data source

### Requirement: Telemetry collector extension point
The observability stack SHALL provide an OpenTelemetry Collector ingestion point for backend trace export while keeping metrics and logs on their existing Prometheus and Loki paths.

#### Scenario: Collector accepts backend traces
- **WHEN** observability configuration is inspected
- **THEN** an OpenTelemetry Collector is configured with OTLP HTTP and gRPC receivers
- **AND** its trace pipeline exports to Tempo
- **AND** it does not require backend metrics or logs to be exported through OpenTelemetry

#### Scenario: Tempo stores traces
- **WHEN** observability configuration is inspected
- **THEN** Tempo is deployed through GitOps
- **AND** Tempo accepts OTLP trace export from the collector
- **AND** trace retention is bounded for the starter deployment
