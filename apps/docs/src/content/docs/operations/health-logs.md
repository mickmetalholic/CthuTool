---
title: Health and Logs
description: Health checks and log entry points for CthuTool services deployed through CthuOps.
---

The homelab cluster deployment of CthuTool services is owned by the separate
**CthuOps** repository. The commands below operate on the live cluster; durable
deployment changes belong in CthuOps, not in the CthuTool checkout.

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
curl http://localhost:3000/health/ready
```

For normal client use, call the URL exposed by your homelab networking layer:

```bash
curl http://<homelab-backend-url>/health
curl http://<homelab-backend-url>/health/ready
```

`/health` checks process liveness. `/health/ready` checks dependency readiness and is the Kubernetes readiness probe path.

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

## Metrics Check

When the backend Service is reachable, verify the Prometheus exposition endpoint:

```bash
curl http://localhost:3000/metrics
```

`/metrics` is scrape output for Prometheus, not a Kubernetes liveness or readiness probe.

## Local Development Diagnostics

Running the backend from a checkout with `pnpm --filter @cthutool/backend run dev` is a development/debugging workflow. Use it to reproduce backend behavior outside the cluster, not as the homelab deployment path.

Package-local commands remain documented in `apps/backend/README.md`.
