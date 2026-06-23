---
title: Backend and Web
description: Backend service and web console architecture boundary.
---

## Backend

The backend owns service APIs, browser orchestration, site configuration, agent registry, public agent state, and public browser status.

In homelab deployment, the backend runs as `Deployment/cthutool-backend` in the `cthutool` Kubernetes namespace. The Deployment consumes environment values from `ConfigMap/cthutool-backend`, exposes container port `3000`, and is reached in-cluster through `Service/cthutool-backend`.

Backend image delivery is automated:

1. `.github/workflows/backend-image.yml` builds `apps/backend/Dockerfile`.
2. The workflow pushes GHCR `main` and commit-sha tags.
3. The workflow pins `k8s/deployment.yaml` to the commit-sha image.
4. ArgoCD syncs the `k8s/` path into the cluster.

Important public checks and APIs include:

```text
GET /health
GET /api/agents
GET /api/browser/sites
GET /api/browser/profiles
GET /api/browser/pending-auth-tasks
```

## Web Console

`apps/web` is the browser-hosted management-console scaffold. It should not import Electron internals or desktop-only styles.

## Requirements Sources

- Backend image delivery: `openspec/specs/apps-backend-image-delivery/spec.md`
- ArgoCD Applications: `openspec/specs/gitops-argo-applications/spec.md`
- Backend agent registry: `openspec/specs/apps-backend-agent-registry/spec.md`
- Backend browser auth: `openspec/specs/apps-backend-browser-auth/spec.md`
- Backend sites config: `openspec/specs/apps-backend-sites-config/spec.md`
- Web shell: `openspec/specs/apps-web-project-shell/spec.md`
