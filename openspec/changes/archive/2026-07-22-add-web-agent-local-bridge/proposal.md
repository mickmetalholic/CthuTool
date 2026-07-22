## Why

The personal-use Agent needs a browser UI that reuses the deployed Web application across development, test, and production, but the local installation should not bundle or serve a second frontend. A narrow loopback bridge lets the selected environment's deployed Web page reach local settings, diagnostics, profiles, and controlled browser capabilities while the Agent remains windowless.

## What Changes

- Add an Agent loopback API on a dynamically selected port; it serves JSON only and no HTML, JavaScript, CSS, or Web application assets.
- Add an Agent console/settings route to the deployed Web application for each environment.
- Have tray and CLI open the active environment's trusted Web origin with loopback endpoint metadata and a short-lived one-time ticket in the URL fragment.
- Exchange the ticket for a short-lived in-memory bearer token; do not use cross-site/third-party cookies or persistent browser token storage.
- Require browser Local Network Access permission, exact active-environment Origin/CORS validation, exact Host validation, non-simple authenticated requests, and ticket replay protection.
- Expose sanitized environment/runtime/Chrome/profile/diagnostic state, safe settings mutations, lifecycle adapter actions, and existing controlled browser operations through the bridge.
- Use HTTP Fetch RPC and bounded polling for the initial implementation; do not depend on cross-browser insecure WebSocket behavior.

## Capabilities

### New Capabilities

- `apps-agent-local-bridge`: Loopback-only JSON API, one-time Web launch tickets, origin-bound in-memory sessions, local settings/diagnostics/profile access, and controlled browser operations.
- `apps-web-agent-console`: Deployed Web route that connects to the selected local Agent, handles browser permission/connection states, and presents local Agent controls using the shared Web UI.

### Modified Capabilities

None.

## Impact

- Affects the headless Agent, `apps/web`, tray/CLI browser opening, environment-origin policy, browser compatibility tests, and security headers.
- Removes all local frontend assets and settings-page serving from the Agent release bundle.
- Depends on `extract-local-agent-runtime` and `add-agent-environment-routing`; the tray consumes its launch-ticket contract.
