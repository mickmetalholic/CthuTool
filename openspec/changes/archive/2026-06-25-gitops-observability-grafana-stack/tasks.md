## 1. Stack Placement

- [x] 1.1 Confirm the implementation approach for upstream components: Argo CD chart Applications, checked-in rendered manifests, or a minimal documented combination under `gitops/`.
- [x] 1.2 Add or update GitOps namespace resources for the observability stack with Kubernetes recommended labels and Argo CD ownership labels.
- [x] 1.3 Add GitOps stack entry points for Prometheus, Grafana, and Loki without creating an `apps/observability` service.

## 2. Prometheus Integration

- [x] 2.1 Configure Prometheus deployment values or manifests with conservative retention, internal-cluster exposure, and an alert-rule extension point.
- [x] 2.2 Add platform-side CthuTool backend scrape discovery for a future `/metrics` endpoint using bounded labels and tolerating the endpoint being absent until backend implementation lands.
- [x] 2.3 Document the backend `/metrics` follow-up boundary in the relevant GitOps or Kubernetes README so implementation does not happen implicitly in this change.

## 3. Grafana and Loki

- [x] 3.1 Configure Grafana with Prometheus and Loki data sources through GitOps-managed configuration.
- [x] 3.2 Add starter Grafana dashboard configuration for CthuTool Kubernetes workload health or Prometheus target status.
- [x] 3.3 Configure Loki log collection from Kubernetes stdout/stderr with bounded labels for namespace, app, component, pod, and container.
- [x] 3.4 Ensure structured log correlation values such as request IDs remain log fields and are not promoted to Loki labels.

## 4. Collector Extension Point

- [x] 4.1 Add a documented OpenTelemetry Collector or Grafana Alloy ingestion entry point for future OTLP metrics, logs, and traces.
- [x] 4.2 Explicitly leave Tempo manifests, trace storage, sampling, and trace dashboards out of this change.

## 5. CthuTool Kubernetes Workload Integration

- [x] 5.1 Update `k8s/deployment.yaml` so backend readiness probes use `/health/ready` while liveness remains `/health`.
- [x] 5.2 Add or confirm stable Kubernetes labels and annotations needed for Prometheus scrape discovery and Loki/Grafana workload filtering.
- [x] 5.3 Keep any workload changes limited to deployment metadata, probes, and platform integration; do not modify backend business logic in this change.

## 6. Verification

- [x] 6.1 Run `openspec validate gitops-observability-grafana-stack --strict`.
- [x] 6.2 Validate changed Kubernetes and GitOps YAML with the repository's available manifest validation command or a documented fallback such as `kubectl apply --dry-run=client`.
- [x] 6.3 Confirm `git diff -- .claude .codex .cursor` is empty unless adapter regeneration was explicitly requested.
- [x] 6.4 Confirm no neighboring OpenSpec changes were modified, archived, or synced.
