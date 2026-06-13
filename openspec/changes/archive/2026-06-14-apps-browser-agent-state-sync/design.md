## Context

The current browser auth flow keeps real login state in desktop-owned Playwright persistent profiles. The backend holds only public projections: profile summaries and pending auth tasks. That boundary is correct, but the sync path is split. Browser commands already travel through the agent WebSocket, while browser state is reported through backend HTTP endpoints after registration and local state changes.

This change makes the agent WebSocket the primary channel for both browser commands and browser state projection. Desktop remains the source of truth for cookies, storage, local profile directories, and local pending-auth state. Backend remains the state aggregator used by UI, browser automation, and future MCP-facing services.

## Goals / Non-Goals

**Goals:**

- Rebuild backend browser profile and pending-auth projections automatically after backend restart and desktop reconnect.
- Publish desktop browser state immediately after successful agent registration and after local profile or pending-auth changes.
- Keep state sync non-sensitive by sending only public profile summaries and pending auth task summaries.
- Keep UI read APIs stable while moving the write/report path to WebSocket messages.

**Non-Goals:**

- Persist backend profile registry or pending-auth tasks to a database.
- Move raw browser login state, cookies, storage-state files, localStorage, or profile paths to the backend.
- Add agent selection policy beyond the current browser-capable agent selection.
- Replace browser command request/response correlation.

## Decisions

1. Use full browser state snapshots instead of patch events.

   A snapshot contains `agentId`, public `profiles`, and public `pendingAuthTasks`. The backend treats each snapshot as authoritative for that agent and replaces previous browser state for that agent. This avoids patch ordering issues during reconnects and keeps backend restart recovery simple. The expected number of profiles and pending tasks is small, so full snapshots are cheaper than adding patch semantics now.

2. Send snapshots over the existing agent WebSocket.

   The agent connection is already responsible for registration, heartbeat, and browser commands. Reusing it keeps desktop-to-backend lifecycle aligned: if backend restarts, desktop reconnects and sends a fresh snapshot; if desktop disconnects, backend can mark the agent offline while keeping or hiding the last projection according to existing registry behavior.

3. Keep HTTP read APIs, demote HTTP write APIs.

   The UI can continue reading `/api/browser/sites`, `/api/browser/profiles`, and `/api/browser/pending-auth-tasks`. Existing HTTP report endpoints may remain temporarily for compatibility or tests, but the desktop main process should use WebSocket snapshots as the primary sync path.

4. Put protocol types in `@cthutool/agent-protocol`.

   The snapshot message should be part of the shared protocol package so backend and desktop validate the same shape. It should reuse existing public profile and pending-auth summary types rather than duplicating browser state models.

## Risks / Trade-offs

- [Risk] Full snapshots can overwrite newer backend state if stale messages arrive out of order. → Mitigation: process snapshots on the active registered connection for that agent only, and ignore messages from stale/replaced connections.
- [Risk] Backend restart can show empty state until desktop reconnects. → Mitigation: desktop reconnect logic already owns recovery; registration success MUST trigger an immediate snapshot.
- [Risk] Keeping HTTP write endpoints during migration can create two write paths. → Mitigation: tests should cover the WebSocket path as primary, and implementation should keep HTTP writes only as compatibility helpers until a later removal change.
- [Risk] State snapshots could accidentally grow to include sensitive fields. → Mitigation: shared protocol types must expose only public profile summaries and pending auth task summaries, and backend must ignore or reject raw auth-state fields.

## Migration Plan

1. Extend the shared agent protocol with a `browser.stateSnapshot` message.
2. Add backend WebSocket handling that routes snapshot messages into browser profile and pending-auth services.
3. Change backend browser state services to replace all entries for a reporting `agentId` from a snapshot.
4. Change desktop state reporting to send snapshots over WebSocket after registration and after local browser state changes.
5. Keep existing HTTP read APIs unchanged and leave HTTP write/report endpoints as compatibility paths unless this change explicitly removes them later.
