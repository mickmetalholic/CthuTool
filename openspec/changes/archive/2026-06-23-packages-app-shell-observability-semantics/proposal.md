## Why

Shared app-shell pages are used across host contexts, but status, diagnostics, and frontend console behavior are not defined as reusable runtime semantics. App-shell observability semantics will let web and desktop surfaces present observable state consistently without leaking host-specific details.

## What Changes

- Define shared frontend logger semantics for scoped development console diagnostics, event naming, levels, correlation fields, and safe redaction.
- Define runtime status presentation semantics for backend connectivity, agent state, browser runtime state, diagnostics availability, and degraded modes.
- Define shared UI patterns for observable notices, status lists, metric summaries, and diagnostics links without requiring nested host-specific cards or raw logs.
- Define host adapter expectations for providing observable state while preserving web-safe rendering.
- Keep collector/exporter concerns out of scope; this change focuses on shared UI/runtime semantics.

## Capabilities

### New Capabilities

- `packages-app-shell-observability`: Shared frontend logger, observable status presentation, diagnostics display, and host adapter semantics for app-shell pages.

### Modified Capabilities

- `packages-app-shell-runtime`: Runtime contracts gain observable state, diagnostics presentation, and safe console diagnostics requirements.

## Impact

- Affects `packages/app-shell` runtime types, shared page composition, status components, and type tests.
- Coordinates with `apps-web-observability` and `apps-desktop-observability` so host-specific apps can provide data through a shared shape.
- Does not require new telemetry consumers or backend APIs by itself.
