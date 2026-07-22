---
title: Quick Start
description: Short path for deploying CthuTool services and installing client tools.
---

Use this path when you want the current CthuTool pieces running without reading the full repository map first.

## 1. Prepare the Homelab Cluster

CthuTool server-side services deploy through Kubernetes/GitOps. For a small homelab, k3s is the expected Kubernetes distribution, but the manifests are ordinary Kubernetes resources.

You need:

- a Kubernetes or k3s cluster reachable with `kubectl`
- ArgoCD installed in the cluster
- access to this repository's `gitops/` and `k8s/` directories

Install ArgoCD if the cluster does not already have it:

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

## 2. Apply GitOps Entry Points

The repository does not yet use an app-of-apps root Application, so bootstrap the current GitOps entry points manually:

```bash
kubectl apply -f gitops/namespaces/
kubectl apply -f gitops/apps/ --recursive
```

The `cthutool` ArgoCD Application points at `https://github.com/mickmetalholic/CthuTool`, revision `main`, path `k8s/`. ArgoCD then reconciles the backend `ConfigMap`, `Deployment`, and `Service` into the `cthutool` namespace.

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

The in-cluster Service is currently `ClusterIP` on port `3000`. Ingress, TLS, or LAN exposure should be handled by your cluster's existing networking layer.

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
