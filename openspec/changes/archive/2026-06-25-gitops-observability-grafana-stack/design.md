## Context

CthuTool already defines application observability semantics for backend, web, desktop, and shared packages, and the backend already distinguishes `/health` from `/health/ready`. The Kubernetes deployment still uses `/health` for readiness, and the GitOps layer does not yet provide a cluster observability stack for metrics, dashboards, or structured log search.

The implementation should stay in `gitops/` and `k8s/` and use established upstream components. This avoids creating an `apps/observability` service, keeps logs in standard Kubernetes stdout/stderr pipelines, and leaves business-code metrics implementation for a later backend change. Project policy remains in OpenSpec config and `AGENTS.md`; generated agent adapter folders are not part of this change.

## Goals / Non-Goals

**Goals:**

- Define a GitOps-managed observability baseline using Prometheus, Grafana, and Loki.
- Provide platform-side scrape, dashboard, log query, and label conventions for CthuTool workloads.
- Reserve an OpenTelemetry Collector or Grafana Alloy ingestion point so future metrics, logs, and traces have a clear landing zone.
- Fix or plan the CthuTool Kubernetes readiness probe to use `/health/ready`.
- Record that backend must expose a Prometheus-compatible `/metrics` endpoint in a future backend implementation change.

**Non-Goals:**

- Do not build a custom logging or observability app under `apps/`.
- Do not implement Tempo or end-to-end distributed tracing in this change.
- Do not modify backend business logic or instrumentation beyond any minimal deployment labels or annotations needed for platform discovery.
- Do not archive, sync, or edit neighboring OpenSpec changes.

## Decisions

### Use upstream Grafana ecosystem components

The platform stack will use Prometheus for metrics and alerting foundations, Grafana for dashboards, and Loki for structured log storage and querying.

Alternatives considered:

- A custom log API or app: rejected because it would duplicate Loki and violate the requirement to avoid self-built log services.
- Cloud-only hosted observability: deferred because the GitOps baseline should be reproducible in the cluster and not require a vendor-specific control plane.

### Manage the stack through GitOps manifests

The stack should be represented under `gitops/` with any CthuTool workload integration in `k8s/`. Implementation can use Helm-rendered manifests, Argo CD Applications that reference chart sources, or checked-in Kubernetes manifests, but the desired state must be visible to GitOps and reviewable in the repository.

Alternatives considered:

- Manual cluster installation: rejected because it cannot be reviewed or reconciled through GitOps.
- Embedding observability resources into backend app code: rejected because the platform stack is cluster infrastructure, not application behavior.

### Keep metrics pull-based first

Prometheus will scrape CthuTool backend metrics once the backend exposes `/metrics`. This change defines the discovery contract through labels, annotations, or ServiceMonitor-style resources, but backend endpoint implementation remains a later task.

Alternatives considered:

- Push metrics directly from the backend: deferred because it would require application code changes and a push gateway or collector decision before the platform baseline exists.
- Implement backend metrics now: rejected to keep this change scoped to platform integration.

### Collect logs from Kubernetes workload output

Loki ingestion should collect structured JSON logs emitted to pod stdout/stderr and attach bounded Kubernetes labels such as namespace, app, component, pod, and container. High-cardinality values such as request IDs belong in log fields, not Loki labels.

Alternatives considered:

- File-based log sidecars per application: rejected because Kubernetes stdout collection is the simpler baseline.
- Storing logs in Prometheus: rejected because Prometheus is for metrics and alerts, not log search.

### Reserve Collector or Alloy without Tempo

The stack will leave a documented OpenTelemetry Collector or Grafana Alloy endpoint for future OTLP metrics, logs, and traces. Tempo deployment and trace dashboards remain out of scope until a dedicated tracing change defines retention, sampling, storage, and application instrumentation.

Alternatives considered:

- Deploy Tempo immediately: rejected because the current goal is metrics, dashboards, and logs, and tracing would broaden the implementation and operational surface.

## Risks / Trade-offs

- [Risk] Helm chart defaults may expose more storage, retention, or RBAC surface than the cluster needs. → Mitigation: keep values files explicit and review retention, persistence, service exposure, and RBAC before applying.
- [Risk] Loki labels can become high-cardinality if request or session identifiers are promoted to labels. → Mitigation: specify bounded label conventions and keep correlation identifiers as structured log fields.
- [Risk] Prometheus scrape configuration may be added before backend `/metrics` exists. → Mitigation: make scrape resources tolerate absent targets and track backend metrics as a follow-up task boundary.
- [Risk] Readiness probe changes can affect rollout behavior. → Mitigation: use existing `/health/ready` semantics and verify manifests before rollout.
- [Risk] Deferring Tempo means traces will not be queryable after this change. → Mitigation: document the Collector or Alloy ingestion point and leave Tempo for a focused follow-up change.

## Migration Plan

1. Add GitOps manifests for the observability namespace and stack Applications or rendered manifests.
2. Configure Prometheus, Grafana, and Loki with conservative retention and internal-cluster access by default.
3. Add Grafana data sources and initial dashboards for Kubernetes workload health, Prometheus target status, and Loki log exploration.
4. Add CthuTool workload labels, scrape discovery stubs, and readiness probe changes in `k8s/`.
5. Validate OpenSpec deltas and Kubernetes manifests.
6. Roll back by reverting the GitOps stack manifests and readiness probe change; no persistent business data migration is required by this proposal.

## Open Questions

- Should the implementation prefer kube-prometheus-stack plus Loki chart Applications, or checked-in rendered manifests for this cluster?
- Should the reserved telemetry ingress be OpenTelemetry Collector, Grafana Alloy, or both as alternatives documented behind one GitOps entry point?
- What retention and storage class should be used for Prometheus and Loki in the first deployment?
