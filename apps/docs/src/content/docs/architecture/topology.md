---
title: Topology
description: Homelab cluster, observability, browser session, and client runtime topology.
---

```text
GitHub Actions -> GHCR backend image -> Argo CD Image Updater / rollout trigger -> Kubernetes Deployment

Third-party App -> @cthutool/browser-client -> Backend Public Browser API -> Desktop Browser Agent

Desktop App -- WebSocket agent connection --> Backend Service
Desktop App -- HTTP APIs ------------------> Backend Service
Backend ---- structured browser command ---> Desktop Playwright Host
CLI ------- local command execution -------> User machine / repository checkout
Web Console -------------------------------> Backend APIs

Backend Service -- /metrics --------------> Prometheus
Backend Pods ---- stdout/stderr ----------> Alloy -> Loki
Backend --------- OTLP traces ------------> OpenTelemetry Collector -> Tempo
Grafana -------- Prometheus/Loki/Tempo ---> Operator dashboards
```

## Homelab Cluster

The homelab Kubernetes cluster runs the backend Deployment in namespace `cthutool`. ArgoCD owns reconciliation from git into the cluster:

- namespace source: `gitops/namespaces/cthutool.yaml`
- Application source: `gitops/apps/cthutool/application.yaml`
- backend resources: `k8s/configmap.yaml`, `k8s/deployment.yaml`, `k8s/service.yaml`

The backend Service is currently in-cluster `ClusterIP` on port `3000`. LAN exposure, ingress, and TLS are cluster/networking concerns outside the current manifests.

## Browser Integration

CthuDesktop owns host Chrome, Playwright contexts, browser pages, and local browser profile storage. The backend can route bounded browser commands to an online desktop agent.

Trusted third-party applications can use `@cthutool/browser-client` to call the backend public browser API. The SDK stores only public session IDs; backend stores routing metadata; desktop owns the actual browser runtime state.

## Observability

The `observability` namespace runs upstream components through GitOps-managed Applications. Prometheus scrapes backend `/metrics`, Alloy collects backend pod logs into Loki, the backend exports OTLP traces to the OpenTelemetry Collector, and Tempo stores trace data for Grafana.

## Image Delivery

Backend images are built by `.github/workflows/backend.yml` from `apps/backend/Dockerfile`. The workflow pushes `:main` and commit-sha GHCR tags without committing deployment manifest changes back to `main`. `k8s/deployment.yaml` references `:main`; Argo CD Image Updater digest tracking or an equivalent rollout trigger is responsible for restarting Pods when that tag points at a new image digest.

## Client Host

The client host runs CthuDesktop and `chc`. Browser profile directories remain local to the desktop app. Client tools connect to the backend URL exposed from the homelab cluster.

## Requirements Sources

- Backend image delivery: `openspec/specs/apps-backend-image-ci/spec.md`
- Backend public browser API: `openspec/specs/apps-backend-browser-public-api/spec.md`
- Browser client SDK: `openspec/specs/packages-browser-client-sdk/spec.md`
- Backend observability: `openspec/specs/apps-backend-observability/spec.md`
- GitOps observability stack: `openspec/specs/gitops-observability-stack/spec.md`
- ArgoCD Applications: `openspec/specs/gitops-argo-applications/spec.md`
- Cluster namespaces: `openspec/specs/gitops-cluster-namespaces/spec.md`
- Agent registry: `openspec/specs/apps-backend-agent-registry/spec.md`
- Desktop browser host: `openspec/specs/apps-desktop-browser-host/spec.md`
- Web project shell: `openspec/specs/apps-web-project-shell/spec.md`
