---
title: Upgrade and Troubleshooting
description: Operational upgrade and first-response troubleshooting notes for homelab deployments.
---

## Upgrade Checklist

For a checkout-based deployment:

```bash
git fetch
git pull
pnpm install
pnpm run build
```

Restart the backend process after updating.

## Health Checks

```bash
curl http://<homelab-host>:3000/health
```

If a reverse proxy is in front of the backend, verify both the direct backend URL and the proxied URL.

## Desktop Connectivity

CthuDesktop connects to the backend through HTTP APIs and a WebSocket agent connection. If desktop status is offline:

- verify the backend URL in desktop settings
- confirm the homelab host is reachable from the client computer
- check whether the backend WebSocket endpoint is allowed by the proxy

## Browser Auth

Required-auth browser work needs an online CthuDesktop instance with a working host Chrome runtime. Raw browser storage stays on the client computer.

Use [Health and Logs](/operations/health-logs/) for the current operational checks.
