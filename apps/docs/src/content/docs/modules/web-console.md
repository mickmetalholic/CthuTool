---
title: Web Console
description: Current web application shell and management-console boundary.
---

`apps/web` is the browser-hosted scaffold for the future CthuTool management console.

## Runtime Location

Homelab/web host when deployed, local development host during development.

## Current State

The web app intentionally contains placeholder-safe content. Real management console pages should arrive through shared UI/runtime work so `apps/desktop` and `apps/web` can reuse product pages.

## Development

```bash
pnpm --filter @cthutool/web dev
```

## Authoritative Sources

- Development source: `apps/web/README.md`
- Requirements: `openspec/specs/apps-web-project-shell/spec.md`
