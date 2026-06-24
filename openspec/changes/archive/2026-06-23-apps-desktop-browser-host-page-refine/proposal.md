## Why

Browser Host now has the correct product position, but the page still reads like a lightly renamed browser profile list. The next optimization should make it a focused host browser management surface before adding unrelated business pages or a separate logging system.

## What Changes

- Reorganize Browser Host around clear sections for runtime readiness, managed site profiles, browser-auth attention, and recent action feedback.
- Make pending browser-auth attention easier to scan and resolve from the Browser Host page without reintroducing a generic Tasks workspace.
- Improve per-site/profile action states so login, verify, and clear feedback is associated with the affected row rather than only a global message.
- Preserve existing backend browser status APIs, local pending-auth fallback, and explicit user-driven browser actions.
- Keep logs out of scope; this change will not add log streaming, log storage, or log IPC/API contracts.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-desktop-browser-host`: Refine Browser Host page requirements for runtime readiness, managed profile scanning, browser-auth attention, per-row action feedback, and resilient loading/error states.

## Impact

- Affected code: `apps/desktop/src/renderer/src/App.tsx`, `apps/desktop/src/renderer/src/styles.css`, and renderer tests under `apps/desktop/tests/renderer/`.
- Affected specs: `openspec/specs/apps-desktop-browser-host/spec.md`.
- No backend API, preload IPC, browser automation, profile storage, or logging-system changes are intended.
