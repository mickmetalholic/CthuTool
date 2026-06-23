## Why

CthuDesktop is currently drifting between a local capability console and a business-tool surface. The default desktop experience should first make the host machine's readiness clear, remove the premature generic Tasks workspace, and reserve business tools such as Douban lookup for a later dedicated capability.

## What Changes

- Reframe the main Home workspace as a local readiness dashboard that combines backend connection, local agent status, online agent summary, browser runtime readiness, and browser-auth attention.
- Remove the top-level Tasks workspace from the primary activity bar for now.
- Migrate browser-auth task attention into Home summaries and the browser management workspace instead of maintaining a separate generic task center.
- Rename/reposition Browser Profiles as a host browser capability management workspace focused on local browser runtime, managed profiles, auth state, and login/verification actions.
- Remove Douban Movie lookup from the Home workspace.
- Keep Settings Logs as an explicit placeholder until local or server log retrieval is designed.
- Leave a future path for a separate business Tools workspace where Douban lookup can return later without mixing into Home.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-desktop-product-shell`: Home, primary navigation, page naming, and placeholder logs behavior change.
- `apps-desktop-browser-host`: Browser profile UI is reframed as host browser capability management, and pending auth tasks are surfaced there instead of through a generic Tasks workspace.
- `apps-desktop-task-center`: The current first-class Tasks workspace is removed/deferred until a broader task system is designed.

## Impact

- Affected renderer code: `apps/desktop/src/renderer/src/App.tsx`, `apps/desktop/src/renderer/src/styles.css`, and renderer tests.
- Affected shared page semantics: `@cthutool/app-shell` may need minor prop/text adjustments, but no new shared runtime dependency is required.
- Affected APIs: no backend, protocol, preload, or IPC API changes are required.
- Existing browser auth state and actions remain available through current backend browser status APIs and desktop preload browser actions.
