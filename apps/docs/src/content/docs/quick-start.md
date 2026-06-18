---
title: Quick Start
description: Short path for deploying CthuTool services and installing client tools.
---

Use this path when you want to get the current CthuTool pieces running without reading the full repository map first.

## 1. Prepare a Checkout

On the machine where you will build or run services:

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install
```

The repository currently expects Node.js 24.x and pnpm 9.15.4. CLI build and tests also use Bun.

## 2. Start the Homelab Backend

From the repository root on the homelab machine:

```bash
PORT=3000 NODE_ENV=development LOG_LEVEL=info pnpm --filter @cthutool/backend run start:dev
```

Verify the service:

```bash
curl http://localhost:3000/health
```

For a networked homelab setup, expose the backend through the host name or reverse proxy that your desktop clients will use.

## 3. Install the CLI on a Client Computer

For personal use from GitHub:

```bash
curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | bash
chc --help
```

Update later with:

```bash
chc self-update
```

## 4. Start the Desktop App for Local Browser Work

For development builds from a checkout:

```bash
pnpm --filter @cthutool/desktop dev
```

Set the backend URL in CthuDesktop Settings when your backend runs on a homelab host such as `http://homelab.local:3000`.

## 5. Choose a Module

Start from [Modules](/modules/) after the core service and client paths are in place.
