# apps-backend-agent-state Specification

## Purpose
TBD - created by archiving change apps-backend-agent-browser-layer-split. Update Purpose after archive.
## Requirements
### Requirement: Agent public state projection
The backend SHALL provide an `AgentStateModule` that stores public state projections reported by connected desktop agents without storing raw local secrets or agent implementation internals.

#### Scenario: Agent state snapshot is accepted
- **WHEN** a registered desktop agent sends a valid state snapshot over its active WebSocket connection
- **THEN** `AgentStateModule` stores the public state projection for that agent id

#### Scenario: Agent state snapshot replaces prior state
- **WHEN** a registered desktop agent sends a newer state snapshot
- **THEN** `AgentStateModule` replaces that agent's previous projected state slice with the snapshot contents

#### Scenario: Stale connection snapshot is ignored
- **WHEN** an older WebSocket connection for an agent sends a state snapshot after a newer connection is authoritative
- **THEN** backend ignores the stale snapshot and keeps the authoritative agent projection

#### Scenario: Raw sensitive state is rejected
- **WHEN** a state snapshot includes cookies, localStorage values, storage-state contents, profile directory paths, raw file contents, private connection tokens, or WebSocket objects
- **THEN** backend rejects or ignores those fields and does not persist them

### Requirement: Browser state slice
The backend SHALL model browser profile summaries and pending auth tasks as a browser state slice within `AgentStateModule`.

#### Scenario: Browser profile projection is stored
- **WHEN** a desktop agent reports browser profile summaries
- **THEN** backend stores only agent id, site id, profile name, profile status, optional display identity, timestamps, and public verification metadata

#### Scenario: Pending auth task projection is stored
- **WHEN** a desktop agent reports pending browser auth tasks
- **THEN** backend stores only agent id, site id, profile name, pending reason, login URL, verification URL, and timestamps

#### Scenario: Empty browser state clears agent slice
- **WHEN** a desktop agent reports an empty browser profile and pending-auth snapshot
- **THEN** backend clears that agent's browser state slice without affecting other agents or other state slices

#### Scenario: Browser state is queryable
- **WHEN** backend browser auth or UI services need public browser state
- **THEN** they can query `AgentStateModule` without reading desktop profile directories or raw auth state

### Requirement: Capability-neutral state slices
The backend SHALL keep the agent state projection model capable of holding future non-browser state slices without requiring browser automation module dependencies.

#### Scenario: Unknown future state slice appears
- **WHEN** a desktop agent reports a syntactically valid state slice that backend does not understand yet
- **THEN** backend ignores or preserves only safe public metadata without failing browser state projection

#### Scenario: Browser automation is not required
- **WHEN** `AgentStateModule` starts
- **THEN** it does not require browser content, browser diagnostics, site config, or browser command provider services to initialize

