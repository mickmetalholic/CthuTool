## Why

Settings is currently a mixed configuration/status surface, while Home has just been narrowed to a local readiness dashboard. The desktop app needs a clearer Settings information architecture so detailed connection, local runtime, diagnostics, and placeholder log information live in predictable settings sections without expanding backend or logging scope.

## What Changes

- Reorganize Settings into explicit configuration and diagnostics sections with stable labels and page intent.
- Keep service/environment editing in the Service Connection section and keep Home free of detailed backend configuration controls.
- Make local runtime and diagnostics detail easier to scan from Settings, including agent identity, app metadata, local paths, browser runtime diagnostics, and connection timing/error information.
- Keep Logs visible as a not-connected placeholder only; do not add log streaming, log retrieval, local log persistence, or new IPC/API contracts in this change.
- Keep unfinished Appearance/theme controls out of the active Settings navigation unless they are represented as a clear fixed-theme/token-system state.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-desktop-product-shell`: Clarify Settings as the detailed configuration and diagnostics center, with explicit section ownership for service connection, local runtime/status, diagnostics, logs placeholder, and appearance readiness.

## Impact

- Affects the desktop renderer Settings navigation, Settings page content, shell status deep links, and renderer tests.
- Does not change backend APIs, Electron preload contracts, persisted config schema, browser profile behavior, or logging infrastructure.
