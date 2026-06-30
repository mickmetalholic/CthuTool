# gitops-observability-stack Specification

## Purpose
Define the GitOps-managed Kubernetes observability stack for CthuTool, including metrics, dashboards, log collection, platform integration boundaries, and future telemetry ingestion extension points.

## Requirements
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

### Requirement: Prometheus metrics integration
The observability stack SHALL provide platform-side Prometheus scrape integration for CthuTool workloads without requiring this change to implement backend metrics.

#### Scenario: Backend scrape contract is discoverable
- **WHEN** Prometheus scrape configuration for the CthuTool backend is inspected
- **THEN** it targets a future backend `/metrics` endpoint
- **AND** it uses bounded workload identity labels such as namespace, app, component, service, and instance
- **AND** it does not require backend business-code changes in this platform change

#### Scenario: Alerting foundation exists
- **WHEN** Prometheus configuration is inspected
- **THEN** it includes an extension point for alert rules
- **AND** initial alert rules can be added without changing backend application code

### Requirement: Grafana dashboards and data sources
The observability stack SHALL configure Grafana to query Prometheus metrics, Loki logs, and Tempo traces for CthuTool operational views.

#### Scenario: Grafana data sources are configured
- **WHEN** Grafana configuration is inspected
- **THEN** Prometheus is available as a metrics data source
- **AND** Loki is available as a logs data source
- **AND** Tempo is available as a traces data source

### Requirement: Loki structured log collection
The observability stack SHALL collect structured CthuTool Kubernetes logs into Loki using bounded labels and queryable structured fields.

#### Scenario: Kubernetes logs are collected
- **WHEN** CthuTool backend pods emit structured logs to stdout or stderr
- **THEN** Loki ingestion collects those logs from Kubernetes workload output
- **AND** Grafana can query them by namespace, app, component, pod, and container labels

#### Scenario: High-cardinality values stay out of labels
- **WHEN** logs contain request identifiers, session identifiers, URLs, or user-provided values
- **THEN** those values remain structured log fields
- **AND** they are not promoted to Loki labels

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

### Requirement: Kubernetes readiness probe semantics
CthuTool Kubernetes readiness checks SHALL use the backend readiness endpoint instead of the liveness endpoint.

#### Scenario: Readiness probe uses dependency readiness
- **WHEN** the CthuTool backend Deployment readiness probe is inspected
- **THEN** the readiness probe path is `/health/ready`
- **AND** `/health` remains available for process liveness checks

#### Scenario: Readiness is represented separately from metrics
- **WHEN** Prometheus scrape or alerting configuration is inspected
- **THEN** readiness probe configuration remains separate from metrics scraping
- **AND** `/metrics` is not used as a Kubernetes readiness probe

### Requirement: CthuTool Prometheus alert rules
The GitOps-managed observability stack SHALL define CthuTool-specific Prometheus alert rules for backend availability, readiness, latency, error rate, browser task timeout, and desktop agent command failure signals using existing metrics and bounded labels.

#### Scenario: Backend target alert is configured
- **WHEN** the kube-prometheus-stack GitOps Application values are inspected
- **THEN** they include an alert that fires when the CthuTool backend scrape target is down for a sustained window

#### Scenario: Backend readiness alert is configured
- **WHEN** backend readiness metrics report degraded state for a sustained window
- **THEN** Prometheus has a CthuTool alert rule that can notify Alertmanager of readiness degradation

#### Scenario: Backend request health alerts are configured
- **WHEN** backend HTTP request metrics show elevated error rate or high p95 latency
- **THEN** Prometheus has CthuTool alert rules for those symptoms using bounded metric labels

#### Scenario: Browser and agent operation alerts are configured
- **WHEN** browser task timeout metrics or agent command unavailable/timeout metrics are observed for a sustained window
- **THEN** Prometheus has CthuTool alert rules for those operational symptoms

#### Scenario: Notification receivers are deferred
- **WHEN** CthuTool alert rules are configured
- **THEN** they do not require environment-specific Alertmanager receiver secrets or external notification endpoints in this change
