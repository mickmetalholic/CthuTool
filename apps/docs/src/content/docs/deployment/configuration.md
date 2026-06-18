---
title: Configuration
description: Current deployment configuration sources for backend and browser site policy.
---

CthuTool configuration is currently split by runtime owner.

| Owner | Configuration | Source |
| --- | --- | --- |
| Backend | Port, environment, log level | Environment variables |
| Backend | Browser site policy | `BROWSER_SITES_CONFIG_FILE` JSON |
| Desktop | Backend URL, local browser runtime | CthuDesktop local configuration |
| CLI | Codex config workflows and command flags | CLI commands and local user files |

## Backend Environment

Start backend with explicit values:

```bash
PORT=3000 NODE_ENV=development LOG_LEVEL=info pnpm --filter @cthutool/backend run start:dev
```

## Browser Site Policy

Set `BROWSER_SITES_CONFIG_FILE` to point at a JSON file:

```bash
BROWSER_SITES_CONFIG_FILE=/config/browser-sites.json pnpm --filter @cthutool/backend run start:dev
```

Keep this file outside immutable images and mount it read-only for containerized or service-managed deployments.

The file stores site policy only. Do not store cookies, localStorage, Playwright storage-state bundles, browser user data directories, or desktop profile paths in it.

See [Browser Auth](/modules/browser-auth/) for the ownership model.
