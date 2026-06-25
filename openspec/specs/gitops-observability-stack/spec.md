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
- **AND** they do not declare a custom `apps/observability` service

#### Scenario: Stack is reconciled through GitOps
- **WHEN** the cluster desired state is reviewed
- **THEN** observability stack resources are represented under `gitops/`
- **AND** CthuTool workload integration resources are represented under `k8s/` when they belong to the CthuTool application deployment

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
The observability stack SHALL configure Grafana to query Prometheus metrics and Loki logs for CthuTool operational views.

#### Scenario: Grafana data sources are configured
- **WHEN** Grafana configuration is inspected
- **THEN** Prometheus is available as a metrics data source
- **AND** Loki is available as a logs data source

#### Scenario: Starter dashboards are available
- **WHEN** Grafana dashboards are inspected
- **THEN** at least one dashboard surfaces Kubernetes workload health or Prometheus target status for CthuTool
- **AND** at least one dashboard or explore link supports querying CthuTool structured logs from Loki

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
The observability stack SHALL reserve an OpenTelemetry Collector or Grafana Alloy ingestion point for future telemetry pipelines without requiring Tempo tracing in this change.

#### Scenario: Collector ingress is reserved
- **WHEN** observability configuration is inspected
- **THEN** it documents or declares where future OTLP metrics, logs, and traces can be sent
- **AND** it identifies whether the first supported collector path is OpenTelemetry Collector, Grafana Alloy, or both

#### Scenario: Tempo is deferred
- **WHEN** the observability stack for this change is inspected
- **THEN** it does not require Tempo to be deployed
- **AND** trace storage, sampling, and trace dashboards are left for a later tracing change

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
