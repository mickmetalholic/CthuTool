---
title: Upgrade and Troubleshooting
description: Image digest promotion and first-response troubleshooting for CthuOps-managed homelab deployments.
---

## Upgrade Flow

CthuTool backend upgrades are delivered through GitHub Actions, GHCR, and the CthuOps-managed Kubernetes/Argo CD deployment.

1. Merge a backend-relevant change to `main`.
2. Confirm the `Backend Image` workflow succeeds.
3. Confirm the workflow pushed `ghcr.io/mickmetalholic/cthutool-backend:main` and `ghcr.io/mickmetalholic/cthutool-backend:<commit-sha>`.
4. Capture the digest and open a digest-pin pull request in CthuOps that updates `apps/cthutool/kustomization.yaml`.
5. Merge the CthuOps pull request and watch Argo CD sync the `cthutool` Application.
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

- Confirm the CthuOps `argocd/applications/cthutool.yaml` points at `git@github.com:mickmetalholic/CthuOps.git`, revision `main`, path `apps/cthutool`.
- Inspect the Application status with `kubectl -n argocd describe application cthutool`.
- Confirm the namespace exists: `kubectl get namespace cthutool`.
- Confirm the CthuOps manifests are valid by rendering them with Kustomize or inspecting ArgoCD events.

## Image Did Not Change

- Check the `Backend Image` GitHub Actions run for the relevant `main` commit.
- Confirm the workflow had permission to push GHCR packages.
- Confirm the CthuOps `apps/cthutool/kustomization.yaml` digest points at the verified image.
- Confirm the CthuOps digest-pin pull request merged and Argo CD restarted the Deployment.

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
