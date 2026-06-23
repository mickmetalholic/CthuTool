## Why

CthuDesktop owns the local side of the agent connection and browser runtime, but failures such as WebSocket reconnects, Playwright runtime unavailability, login-profile expiry, and command execution errors are not described with a shared observability vocabulary. Desktop observability semantics make local diagnostics actionable and correlate desktop behavior with backend requests.

## What Changes

- Define desktop main-process observability events for agent connection lifecycle, registration, reconnects, heartbeat state, and backend rejection.
- Define browser host observability events for command receipt, runtime readiness, command duration, profile preflight, access detection, payload bounding, and command failure.
- Define renderer-facing diagnostics semantics for connection status, browser runtime status, pending auth tasks, and local error summaries.
- Define safe local log and diagnostics rules that exclude cookies, storage state, local profile internals, screenshot payloads, and other sensitive artifacts.
- Define how desktop-side events preserve backend-provided request or command correlation when available.
- Keep external telemetry export out of scope; this change defines semantics before choosing consumers.

## Capabilities

### New Capabilities

- `apps-desktop-observability`: CthuDesktop agent, browser host, renderer diagnostics, local log, and correlation semantics.

### Modified Capabilities

- `apps-desktop-browser-host`: Browser command handling gains runtime readiness, command lifecycle, access-detection, and safe diagnostics observability requirements.
- `apps-desktop-product-shell`: Settings diagnostics and logs surfaces gain requirements for displaying structured local status without exposing sensitive internals.
- `apps-desktop-agent-console`: Agent connection and browser capability views gain observable status and error summary requirements when applicable.

## Impact

- Affects `apps/desktop/src/main`, `apps/desktop/src/renderer`, and desktop tests around agent client, Playwright host, settings, and diagnostics surfaces.
- May require shared event names with backend and protocol changes to preserve cross-process correlation.
- No changes to browser automation permissions or bypass behavior are intended.
