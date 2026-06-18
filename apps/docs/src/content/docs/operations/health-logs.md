---
title: Health and Logs
description: Current health checks and log boundaries for CthuTool services.
---

## Backend Health

```bash
curl http://<homelab-host>:3000/health
```

For local development:

```bash
curl http://localhost:3000/health
```

## Backend Startup Diagnostics

Run the backend directly when diagnosing startup:

```bash
PORT=3000 NODE_ENV=development LOG_LEVEL=info pnpm --filter @cthutool/backend run start:dev
```

## Desktop Status

CthuDesktop surfaces backend connection state, local browser runtime diagnostics, profile status, pending auth tasks, and logs in the desktop UI.

## API Checks

Developer troubleshooting can call public backend browser APIs directly:

```text
GET /api/browser/sites
GET /api/browser/profiles
GET /api/browser/pending-auth-tasks
```

These endpoints expose public status only.
