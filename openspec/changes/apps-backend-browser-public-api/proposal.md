## Why

External applications need to reuse CthuTool's desktop-hosted browser capability
for controlled crawler workflows without depending on internal backend modules or
the desktop agent WebSocket protocol. A public backend API provides a stable
boundary for those callers while preserving the existing rule that Playwright
state and profile data stay desktop-owned.

## What Changes

- Add a backend-owned public browser session API for third-party applications.
- Add a Playwright-like, controlled browser action model that supports stateful
  sessions through backend-routed desktop browser commands.
- Keep backend session state thin: backend stores session routing metadata, while
  CthuDesktop owns the Playwright context/page state.
- Enforce configured site origin allowlists, bounded action types, timeouts,
  payload limits, and cleanup semantics at the backend boundary.
- Do not add API key authentication in this change; the API is intended for
  trusted deployments first and can receive authentication in a later change.

## Capabilities

### New Capabilities

- `apps-backend-browser-public-api`: Public backend browser session and action
  API for third-party applications.

### Modified Capabilities

- `apps-backend-desktop-browser-runtime`: Add session lifecycle and action-runner
  operations that route to a selected desktop browser-capable agent.
- `apps-desktop-browser-host`: Add controlled browser session lifecycle and
  action execution commands backed by desktop-owned Playwright state.

## Impact

- Affected backend code: browser API controllers, browser session routing store,
  request validation, desktop runtime service, error mapping, tests, and docs.
- Affected protocol code: browser command/result message types for session
  creation, action execution, and session closure.
- Affected desktop code: browser host command handling, Playwright session store,
  action runner, TTL cleanup, and tests.
- Affected deployment behavior: the first implementation may keep session
  routing in backend memory and require a single backend instance or sticky
  routing; Redis-backed routing can be added later without changing the public
  API shape.
