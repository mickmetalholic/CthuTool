## Why

Browser login state is owned by each desktop agent, but the backend currently learns profile and pending-auth state through separate HTTP reports. This leaves reconnect and backend restart recovery split across two channels, even though the existing agent WebSocket is already the durable control channel between backend and desktop.

## What Changes

- Add browser state snapshot messages to the agent WebSocket protocol so desktop agents publish non-sensitive profile summaries and pending auth tasks immediately after registration and after local browser state changes.
- Make the backend replace the stored browser state projection for the reporting agent when it receives a snapshot, allowing backend restart recovery to happen naturally when desktop agents reconnect.
- Keep browser cookies, localStorage, storage-state data, and profile paths local to desktop agents; only public summaries travel over WebSocket.
- Keep existing HTTP read APIs for UI status. HTTP write/report endpoints may remain temporarily for compatibility but should no longer be the primary sync path.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-backend-agent-registry`: Accept and dispatch browser state snapshot messages from registered desktop agents over the existing agent WebSocket.
- `apps-backend-browser-automation`: Treat WebSocket browser state snapshots as the source for backend profile and pending-auth projections, replacing per-agent state on each snapshot.
- `apps-desktop-browser-host`: Publish browser state snapshots after registration and after local profile or pending-auth state changes.

## Impact

- Affects the shared agent protocol package, backend agent WebSocket handling, backend browser profile/pending-auth services, desktop agent client/main process state reporting, and related tests.
- Does not change where real login state is stored; desktop persistent browser profiles remain the source of truth.
- Does not require database persistence for backend profile registry or pending-auth tasks.
