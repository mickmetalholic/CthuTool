---
title: Backend APIs
description: Current backend API endpoints referenced by user and architecture docs.
---

## Health

```text
GET /health
GET /health/ready
GET /metrics
```

`/health` reports process liveness. `/health/ready` reports dependency readiness. `/metrics` exposes Prometheus text metrics and is not used as a Kubernetes probe.

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

## Public Browser Sessions

```text
POST /api/browser/sessions
POST /api/browser/sessions/{sessionId}/actions
DELETE /api/browser/sessions/{sessionId}
```

These endpoints are for trusted third-party applications that need controlled browser work through an online CthuDesktop agent. They do not expose the desktop agent WebSocket protocol.

Session creation selects a browser-capable desktop agent, creates a desktop-owned browser session, and returns an opaque public session ID. Action requests use a bounded crawler-focused Playwright-like action DSL for navigation, load and URL waiting, bounded response waiting, selector interactions, scrolling, text and HTML extraction, attribute extraction, list extraction, link/meta/JSON-LD extraction, screenshots, and close operations. Close requests release the backend routing record and ask the owning desktop agent to close its browser session.

Current safety constraints:

- no API key authentication is added yet; keep the backend behind a trusted network boundary
- navigation must stay within the configured site's `allowedOrigins`
- responses do not include cookies, localStorage, Playwright storage-state contents, desktop profile paths, raw WebSocket objects, or raw Playwright handles
- the API does not expose arbitrary `evaluate`, route interception, browser context storage, downloads, uploads, or Playwright Test assertions
- expired, closed, or missing sessions return structured errors instead of broadcasting to all agents

## Client Events

```text
POST /api/client-events
```

Accepts bounded, sanitized client diagnostic summaries from configured clients. Rejected or oversized payloads are not logged as accepted client events.

## Requirements Sources

- `openspec/specs/apps-backend-agent-registry/spec.md`
- `openspec/specs/apps-backend-browser-auth/spec.md`
- `openspec/specs/apps-backend-browser-automation/spec.md`
- `openspec/specs/apps-backend-browser-public-api/spec.md`
- `openspec/specs/apps-backend-observability/spec.md`
- `openspec/specs/apps-runtime-structured-logs/spec.md`
- `openspec/specs/packages-browser-client-sdk/spec.md`
