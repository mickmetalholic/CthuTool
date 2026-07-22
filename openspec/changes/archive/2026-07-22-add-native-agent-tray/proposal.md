## Why

A persistent local Agent needs visible lifecycle and environment controls without restoring a desktop window. A small native tray process can supervise the Agent, select the active deployed environment, open that environment's Web application in the system browser, and provide a clear Exit action at substantially lower UI and runtime cost.

## What Changes

- Add a windowless native Rust tray application that enforces a single running instance and supervises the headless Node.js Agent sidecar.
- Show a minimal menu containing current status, Open CthuTool, an Environment submenu with the active environment selected, and Exit; do not add pause or stop-Agent-only modes.
- Make the tray authoritative for the active environment and apply environment switches through the Agent environment-switch contract without restarting the tray.
- Open the selected environment's deployed Web URL in the system browser with a fresh one-time local-bridge bootstrap fragment.
- Treat Exit as a coordinated shutdown of both tray and Agent, including active controlled browser contexts.
- Define restart/backoff, health handshakes, stale-process recovery, and bounded failure presentation for the supervised Agent.
- Use platform-appropriate activation: double-click on Windows where supported, primary click on macOS, and the context menu everywhere.

## Capabilities

### New Capabilities

- `apps-agent-tray`: Native tray presence, Agent supervision, status presentation, environment selection, deployed-Web launch, single-instance behavior, and coordinated exit.

### Modified Capabilities

None.

## Impact

- Adds a Rust workspace/application and native tray dependencies without adding a WebView framework.
- Integrates with the Agent local control/health, environment-routing, and local-bridge launch contracts.
- Depends on `extract-local-agent-runtime`, `add-agent-environment-routing`, and `add-web-agent-local-bridge`.
