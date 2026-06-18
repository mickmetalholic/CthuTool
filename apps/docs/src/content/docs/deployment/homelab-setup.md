---
title: Homelab Setup
description: Prerequisites, install steps, startup, health checks, upgrade, and troubleshooting entry points.
---

This page documents the current repository-checkout deployment path for homelab use.

## Prerequisites

- Node.js 24.x
- pnpm 9.15.4
- Bun for CLI build and tests
- A reachable host name or IP address for client computers

Enable pnpm through Corepack:

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

## Install

Clone the repository and install dependencies from the repository root:

```bash
pnpm install
```

## Start Backend

Use explicit runtime configuration:

```bash
PORT=3000 NODE_ENV=development LOG_LEVEL=info pnpm --filter @cthutool/backend run start:dev
```

## Verify

```bash
curl http://localhost:3000/health
curl http://localhost:3000/unknown
```

The health endpoint is the primary quick check. The unknown endpoint verifies the service returns normal not-found responses.

## Upgrade

For a checkout-based homelab deployment:

```bash
git pull
pnpm install
pnpm run build
```

Restart the backend service after updating dependencies and build output.

## Troubleshooting Entry Points

- Backend service does not start: confirm Node.js and pnpm versions, then run the backend command directly in a terminal.
- Desktop cannot connect: verify the backend URL from the client computer and check firewall or reverse proxy rules.
- Browser auth does not work: confirm CthuDesktop is online and advertises the `browser` capability.
