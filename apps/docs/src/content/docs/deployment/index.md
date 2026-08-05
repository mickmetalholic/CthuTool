---
title: Deployment Overview
description: Image-producing repository and CthuOps-managed homelab deployment model.
---

CthuTool is the image-producing source repository for the Backend. It builds and publishes the Backend container image to GHCR; the separate **CthuOps** repository owns the homelab cluster desired state, including the Backend Deployment, Service, Ingress, TLS, Secrets, image digest promotion, and Argo CD. Cluster observability is an external deployment platform responsibility that CthuOps may take over later.

Local repository commands are useful for development and debugging, but they are not the official homelab deployment path.

## Runtime Placement

| Runtime | Where it runs | Deployment owner |
| --- | --- | --- |
| Backend service | Kubernetes namespace `cthutool` | [CthuOps](https://github.com/mickmetalholic/CthuOps) (`apps/cthutool/`) |
| Backend image | GHCR | `.github/workflows/backend.yml` (CthuTool) |
| Local Agent | Client computers | Signed `chc agent install` bundle and native tray |
| `chc` CLI | Client computers | `scripts/install-chc.sh`, `scripts/install-chc.ps1`, and CLI update commands |
| Web console | Browser/client surface | `apps/web` project shell; deployment is not yet the primary path |

## Deployment Ownership Boundary

- CthuTool builds `apps/backend/Dockerfile` and publishes `ghcr.io/mickmetalholic/cthutool-backend:main` plus immutable commit-SHA tags.
- CthuOps pins a verified GHCR digest in its `apps/cthutool/kustomization.yaml` and lets Argo CD reconcile the Backend Deployment through `argocd/applications/cthutool.yaml`.
- CthuTool contains no authoritative Kubernetes Deployment manifest, Service, Ingress, namespace, or cluster observability Application.

## Backend Image Flow

1. A backend-relevant change lands on `main`.
2. GitHub Actions builds `apps/backend/Dockerfile`.
3. The workflow pushes `ghcr.io/mickmetalholic/cthutool-backend:main` and `ghcr.io/mickmetalholic/cthutool-backend:<commit-sha>`.
4. An operator captures the digest and opens a digest-pin pull request in CthuOps.
5. After the CthuOps pull request merges, Argo CD reconciles the new digest and rolls out the Backend.

## Deployment Path

1. Use the CthuOps repository as the deployment entry point.
2. See `apps/cthutool/` in CthuOps for the Backend Deployment, Service, and Ingress.
3. See `docs/cthutool-release.md` in CthuOps for the image-promotion workflow.
4. See `argocd/applications/cthutool.yaml` in CthuOps for the Argo CD Application.

Start with [Homelab Setup](/deployment/homelab-setup/), then use [GitOps Rollouts](/operations/gitops-rollouts/) for ongoing operations.
