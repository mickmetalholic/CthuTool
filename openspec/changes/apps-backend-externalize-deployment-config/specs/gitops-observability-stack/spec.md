## REMOVED Requirements

### Requirement: GitOps-managed observability stack
**Reason**: CthuTool no longer manages a cluster-wide Prometheus, Grafana, Loki, Tempo, Alloy, or OpenTelemetry Collector stack.
**Migration**: If the homelab needs a platform observability stack, define and operate it from CthuOps or another dedicated operations repository.

### Requirement: Prometheus metrics integration
**Reason**: Platform-side scraping is no longer a CthuTool GitOps responsibility.
**Migration**: External operations configuration may scrape the Backend's retained `/metrics` endpoint when a metrics platform is selected.

### Requirement: Grafana dashboards and data sources
**Reason**: Grafana data-source and dashboard provisioning belongs to the external operations platform.
**Migration**: Recreate any required dashboards in the repository that owns Grafana.

### Requirement: Loki structured log collection
**Reason**: CthuTool no longer selects or provisions a log storage and collection backend.
**Migration**: External operations may collect the retained structured stdout/stderr records using its chosen log system.

### Requirement: Telemetry collector extension point
**Reason**: OpenTelemetry Collector and Tempo deployment are no longer managed in CthuTool.
**Migration**: Keep Backend tracing optional and configure an external OTLP endpoint only from the owning deployment environment.

### Requirement: Kubernetes readiness probe semantics
**Reason**: Kubernetes probe manifests are no longer maintained in CthuTool.
**Migration**: CthuOps retains `/health` and `/health/ready` probe usage in its Backend Deployment.

### Requirement: CthuTool Prometheus alert rules
**Reason**: Cluster alert rules and notification policy are no longer part of CthuTool's deployment contract.
**Migration**: Define alerts from the external metrics platform using the retained Backend metrics and health contracts.
