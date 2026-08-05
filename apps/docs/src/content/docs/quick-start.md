---
title: Quick Start
description: Short path for deploying CthuTool services and installing client tools.
---

Use this path when you want the current CthuTool pieces running without reading the full repository map first.

## 1. Prepare the Homelab Cluster

CthuTool server-side services deploy through Kubernetes/GitOps managed by the separate **CthuOps** repository. CthuTool is the image-producing source repository: it builds `apps/backend/Dockerfile` and publishes GHCR tags.

You need:

- a Kubernetes or k3s cluster reachable with `kubectl`
- ArgoCD installed in the cluster (see CthuOps `bootstrap/`)
- access to the CthuOps repository at `https://github.com/mickmetalholic/CthuOps`

If the cluster does not already have Argo CD, follow the pinned installation
and root-Application procedure in the [CthuOps Argo CD bootstrap guide](https://github.com/mickmetalholic/CthuOps/blob/main/bootstrap/argocd/README.md).

## 2. Deploy the Backend from CthuOps

The CthuOps repository owns the Backend Deployment, Service, Ingress, and Argo CD Application:

- `apps/cthutool/` in CthuOps holds the Backend manifests and digest-pinned Kustomize root.
- `argocd/applications/cthutool.yaml` in CthuOps registers the Argo CD Application.
- `docs/cthutool-release.md` in CthuOps documents the image promotion workflow.

CthuTool does not contain Kubernetes or Argo CD manifests.

## 3. Verify the Backend Rollout

Check the Kubernetes resources first:

```bash
kubectl -n cthutool get deploy,svc,cm
kubectl -n cthutool rollout status deployment/cthutool-backend
```

Then verify the backend through the address you expose from your cluster:

```bash
curl http://<homelab-backend-url>/health
```

The in-cluster Service is `ClusterIP` on port `3000`. Ingress, TLS, or LAN exposure should be handled by CthuOps or your cluster's existing networking layer.

## 4. Install the CLI on a Client Computer

For personal use from GitHub:

```bash
curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | bash
chc --help
```

On Windows from PowerShell:

```powershell
irm https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.ps1 | iex
chc --help
```

Update later with:

```bash
chc update --check
chc update
```

## 5. Install the Local Agent

The tray-owned Agent runs on client computers, not in the cluster. Install a
signed release, select one catalog environment, and configure its static Agent
secret:

```bash
chc agent install
chc agent env list
chc agent env set production
printf '%s\n' "$AGENT_SECRET" | chc agent env set-secret production --secret-stdin
chc agent autostart enable
chc agent start
chc agent settings
```

`settings` opens the deployed Web application; the Agent does not serve or
embed a local UI.

## 6. Choose a Module

Start from [Modules](/modules/) after the cluster service and client tools are in place.
