---
title: Backend APIs
description: Current backend API endpoints referenced by user and architecture docs.
---

## Health

```text
GET /health
```

## Agents

```text
GET /api/agents
```

Returns public connected-agent status. It does not expose raw WebSocket objects or socket internals.

Example response shape:

```json
{
  "agents": [
    {
      "agentId": "windows-pc",
      "connectionId": "...",
      "deviceName": "Windows PC",
      "platform": "win32",
      "version": "0.1.0",
      "capabilities": [],
      "connectedAt": "2026-06-13T10:00:00.000Z",
      "lastSeenAt": "2026-06-13T10:00:05.000Z",
      "state": "online"
    }
  ]
}
```

## Browser Status

```text
GET /api/browser/sites
GET /api/browser/profiles
GET /api/browser/pending-auth-tasks
```

These endpoints expose configured sites, public profile summaries, and public pending-auth tasks. Raw browser storage stays in CthuDesktop.

## Requirements Sources

- `openspec/specs/apps-backend-agent-registry/spec.md`
- `openspec/specs/apps-backend-browser-auth/spec.md`
- `openspec/specs/apps-backend-browser-automation/spec.md`
