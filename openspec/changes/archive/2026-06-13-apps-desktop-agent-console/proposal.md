## Why

CthuTool needs a desktop entry point that can register a user's machine with the backend and provide a foundation for future host capabilities such as browser automation. Establishing the desktop-to-backend connection first keeps the browser worker work small later and gives users a visible management surface for connected agents.

## What Changes

- Add a new Electron desktop application as the first CthuTool desktop client.
- Add a backend WebSocket endpoint for desktop agents to connect, register, heartbeat, disconnect, and reconnect.
- Add a backend agent registry that exposes currently connected agents through an HTTP API.
- Add a desktop management home page that lets the user configure a backend URL, see local connection state, and view agents reported by the backend.
- Keep the first version capability-neutral: agents report metadata and an empty capability list, but do not control browsers or host processes yet.

## Capabilities

### New Capabilities
- `apps-desktop-agent-console`: Defines the Electron desktop app, local configuration, WebSocket connection lifecycle, and management home page behavior.
- `apps-backend-agent-registry`: Defines backend agent WebSocket registration, heartbeat handling, online agent state, and read APIs for the console.

### Modified Capabilities
- None.

## Impact

- Adds a new `apps/desktop` workspace package for Electron, renderer UI, and desktop agent connection code.
- Adds backend agent registry and WebSocket gateway modules.
- Adds shared agent protocol types or schemas used by the desktop app and backend.
- Adds package dependencies for Electron desktop development and backend WebSocket support if not already present.
- Does not change existing browser automation behavior, CLI auth helper behavior, or Douban/movie business logic.
