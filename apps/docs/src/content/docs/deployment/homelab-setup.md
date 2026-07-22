---
title: Homelab Setup
description: Kubernetes, ArgoCD, GitOps bootstrap, and first backend rollout checks.
---

This page documents the official homelab setup path for CthuTool server-side services. Use Kubernetes/GitOps for deployment; use local `pnpm` backend commands only for development or focused debugging.

## Prerequisites

- A Kubernetes cluster, such as k3s, reachable from your admin machine with `kubectl`.
- ArgoCD installed or permission to install it.
- Network exposure for the backend after it is running, through your cluster's existing ingress, reverse proxy, load balancer, or port-forward workflow.
- Access to this repository at `https://github.com/mickmetalholic/CthuTool`.

## Install ArgoCD

If ArgoCD is not already installed:

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Wait until ArgoCD is ready:

```bash
kubectl -n argocd rollout status deployment/argocd-server
kubectl -n argocd get pods
```

## Apply GitOps Resources

The current repository keeps namespace manifests and Application CRs under `gitops/`. There is no root app-of-apps Application yet, so apply the entry points manually:

```bash
kubectl apply -f gitops/namespaces/
kubectl apply -f gitops/apps/ --recursive
```

For CthuTool, this creates:

- namespace `cthutool`
- ArgoCD Application `cthutool` in namespace `argocd`
- a GitOps source pointing at this repository's `main` branch and `k8s/` path

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
