---
title: Agent Protocol
description: Authenticated backend and local Agent connection overview.
---

The local Agent opens an outbound WebSocket to the selected environment's
catalog WSS endpoint. A separate static Agent secret authenticates the
connection; the stable Agent id is correlation metadata, not a credential.

After opening the socket, the Agent sends `agent.hello` with its identity,
platform, version, and capabilities. The backend acknowledges registration and
tracks heartbeats. Browser capability is advertised only while the local
Playwright host is ready.

```text
Local Agent -> authenticated WSS -> Backend Agent Registry
Backend -> structured browser command -> Agent Playwright Host
Backend -> public status -> authorized operator/Web APIs
```

Environment catalogs require HTTPS/WSS in release builds. Public operator
access is a separate reverse-proxy/access-gateway boundary and does not replace
Agent authentication.

Main requirements remain in the backend `apps-backend-agent-*` specs; the local
runtime requirements are in the ordered Agent changes until archive/sync.
