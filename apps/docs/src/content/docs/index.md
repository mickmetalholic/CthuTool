---
title: CthuTool Docs
description: Start here for CthuTool homelab deployment, client installation, module usage, and architecture documentation.
---

CthuTool is a homelab-oriented toolkit with server-side services, client-side desktop and CLI tools, browser automation support, and Codex-facing assets.

This site is the primary user and operator documentation surface. Package READMEs remain development references, and OpenSpec remains the authoritative requirements source.

## Start Here

- [Quick Start](/quick-start/) gives the shortest path through install, deployment, and verification.
- [What Runs Where](/what-runs-where/) explains the homelab machine, client computers, and shared boundaries.
- [Homelab Deployment](/deployment/) covers backend and web service setup.
- [Client Installation](/client/) covers the desktop app and `chc` CLI.
- [Modules](/modules/) describes the supported product areas and their source boundaries.
- [Architecture](/architecture/) explains implementation structure and links to authoritative OpenSpec specs.

## Local Development

For docs-site development from a repository checkout:

```bash
pnpm --filter @cthutool/docs dev
pnpm --filter @cthutool/docs build
pnpm --filter @cthutool/docs validate
```
