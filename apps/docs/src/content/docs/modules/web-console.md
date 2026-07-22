---
title: Web Console
description: Current web application shell and management-console boundary.
---

`apps/web` is the browser-hosted scaffold for the future CthuTool management console.

## Runtime Location

Homelab/web host when deployed, local development host during development.

## Current State

The Web application is the only product UI surface for Agent settings and local
browser workflows. It connects to the loopback Agent bridge only after a fresh
tray/CLI launch; the Agent does not package or serve Web assets.

## Development

```bash
pnpm --filter @cthutool/web dev
```

## Authoritative Sources

- Development source: `apps/web/README.md`
- Requirements: `openspec/specs/apps-web-project-shell/spec.md`
