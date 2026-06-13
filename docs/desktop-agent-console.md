# Desktop Agent Console

`apps/desktop` is the first CthuTool desktop app. The first version is a
connection and management shell only: it registers the current machine with the
backend as an agent, shows connection state, and lists agents reported by the
backend.

It does not launch browsers, control Chrome, fetch pages, verify Douban login,
or run host tasks yet.

## Development

Install dependencies from the repository root:

```powershell
pnpm install
```

If Electron binary download is slow or times out, set an Electron mirror for the
install command:

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
pnpm install
```

Start the backend:

```powershell
pnpm --filter @cthutool/backend dev
```

Start the desktop app in another terminal:

```powershell
pnpm --filter @cthutool/desktop dev
```

The desktop app defaults to `http://localhost:3000`. Change the Backend URL in
the app when the backend runs on a homelab host such as
`http://homelab.local:3000`.

## Runtime Model

The desktop app has two parts:

- Electron main process: stores local configuration and maintains the backend
  WebSocket agent connection.
- Renderer: displays a frontend management page using main-process state and
  backend HTTP APIs.

The backend owns the agent registry. Desktop instances do not call each other
directly.

```text
Desktop App -> WebSocket -> Backend Agent Registry
Desktop App -> HTTP GET /api/agents -> Backend Agent Registry
```

## Agent Protocol

The desktop app connects to:

```text
ws://<backend>/ws/agents
```

After the socket opens it sends:

```json
{
  "type": "agent.hello",
  "payload": {
    "agentId": "windows-pc",
    "deviceName": "Windows PC",
    "platform": "win32",
    "version": "0.1.0",
    "capabilities": []
  }
}
```

The backend acknowledges with `agent.registered`. The desktop app then sends
`agent.heartbeat` messages while connected.

The first version intentionally sends an empty capabilities list. Future changes
can add capabilities such as `browser`.

## Backend APIs

List currently connected agents:

```text
GET /api/agents
```

Response shape:

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

The API returns public status only. It does not expose raw WebSocket objects or
socket internals.

## Current Limits

- No browser profile management.
- No Playwright or CDP worker.
- No Douban or movie parsing.
- No backend task dispatch to agents.
- No installer signing, notarization, or auto-update.

The next browser-focused change should add a `browser` capability and route
generic browser tasks through the backend to a selected desktop agent. Douban
searching, parsing, caching, and MCP tools should remain backend-owned.
