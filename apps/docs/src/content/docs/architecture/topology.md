---
title: Topology
description: Homelab and client runtime topology.
---

```text
Desktop App -- WebSocket agent connection --> Backend
Desktop App -- HTTP APIs ------------------> Backend
Backend ---- structured browser command ---> Desktop Playwright Host
CLI ------- local command execution -------> User machine / repository checkout
Web Console -------------------------------> Backend APIs
```

## Homelab Host

The homelab host runs backend services and hosts shared service configuration. It may also host the future web console.

## Client Host

The client host runs CthuDesktop and `chc`. Browser profile directories remain local to the desktop app.

## Requirements Sources

- Agent registry: `openspec/specs/apps-backend-agent-registry/spec.md`
- Desktop browser host: `openspec/specs/apps-desktop-browser-host/spec.md`
- Web project shell: `openspec/specs/apps-web-project-shell/spec.md`
