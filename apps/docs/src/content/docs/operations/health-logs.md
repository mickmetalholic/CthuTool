---
title: Health and Logs
description: Health checks and log entry points for Kubernetes-managed CthuTool services.
---

## Backend Health

For the Kubernetes deployment, check rollout and pod readiness first:

```bash
kubectl -n cthutool rollout status deployment/cthutool-backend
kubectl -n cthutool get pods -l app.kubernetes.io/name=cthutool-backend
```

To call the backend health endpoint without a permanent ingress:

```bash
kubectl -n cthutool port-forward service/cthutool-backend 3000:3000
curl http://localhost:3000/health
```

For normal client use, call the URL exposed by your homelab networking layer:

```bash
curl http://<homelab-backend-url>/health
```

## Backend Logs

Read current backend logs through Kubernetes:

```bash
kubectl -n cthutool logs deployment/cthutool-backend
```

When a rollout is unhealthy, inspect events and pod details:

```bash
kubectl -n cthutool describe deployment cthutool-backend
kubectl -n cthutool describe pods -l app.kubernetes.io/name=cthutool-backend
```

## API Checks

Developer troubleshooting can call public backend browser APIs directly once the backend URL is reachable:

```text
GET /api/browser/sites
GET /api/browser/profiles
GET /api/browser/pending-auth-tasks
```

These endpoints expose public status only.

## Local Development Diagnostics

Running the backend from a checkout with `pnpm --filter @cthutool/backend run start:dev` is a development/debugging workflow. Use it to reproduce backend behavior outside the cluster, not as the homelab deployment path.

Package-local commands remain documented in `apps/backend/README.md`.
