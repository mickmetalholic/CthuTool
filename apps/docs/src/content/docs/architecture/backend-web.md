---
title: Backend and Web
description: Backend service and web console architecture boundary.
---

## Backend

The backend owns service APIs, browser orchestration, site configuration, agent registry, public agent state, and public browser status.

Important public checks and APIs include:

```text
GET /health
GET /api/agents
GET /api/browser/sites
GET /api/browser/profiles
GET /api/browser/pending-auth-tasks
```

## Web Console

`apps/web` is the browser-hosted management-console scaffold. It should not import Electron internals or desktop-only styles.

## Requirements Sources

- Backend agent registry: `openspec/specs/apps-backend-agent-registry/spec.md`
- Backend browser auth: `openspec/specs/apps-backend-browser-auth/spec.md`
- Backend sites config: `openspec/specs/apps-backend-sites-config/spec.md`
- Web shell: `openspec/specs/apps-web-project-shell/spec.md`
