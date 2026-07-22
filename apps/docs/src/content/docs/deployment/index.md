---
title: Deployment Overview
description: Kubernetes and GitOps deployment model for CthuTool homelab services.
---

CthuTool server-side services deploy to a homelab Kubernetes cluster through GitOps. Local repository commands are useful for development and debugging, but they are not the official homelab deployment path.

## Runtime Placement

| Runtime | Where it runs | Deployment owner |
| --- | --- | --- |
| Backend service | Kubernetes namespace `cthutool` | `gitops/` Application plus `k8s/` manifests |
| Backend image | GHCR | `.github/workflows/backend.yml` |
| CthuDesktop | Client computers | Desktop installer or local development build |
| `chc` CLI | Client computers | `scripts/install-chc.sh`, `scripts/install-chc.ps1`, and CLI update commands |
| Web console | Browser/client surface | `apps/web` project shell; deployment is not yet the primary path |

## GitOps Sources

- `gitops/namespaces/cthutool.yaml` creates the `cthutool` namespace.
- `gitops/apps/cthutool/application.yaml` registers the ArgoCD Application for this repository.
- `k8s/configmap.yaml` defines backend environment values.
- `k8s/deployment.yaml` runs the backend image from GHCR and defines probes/resources.
- `k8s/service.yaml` exposes the backend inside the cluster on port `3000`.

ArgoCD watches `https://github.com/mickmetalholic/CthuTool`, target revision `main`, path `k8s/`, and reconciles the backend resources into the `cthutool` namespace.

## Backend Image Flow

1. A backend-relevant change lands on `main`.
2. GitHub Actions builds `apps/backend/Dockerfile`.
3. The workflow pushes `ghcr.io/mickmetalholic/cthutool-backend:main` and `ghcr.io/mickmetalholic/cthutool-backend:<commit-sha>`.
4. `k8s/deployment.yaml` already references `ghcr.io/mickmetalholic/cthutool-backend:main` with `imagePullPolicy: Always`.
5. Argo CD Image Updater with digest tracking, or an equivalent rollout trigger, restarts the backend Deployment so Pods pull the current `:main` image.

## Deployment Path

1. Prepare a Kubernetes or k3s cluster with `kubectl` access.
2. Install ArgoCD in the cluster.
3. Apply namespace resources from `gitops/namespaces/`.
4. Apply Application CRs from `gitops/apps/`.
5. Verify the ArgoCD Application and Kubernetes Deployment.
6. Expose the backend Service through your cluster's existing LAN, ingress, or reverse-proxy layer.
7. Install client tools on user computers and point them at the exposed backend URL.

Start with [Homelab Setup](/deployment/homelab-setup/), then use [GitOps Rollouts](/operations/gitops-rollouts/) for ongoing operations.
