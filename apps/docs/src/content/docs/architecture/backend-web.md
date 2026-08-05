---
title: Backend and Web
description: Backend service and web console architecture boundary.
---

## Backend

The backend owns service APIs, browser orchestration, site configuration, agent registry, public agent state, public browser status, public browser sessions, health/readiness checks, metrics, and client-event ingestion.

In homelab deployment, the backend runs as `Deployment/cthutool-backend` in the `cthutool` Kubernetes namespace. The Deployment is owned by the separate **CthuOps** repository: it consumes environment values from `ConfigMap/cthutool-backend`, exposes container port `3000`, and is reached in-cluster through `Service/cthutool-backend`.

Backend image delivery is automated:

1. `.github/workflows/backend.yml` builds `apps/backend/Dockerfile`.
2. The workflow pushes GHCR `main` and commit-sha tags.
3. CthuOps pins a verified GHCR digest in `apps/cthutool/kustomization.yaml`.
4. Argo CD reconciles the new digest and restarts Pods for the pinned image.

CthuTool does not commit or update Kubernetes manifests; deployment desired state lives only in CthuOps.

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

The public browser session API is intended for trusted deployments. It routes
bounded browser action lists through an online local Agent. Backend state is
routing metadata; Playwright runtime state remains Agent-owned.

## Web Console

`apps/web` is the independently deployed management console. Local machine
controls cross only the authenticated, versioned loopback Agent bridge.

## Requirements Sources

- Backend image delivery: `openspec/specs/apps-backend-image-ci/spec.md`
- Backend public browser API: `openspec/specs/apps-backend-browser-public-api/spec.md`
- Backend observability: `openspec/specs/apps-backend-observability/spec.md`
- Backend agent registry: `openspec/specs/apps-backend-agent-registry/spec.md`
- Backend browser auth: `openspec/specs/apps-backend-browser-auth/spec.md`
- Backend sites config: `openspec/specs/apps-backend-sites-config/spec.md`
- Web shell: `openspec/specs/apps-web-project-shell/spec.md`
