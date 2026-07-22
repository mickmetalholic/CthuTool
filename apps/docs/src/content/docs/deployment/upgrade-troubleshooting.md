---
title: Upgrade and Troubleshooting
description: GitOps upgrade flow and first-response troubleshooting for homelab deployments.
---

## Upgrade Flow

CthuTool backend upgrades are delivered through GitHub Actions, GHCR, Kubernetes manifests, and ArgoCD.

1. Merge a backend-relevant change to `main`.
2. Confirm the `Backend Image` workflow succeeds.
3. Confirm the workflow pushed `ghcr.io/mickmetalholic/cthutool-backend:main` and `ghcr.io/mickmetalholic/cthutool-backend:<commit-sha>`.
4. Confirm Argo CD Image Updater digest tracking, or an equivalent rollout trigger, detected the new `:main` digest.
5. Watch ArgoCD sync the `cthutool` Application.
6. Watch Kubernetes roll out `Deployment/cthutool-backend`.

```bash
kubectl -n argocd get application cthutool
kubectl -n cthutool rollout status deployment/cthutool-backend
```

Do not upgrade the homelab backend by pulling the repository and running `pnpm` on the server. Local checkout commands are development and debugging tools.

## Health Checks

```bash
kubectl -n cthutool port-forward service/cthutool-backend 3000:3000
curl http://localhost:3000/health
```

If a reverse proxy or ingress is in front of the backend, verify both the Service through a port-forward and the externally exposed URL.

## ArgoCD Does Not Sync

- Confirm `gitops/apps/cthutool/application.yaml` points at repo `https://github.com/mickmetalholic/CthuTool`, revision `main`, path `k8s/`.
- Inspect the Application status with `kubectl -n argocd describe application cthutool`.
- Confirm the namespace exists: `kubectl get namespace cthutool`.
- Confirm the manifests are valid by applying them to a test cluster or inspecting ArgoCD events.

## Image Did Not Change

- Check the `Backend Image` GitHub Actions run for the relevant `main` commit.
- Confirm the workflow had permission to push GHCR packages.
- Confirm `k8s/deployment.yaml` contains `ghcr.io/mickmetalholic/cthutool-backend:main`.
- Confirm the Image Updater or equivalent rollout trigger detected the new `:main` digest and restarted the Deployment.

## Agent Connectivity

The local Agent connects to its catalog backend through WSS. If Agent status is
offline:

- run `chc agent doctor` and confirm an environment and secret are configured
- confirm the catalog HTTPS/WSS endpoints are reachable from the client
- check whether the Agent WebSocket endpoint is allowed by the proxy or ingress
- confirm the backend pod is ready and `/health` responds
- use `chc agent logs --lines 200` for redacted local diagnostics

If deployed Web settings cannot reach the loopback bridge, allow local-network
access for the deployed origin and reopen settings from the tray or
`chc agent settings` to obtain a fresh one-time ticket.

## Browser Auth

Required-auth browser work needs an online Agent with a working host Chrome
runtime. Raw browser storage stays on the client computer. For legacy data,
follow the repair command from `chc agent doctor`; source data is not deleted.

Use [GitOps Rollouts](/operations/gitops-rollouts/) for deeper ArgoCD and rollout checks.
