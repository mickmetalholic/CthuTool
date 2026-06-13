# CthuDesktop

`apps/desktop` builds `CthuDesktop`, the first CthuTool desktop app. The first
version is a product shell for future local capabilities: it registers the
current machine with the backend as an agent, shows connection state, lists
agents reported by the backend, and reserves workspace sections for capabilities
such as local Chrome control.

It does not launch browsers, control Chrome, fetch pages, verify Douban login,
or run host tasks yet.

## Product Shell

The renderer opens directly into the main workspace instead of a landing page.
The left activity bar contains product areas such as Overview, Local Chrome,
Agents, and Logs. Settings sits at the bottom-left and switches into app-level
configuration, including service connection, local status, diagnostics, logs,
and appearance.

The desktop window uses a custom title bar so the app reads as `CthuDesktop`
rather than a generic browser window. Window controls are handled by the
Electron main process.

The first built-in appearance is Dracula. The configuration model stores an
appearance mode and color scheme so additional built-in color schemes can be
added later without changing the app shell contract.

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

The desktop app defaults to a local-only environment named `Local` with
`http://localhost:3000`. Change the Backend URL in Settings when the backend
runs on a homelab host such as `http://homelab.local:3000`.

Development builds intentionally expose only the local environment by default.
Packaged builds default to two selectable environments:

```text
Test        https://test.cthutool.local
Production  https://api.cthutool.local
```

Both URLs are stored in local configuration and can be edited from Settings.

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

## Packaging

The package name and installer product name are `CthuDesktop`. App icons live
under `apps/desktop/build` for electron-builder and under renderer assets for
in-app branding.

Local package commands:

```powershell
pnpm --filter @cthutool/desktop package:win
pnpm --filter @cthutool/desktop package:mac
```

GitHub Actions runs `.github/workflows/desktop-artifacts.yml` on relevant
desktop changes and uploads unsigned macOS and Windows artifacts. The workflow
does not notarize, sign, or publish installers yet.

On local Windows machines, `package:win` may require Developer Mode or an
administrator terminal because electron-builder extracts `winCodeSign` files
that include symlinks before it edits the executable resources. A directory
package smoke test can be run without executable resource editing:

```powershell
pnpm --filter @cthutool/desktop exec electron-builder --dir --config.win.signAndEditExecutable=false
```

## Current Limits

- No browser profile management.
- No Playwright or CDP worker.
- No Douban or movie parsing.
- No backend task dispatch to agents.
- No installer signing, notarization, or auto-update.

The next browser-focused change should add a `browser` capability and route
generic browser tasks through the backend to a selected desktop agent. Douban
searching, parsing, caching, and MCP tools should remain backend-owned.
