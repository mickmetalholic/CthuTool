## MODIFIED Requirements

### Requirement: Homelab deployment documentation
The docs site SHALL document Kubernetes/GitOps as the official user-facing deployment path for CthuTool server-side services on a homelab machine.

#### Scenario: Reader deploys homelab services
- **WHEN** a reader follows the homelab deployment documentation
- **THEN** the documentation identifies Kubernetes or k3s prerequisites, ArgoCD prerequisites, GitOps namespace and Application resources, backend image delivery, Kubernetes service configuration, liveness and readiness health checks, metrics scraping, upgrade flow, and troubleshooting entry points

#### Scenario: Reader reviews GitOps observability behavior
- **WHEN** a reader follows deployment, operations, or reference docs for observability
- **THEN** the documentation identifies the GitOps-managed observability namespace, ArgoCD Applications, Prometheus metrics scrape path, Loki log collection path, Tempo trace storage path, and OpenTelemetry Collector ingestion path

### Requirement: OpenSpec capability index synchronization
The docs site SHALL keep the browsable OpenSpec capability index aligned with current specs under `openspec/specs/`.

#### Scenario: Observability specs exist
- **WHEN** observability-related specs are present under `openspec/specs/`
- **THEN** the docs capability index includes those specs
- **AND** operations or reference pages link to the relevant observability requirement sources

## ADDED Requirements

### Requirement: Observability operations documentation
The docs site SHALL document the operator-facing observability path for Kubernetes-managed CthuTool services.

#### Scenario: Operator checks backend health and metrics
- **WHEN** an operator opens observability or health operations docs
- **THEN** the docs distinguish `/health` liveness from `/health/ready` readiness
- **AND** they identify `/metrics` as the Prometheus scrape endpoint rather than a Kubernetes probe

#### Scenario: Operator reviews telemetry flow
- **WHEN** an operator reviews observability docs
- **THEN** the docs describe backend structured logs to Loki, Prometheus metrics, OTLP trace export through the OpenTelemetry Collector, and Tempo trace storage

#### Scenario: Operator reviews observability safety
- **WHEN** observability docs describe metrics, logs, or traces
- **THEN** the docs state that sensitive browser state and high-cardinality values must not become metric labels or log labels
