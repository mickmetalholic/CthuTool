---
title: Homelab Setup
description: CthuOps-managed Kubernetes, ArgoCD, GitOps bootstrap, and first backend rollout checks.
---

This page documents the official homelab setup path for CthuTool server-side services. Cluster deployment is owned by the separate **CthuOps** repository; use local `pnpm` backend commands only for development or focused debugging.

## Deployment Entry Point

The CthuOps repository owns the homelab cluster desired state:

```text
https://github.com/mickmetalholic/CthuOps
```

Key CthuOps paths for the Backend:

- `apps/cthutool/` — Backend `Deployment`, `Service`, `Ingress`, and the Kustomize root that pins the GHCR image digest.
- `argocd/applications/cthutool.yaml` — Argo CD Application reconciling the Backend into the `cthutool` namespace.
- `docs/cthutool-release.md` — image promotion workflow and digest-pin instructions.
- `bootstrap/` and `argocd/` — Argo CD bootstrap and root Application notes.

## Prerequisites

- A Kubernetes cluster, such as k3s, reachable from your admin machine with `kubectl`.
- ArgoCD installed or permission to install it (see CthuOps `bootstrap/`).
- Network exposure for the backend after it is running, through your cluster's existing ingress, reverse proxy, load balancer, or port-forward workflow.
- Access to the CthuOps repository at `https://github.com/mickmetalholic/CthuOps`.

## Release a New Backend Image

1. Merge a backend-relevant change in CthuTool and confirm the `Backend Image` workflow pushed `ghcr.io/mickmetalholic/cthutool-backend:main` and the commit-SHA tag.
2. Capture the digest returned by the image push step.
3. Open a pull request in CthuOps that changes only the `images[].digest` value in `apps/cthutool/kustomization.yaml`.
4. Let CthuOps manifest validation run, merge the pull request, and allow Argo CD to reconcile the new digest.

See `docs/cthutool-release.md` in CthuOps for the complete promotion workflow.

## Verify ArgoCD Sync

Check that the Application exists and that ArgoCD has started reconciling:

```bash
kubectl -n argocd get application cthutool
kubectl -n cthutool get configmap,deployment,service
```

Then wait for the backend rollout:

```bash
kubectl -n cthutool rollout status deployment/cthutool-backend
kubectl -n cthutool get pods -l app.kubernetes.io/name=cthutool-backend
```

## Verify Backend Health

Inside the cluster, the backend Service is named `cthutool-backend` and listens on port `3000`. For a direct admin check, use a temporary port-forward:

```bash
kubectl -n cthutool port-forward service/cthutool-backend 3000:3000
curl http://localhost:3000/health
```

For normal use, expose the Service through your homelab networking layer and point the local CthuTool Agent or other clients at that URL.

## Development Debugging

If you need to reproduce a backend problem outside the cluster, use the package-local backend README or development commands from a checkout. That local path is for development and debugging only; it is not the homelab deployment model.
