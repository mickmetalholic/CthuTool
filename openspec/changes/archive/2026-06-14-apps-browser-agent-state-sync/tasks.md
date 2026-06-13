## 1. Shared Protocol

- [x] 1.1 Add a `browser.stateSnapshot` message type to `@cthutool/agent-protocol` with public profile summaries and pending auth task summaries only.
- [x] 1.2 Extend protocol validation/tests to accept valid browser snapshots and reject raw auth-state fields or malformed payloads.

## 2. Backend WebSocket Handling

- [x] 2.1 Update the backend agent WebSocket server to accept `browser.stateSnapshot` only from registered authoritative agent connections.
- [x] 2.2 Route valid browser snapshots from the WebSocket layer into the browser automation module without exposing socket internals.
- [x] 2.3 Add backend tests for registered snapshots, unregistered snapshots, stale replaced connections, and malformed snapshots.

## 3. Backend Browser State Projection

- [x] 3.1 Add replace-by-agent behavior to browser profile registry so snapshots replace all profiles for the reporting agent.
- [x] 3.2 Add replace-by-agent behavior to pending auth task storage so snapshots replace all pending auth tasks for the reporting agent.
- [x] 3.3 Keep existing browser status HTTP read APIs backed by the updated projections.
- [x] 3.4 Keep or adapt existing HTTP write/report endpoints only as compatibility paths while WebSocket snapshots become the primary sync path.

## 4. Desktop State Publishing

- [x] 4.1 Add desktop agent client support for sending `browser.stateSnapshot` messages over the active WebSocket.
- [x] 4.2 Replace desktop HTTP state reporting with WebSocket snapshot publishing after registration acknowledgement.
- [x] 4.3 Publish a fresh full snapshot after local profile verification, login-window auto-verification, login expiry detection, pending-auth changes, and profile clearing.
- [x] 4.4 Ensure state changes while disconnected are retained locally and published after the next successful registration.

## 5. Verification

- [x] 5.1 Run focused protocol, backend agent registry, backend browser automation, and desktop browser host tests.
- [x] 5.2 Run desktop typecheck and backend build.
- [x] 5.3 Run `openspec validate apps-browser-agent-state-sync --type change --strict`.
