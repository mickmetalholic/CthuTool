## Why

The browser-control Agent currently lives inside the Electron main process, which couples a long-running local capability to a heavyweight desktop shell. Extracting a headless runtime first creates a stable service boundary that environment routing, the deployed Web/local bridge, tray, packaging, and CLI lifecycle work can build on without changing browser behavior all at once.

## What Changes

- Add a headless Node.js agent runtime that owns the backend WebSocket connection, Playwright browser host, local profiles, configuration, diagnostics, and graceful lifecycle.
- Extract Electron-independent agent and browser-host logic into reusable modules with explicit runtime ports for configuration, logging, local control, and process shutdown.
- Keep the current Electron application operational during migration by making it consume the extracted runtime modules instead of maintaining a second implementation.
- Define user-scoped local health and control contracts needed by a future native tray supervisor and CLI, without adding persistent local-control credentials, the tray, or install workflow in this change.

## Capabilities

### New Capabilities

- `apps-agent-runtime`: Headless local agent startup, backend connectivity, browser capability hosting, profile ownership, diagnostics, and supervised lifecycle contracts.

### Modified Capabilities

None. The Electron host keeps its current observable behavior during this extraction.

## Impact

- Affects `apps/desktop/src/main`, new agent runtime workspace code, shared agent/browser runtime modules, and workspace validation.
- Preserves the existing backend and browser protocol contracts while introducing a local supervisor/control boundary.
- Establishes the prerequisite for `add-agent-environment-routing`, `add-web-agent-local-bridge`, and `add-native-agent-tray`.
