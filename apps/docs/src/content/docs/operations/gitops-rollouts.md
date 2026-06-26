---
title: GitOps Rollouts
description: ArgoCD sync, retry, drift correction, rollout checks, and backend probes.
---

Use this page when a backend change has landed on `main` or when the cluster state does not match git.

## Rollout Flow

1. GitHub Actions builds `apps/backend/Dockerfile`.
2. The workflow pushes `ghcr.io/mickmetalholic/cthutool-backend:main` and `ghcr.io/mickmetalholic/cthutool-backend:<commit-sha>`.
3. The workflow commits the new image tag into `k8s/deployment.yaml`.
4. ArgoCD reconciles `gitops/apps/cthutool/application.yaml`, which points at `main` and path `k8s/`.
5. Kubernetes rolls out `Deployment/cthutool-backend`.

## ArgoCD Sync State

Check the Application object:

```bash
kubectl -n argocd get application cthutool
kubectl -n argocd describe application cthutool
```

The CthuTool Application enables:

- automated sync
- prune
- self-heal
- retry limit `5`
- retry backoff from `5s` up to `3m`

If sync is delayed, first confirm the commit with the image pin is present on `main`, then inspect the Application status.

## Drift Correction

ArgoCD owns the live Kubernetes resources. Manual edits such as `kubectl edit deployment/cthutool-backend` or `kubectl set image` are temporary and should be expected to revert.

Make durable changes in:

- `k8s/configmap.yaml` for backend environment values
- `k8s/deployment.yaml` for image, resources, and probes
- `k8s/service.yaml` for Service shape
- `gitops/apps/observability-*` for observability stack Applications
- `gitops/apps/cthutool/application.yaml` for ArgoCD sync behavior

## Kubernetes Rollout Checks

Use Kubernetes rollout state for backend health during deploys:

```bash
kubectl -n cthutool rollout status deployment/cthutool-backend
kubectl -n cthutool get pods -l app.kubernetes.io/name=cthutool-backend
kubectl -n cthutool describe deployment cthutool-backend
```

Read pod logs when the rollout does not become ready:

```bash
kubectl -n cthutool logs deployment/cthutool-backend
```

## Health Probes and Metrics

The backend Deployment separates process liveness from dependency readiness:

- liveness uses `GET /health`, starts after 10 seconds, and runs every 15 seconds
- readiness uses `GET /health/ready`, starts after 5 seconds, and runs every 5 seconds
- both use timeout 3 seconds and failure threshold 3

For an admin check without ingress:

```bash
kubectl -n cthutool port-forward service/cthutool-backend 3000:3000
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
curl http://localhost:3000/metrics
```

Prometheus scrapes `/metrics` through Service annotations in `k8s/service.yaml`. `/metrics` is not used as a Kubernetes probe.

## Image Pin Troubleshooting

If a backend change exists but the cluster still runs an older image:

1. Check the backend image workflow for the `main` commit.
2. Confirm GHCR has the commit tag.
3. Confirm `k8s/deployment.yaml` on `main` references that commit tag.
4. Inspect ArgoCD Application sync status.
5. Check the Kubernetes Deployment rollout and pod events.
