---
title: Backend and Web
description: Backend service and web console architecture boundary.
---

## Backend

The backend owns service APIs, browser orchestration, site configuration, agent registry, public agent state, public browser status, public browser sessions, health/readiness checks, metrics, and client-event ingestion.

In homelab deployment, the backend runs as `Deployment/cthutool-backend` in the `cthutool` Kubernetes namespace. The Deployment consumes environment values from `ConfigMap/cthutool-backend`, exposes container port `3000`, and is reached in-cluster through `Service/cthutool-backend`.

Backend image delivery is automated:

1. `.github/workflows/backend-image.yml` builds `apps/backend/Dockerfile`.
2. The workflow pushes GHCR `main` and commit-sha tags.
3. The workflow pins `k8s/deployment.yaml` to the commit-sha image.
4. ArgoCD syncs the `k8s/` path into the cluster.

Operational endpoints include:

```text
GET /health
GET /health/ready
GET /metrics
POST /api/client-events
```

`/health` is liveness, `/health/ready` is dependency readiness, and `/metrics` is Prometheus scrape output.

Important public checks and APIs include:

```text
GET /health
GET /health/ready
GET /metrics
GET /api/agents
GET /api/browser/sites
GET /api/browser/profiles
GET /api/browser/pending-auth-tasks
POST /api/browser/sessions
POST /api/browser/sessions/{sessionId}/actions
DELETE /api/browser/sessions/{sessionId}
```

The public browser session API is intended for trusted deployments. It routes bounded browser action lists through an online CthuDesktop agent. Backend state is routing metadata; Playwright runtime state remains desktop-owned.

## Web Console

`apps/web` is the browser-hosted management-console scaffold. It should not import Electron internals or desktop-only styles.

## Requirements Sources

- Backend image delivery: `openspec/specs/apps-backend-image-delivery/spec.md`
- Backend public browser API: `openspec/specs/apps-backend-browser-public-api/spec.md`
- Backend observability: `openspec/specs/apps-backend-observability/spec.md`
- ArgoCD Applications: `openspec/specs/gitops-argo-applications/spec.md`
- GitOps observability: `openspec/specs/gitops-observability-stack/spec.md`
- Backend agent registry: `openspec/specs/apps-backend-agent-registry/spec.md`
- Backend browser auth: `openspec/specs/apps-backend-browser-auth/spec.md`
- Backend sites config: `openspec/specs/apps-backend-sites-config/spec.md`
- Web shell: `openspec/specs/apps-web-project-shell/spec.md`
