---
title: Topology
description: Homelab cluster and client runtime topology.
---

```text
GitHub Actions -> GHCR backend image -> k8s/deployment.yaml image pin -> ArgoCD -> Kubernetes Deployment

Desktop App -- WebSocket agent connection --> Backend Service
Desktop App -- HTTP APIs ------------------> Backend Service
Backend ---- structured browser command ---> Desktop Playwright Host
CLI ------- local command execution -------> User machine / repository checkout
Web Console -------------------------------> Backend APIs
```

## Homelab Cluster

The homelab Kubernetes cluster runs the backend Deployment in namespace `cthutool`. ArgoCD owns reconciliation from git into the cluster:

- namespace source: `gitops/namespaces/cthutool.yaml`
- Application source: `gitops/apps/cthutool/application.yaml`
- backend resources: `k8s/configmap.yaml`, `k8s/deployment.yaml`, `k8s/service.yaml`

The backend Service is currently in-cluster `ClusterIP` on port `3000`. LAN exposure, ingress, and TLS are cluster/networking concerns outside the current manifests.

## Image Delivery

Backend images are built by `.github/workflows/backend-image.yml` from `apps/backend/Dockerfile`. The workflow pushes GHCR tags and commits the immutable commit-sha tag back into `k8s/deployment.yaml`. ArgoCD then rolls out the pinned image.

## Client Host

The client host runs CthuDesktop and `chc`. Browser profile directories remain local to the desktop app. Client tools connect to the backend URL exposed from the homelab cluster.

## Requirements Sources

- Backend image delivery: `openspec/specs/apps-backend-image-delivery/spec.md`
- ArgoCD Applications: `openspec/specs/gitops-argo-applications/spec.md`
- Cluster namespaces: `openspec/specs/gitops-cluster-namespaces/spec.md`
- Agent registry: `openspec/specs/apps-backend-agent-registry/spec.md`
- Desktop browser host: `openspec/specs/apps-desktop-browser-host/spec.md`
- Web project shell: `openspec/specs/apps-web-project-shell/spec.md`
