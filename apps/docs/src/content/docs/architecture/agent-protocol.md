---
title: Agent Protocol
description: Backend and desktop agent connection overview.
---

CthuDesktop connects to the backend as an agent over WebSocket.

```text
ws://<backend>/ws/agents
```

After opening the socket, desktop sends an `agent.hello` payload with agent identity, platform, version, and capabilities. The backend acknowledges registration and tracks heartbeat state.

```json
{
  "type": "agent.hello",
  "payload": {
    "agentId": "windows-pc",
    "deviceName": "Windows PC",
    "platform": "win32",
    "version": "0.1.0",
    "capabilities": ["browser"]
  }
}
```

Desktop advertises the `browser` capability only when its local Playwright host is ready.

```text
Desktop App -> WebSocket -> Backend Agent Registry
Desktop App -> HTTP GET /api/agents -> Backend Agent Registry
Backend -> structured browser command -> Desktop Playwright Host
```

## Requirements Sources

- CLI agent contract: `openspec/specs/apps-cli-agent-contract/spec.md`
- Backend agent registry: `openspec/specs/apps-backend-agent-registry/spec.md`
- Agent command gateway: `openspec/specs/apps-backend-agent-command-gateway/spec.md`
- Agent state: `openspec/specs/apps-backend-agent-state/spec.md`
