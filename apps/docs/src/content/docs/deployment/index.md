---
title: Deployment Overview
description: How CthuTool server-side pieces fit into a homelab deployment.
---

Deploy CthuTool server-side services on a homelab machine, then connect client tools from user computers.

## Homelab Machine

The homelab host is responsible for:

- running `apps/backend`
- exposing backend HTTP and WebSocket endpoints
- holding service configuration such as browser site policy
- serving or hosting the future web console when enabled
- providing logs and health checks for operations

## Client Computers

Client computers run:

- CthuDesktop for local browser automation, login windows, profile storage, and agent connection
- `chc` for command-line workflows and local tool automation

## Deployment Path

1. Prepare Node.js, pnpm, and repository dependencies.
2. Start the backend service with explicit environment variables.
3. Verify `/health`.
4. Configure browser site policy when needed.
5. Connect desktop clients to the backend URL.
6. Use operations pages for logs, backup, and troubleshooting.

Start with [Homelab Setup](/deployment/homelab-setup/).
