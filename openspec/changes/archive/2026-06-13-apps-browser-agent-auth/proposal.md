## Why

Browser authentication state should live with the desktop machine that owns and runs the browser. The current backend-local Playwright and CLI auth-bundle model spreads login state across backend, CLI, and future desktop flows, which makes profile ownership unclear and does not match the new desktop-agent architecture.

## What Changes

- Reframe backend `browser-automation` as an orchestration module backed by connected desktop agents instead of a backend-local Playwright runtime.
- Remove `LocalPlaywrightProvider` from the supported browser provider path rather than keeping it as a fallback.
- Move browser profile storage, login, verification, and Playwright persistent-context execution into CthuDesktop.
- Add backend-managed site configuration with `anonymous` or `required` auth policy only.
- Add pending auth tasks so missing or expired required site profiles become user-visible desktop tasks.
- Add a controlled backend-to-desktop browser command protocol for page capture, profile verification, login opening, and profile clearing.
- **BREAKING**: remove/deprecate CLI browser login/auth-bundle creation commands; CLI may only inspect backend browser sites, profiles, and pending auth tasks.

## Capabilities

### New Capabilities
- `apps-desktop-browser-host`: Desktop-owned Playwright browser host, local browser profiles, site login verification, and pending auth task UI.

### Modified Capabilities
- `apps-backend-browser-automation`: Browser automation becomes agent-backed orchestration with site config, auth-policy enforcement, pending auth task coordination, and no backend-local Playwright provider or backend-stored auth bundles.
- `apps-cli-agent-contract`: CLI browser/auth commands no longer create or upload login state and must behave as non-owning backend status clients.

## Impact

- Affected backend modules: `apps/backend/src/modules/browser-automation`, agent registry dispatch, site configuration, pending auth task APIs, diagnostics.
- Affected desktop modules: `apps/desktop` main process, agent WebSocket client, renderer browser/profile/pending task views, local profile storage.
- Affected shared protocol: `packages/agent-protocol` gains controlled browser command and response messages.
- Affected CLI: remove or deprecate login/auth-bundle commands and update docs/tests to point users to CthuDesktop for login.
- The backend will no longer persist cookies, localStorage, storage-state JSON, or raw browser profiles.
