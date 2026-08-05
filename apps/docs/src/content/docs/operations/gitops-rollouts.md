---
title: GitOps Rollouts
description: CthuOps ArgoCD sync, digest promotion, rollout checks, and backend probes.
---

Use this page when a backend change has landed on `main` or when the cluster state does not match git. The cluster rollout path is owned by the separate **CthuOps** repository.

## Rollout Flow

1. GitHub Actions in CthuTool builds `apps/backend/Dockerfile`.
2. The workflow pushes `ghcr.io/mickmetalholic/cthutool-backend:main` and `ghcr.io/mickmetalholic/cthutool-backend:<commit-sha>`.
3. An operator opens a digest-pin pull request in CthuOps that updates `images[].digest` in `apps/cthutool/kustomization.yaml`.
4. After the pull request merges, Argo CD reconciles the `cthutool` Application and restarts the Backend Deployment for the new digest.
5. CthuTool never commits or updates Kubernetes manifests; deployment state lives only in CthuOps.

## ArgoCD Sync State

Check the Application object:

```bash
kubectl -n argocd get application cthutool
kubectl -n argocd describe application cthutool
```

The CthuOps `cthutool` Application enables:

- automated sync
- prune
- self-heal
- retry limit `5`
- retry backoff from `5s` up to `3m`

If rollout is delayed, first confirm the backend image workflow pushed a new digest, then inspect the CthuOps Application status and the pinned digest in `apps/cthutool/kustomization.yaml`.

## Drift Correction

ArgoCD owns the live Kubernetes resources. Manual edits such as `kubectl edit deployment/cthutool-backend` or `kubectl set image` are temporary and should be expected to revert.

Make durable changes in CthuOps:

- `apps/cthutool/kustomization.yaml` for image digest and backend environment values
- `apps/cthutool/deployment.yaml` for image, resources, and probes
- `apps/cthutool/service.yaml` for Service shape
- `apps/cthutool/ingress.yaml` for Ingress and TLS
- `argocd/applications/cthutool.yaml` for ArgoCD sync behavior

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

The CthuOps Backend Deployment separates process liveness from dependency readiness:

- liveness uses `GET /health`
- readiness uses `GET /health/ready`
- `/metrics` is exposed for Prometheus scraping and is not used as a Kubernetes probe

For an admin check without ingress:

```bash
kubectl -n cthutool port-forward service/cthutool-backend 3000:3000
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
curl http://localhost:3000/metrics
```

The backend exposes `/metrics` through its HTTP service so an external metrics consumer can scrape it when configured. CthuTool does not require or own a particular GitOps-managed Prometheus stack.

## Image Rollout Troubleshooting

If a backend change exists but the cluster still runs an older image:

1. Check the backend image workflow for the `main` commit.
2. Confirm GHCR has the commit tag.
3. Confirm the CthuOps `apps/cthutool/kustomization.yaml` digest points at the verified image.
4. Inspect ArgoCD Application sync status in the cluster.
5. Check the Kubernetes Deployment rollout and pod events.
