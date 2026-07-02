---
title: GitOps Reference
description: GitOps directories, Kubernetes resources, ArgoCD Applications, and backend image delivery.
---

Use this page as a path and resource lookup for the homelab deployment model.

## Directory Structure

| Path | Purpose |
| --- | --- |
| `gitops/README.md` | Cluster GitOps conventions and manual bootstrap notes |
| `gitops/namespaces/` | Namespace resources, one file per deployed app |
| `gitops/apps/<app-name>/application.yaml` | ArgoCD Application CR for each app |
| `gitops/observability/` | Observability stack docs, dashboard notes, and alert rule extension points |
| `gitops/bootstrap/` | Placeholder for future ArgoCD self-management manifests |
| `k8s/` | CthuTool backend Kubernetes resources consumed by the `cthutool` Application |

## CthuTool GitOps Resources

| Resource | Source |
| --- | --- |
| Namespace `cthutool` | `gitops/namespaces/cthutool.yaml` |
| Application `cthutool` | `gitops/apps/cthutool/application.yaml` |
| ConfigMap `cthutool-backend` | `k8s/configmap.yaml` |
| Deployment `cthutool-backend` | `k8s/deployment.yaml` |
| Service `cthutool-backend` | `k8s/service.yaml` |

## Observability GitOps Resources

| Resource | Source |
| --- | --- |
| Namespace `observability` | `gitops/namespaces/observability.yaml` |
| Prometheus and Grafana Application | `gitops/apps/observability-kube-prometheus-stack/application.yaml` |
| Loki Application | `gitops/apps/observability-loki/application.yaml` |
| Grafana Alloy Application | `gitops/apps/observability-alloy/application.yaml` |
| Tempo Application | `gitops/apps/observability-tempo/application.yaml` |
| OpenTelemetry Collector Application | `gitops/apps/observability-otel-collector/application.yaml` |

The observability stack uses upstream Helm charts and does not add a custom `apps/observability` service. See `gitops/observability/README.md` for dashboard, alert-rule, and telemetry-ingestion boundaries.

The Application points to:

```text
repoURL: https://github.com/mickmetalholic/CthuTool
targetRevision: main
path: k8s/
destination.namespace: cthutool
```

## Sync Policy

The CthuTool Application enables automated sync with prune and self-heal:

```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: true
  retry:
    limit: 5
    backoff:
      duration: 5s
      factor: 2
      maxDuration: 3m
```

Manual cluster edits are drift. Make durable changes in git and let ArgoCD reconcile them.

## Backend Image Delivery

The `Backend Image` workflow builds and publishes the backend container when backend image inputs change on `main`.

Outputs:

- `ghcr.io/mickmetalholic/cthutool-backend:main`
- `ghcr.io/mickmetalholic/cthutool-backend:<commit-sha>`

`k8s/deployment.yaml` references `ghcr.io/mickmetalholic/cthutool-backend:main` with `imagePullPolicy: Always`. The workflow does not rewrite or commit this manifest after publishing; automatic redeploys require Argo CD Image Updater with digest tracking or an equivalent rollout trigger.

## Requirement Sources

- `openspec/specs/apps-backend-image-ci/spec.md`
- `openspec/specs/gitops-argo-applications/spec.md`
- `openspec/specs/gitops-bootstrap/spec.md`
- `openspec/specs/gitops-cluster-namespaces/spec.md`
- `openspec/specs/gitops-observability-stack/spec.md`
- `openspec/specs/apps-docs-site/spec.md`
