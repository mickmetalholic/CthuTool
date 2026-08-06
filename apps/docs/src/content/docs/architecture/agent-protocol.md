---
title: Agent Protocol
description: Authenticated backend and local Agent connection overview.
---

The local Agent opens an outbound WebSocket to the selected environment's
catalog WSS endpoint. The Backend authenticates the private-network socket peer
and the configured environment id; the stable Agent id is correlation metadata,
not a credential. No static Agent secret is sent or required.

After opening the socket, the Agent sends `agent.hello` with its identity,
platform, version, and capabilities. The backend acknowledges registration and
tracks heartbeats. Browser capability is advertised only while the local
Playwright host is ready.

```text
Local Agent -> private-network WSS -> Backend Agent Registry
Backend -> structured browser command -> Agent Playwright Host
Backend -> public status -> private-network operator/Web APIs
```

Environment catalogs require HTTPS/WSS in release builds. External operator
Web/Backend HTTP access uses Cloudflare Access/Tunnel into the private network;
the Agent WSS path remains private-network only and Agents do not carry
Cloudflare Access credentials. That external path does not replace the
Backend's private-peer check, and a direct public Backend port is unsupported.

Main requirements remain in the backend `apps-backend-agent-*` specs; the local
runtime requirements are in the ordered Agent changes until archive/sync.
