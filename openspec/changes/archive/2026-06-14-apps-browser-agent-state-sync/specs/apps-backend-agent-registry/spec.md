## ADDED Requirements

### Requirement: Browser state snapshot WebSocket messages
The backend agent WebSocket server SHALL accept browser state snapshot messages from registered desktop agents and dispatch them without exposing raw WebSocket internals to browser automation services.

#### Scenario: Registered agent sends browser state snapshot
- **WHEN** a registered desktop agent sends a valid `browser.stateSnapshot` message over its active WebSocket connection
- **THEN** the backend dispatches the snapshot to the browser automation state projection handler with the registered agent id and snapshot payload

#### Scenario: Unregistered socket sends browser state snapshot
- **WHEN** a socket sends a `browser.stateSnapshot` message before successful `agent.hello` registration
- **THEN** the backend rejects or ignores the message without updating browser profile or pending-auth state

#### Scenario: Replaced connection sends stale snapshot
- **WHEN** an older connection for an agent id sends a `browser.stateSnapshot` after a newer connection has become authoritative
- **THEN** the backend ignores the stale snapshot and keeps the authoritative connection's state projection

#### Scenario: Invalid browser state snapshot is rejected
- **WHEN** a registered agent sends a malformed `browser.stateSnapshot` payload
- **THEN** the backend logs a validation summary and does not update browser profile or pending-auth state
