## ADDED Requirements

### Requirement: Browser state snapshot projection
The backend browser automation module SHALL treat WebSocket browser state snapshots from desktop agents as authoritative non-sensitive projections for each reporting agent.

#### Scenario: Snapshot replaces agent profile projection
- **WHEN** the backend receives a browser state snapshot for an agent containing profile summaries
- **THEN** it replaces previously stored profile summaries for that agent with the profiles from the snapshot

#### Scenario: Snapshot replaces agent pending-auth projection
- **WHEN** the backend receives a browser state snapshot for an agent containing pending auth tasks
- **THEN** it replaces previously stored pending auth tasks for that agent with the tasks from the snapshot

#### Scenario: Empty snapshot clears agent browser projection
- **WHEN** the backend receives a browser state snapshot for an agent with empty profile and pending-auth arrays
- **THEN** it clears the backend browser state projection for that agent without affecting other agents

#### Scenario: Snapshot contains only public state
- **WHEN** the backend receives a browser state snapshot
- **THEN** it stores only agent id, site id, profile name, profile status, optional public display identity, timestamps, pending-auth reason, login URL, and verification URL

#### Scenario: Snapshot includes raw auth state
- **WHEN** a browser state snapshot includes cookies, localStorage values, storage-state contents, or desktop profile paths
- **THEN** the backend rejects or ignores those fields and does not persist them

## MODIFIED Requirements

### Requirement: Public profile summaries
The backend SHALL store and expose only public browser profile summaries reported by desktop agents as a non-sensitive projection of desktop-owned state.

#### Scenario: Agent reports verified profile
- **WHEN** a desktop agent reports a verified site profile through a browser state snapshot or compatible report endpoint
- **THEN** the backend stores the site id, profile name, agent id, status, optional display identity, and verification timestamp

#### Scenario: Agent reconnects with local profile state
- **WHEN** a desktop agent connects or reconnects and publishes its local profile summary snapshot over WebSocket
- **THEN** the backend replaces its public profile projection for that agent without receiving raw cookies, localStorage values, storage-state contents, or profile directory paths

#### Scenario: Raw auth state is not accepted
- **WHEN** a client or agent submits raw cookies, localStorage, or Playwright storage-state contents to backend browser profile APIs or WebSocket snapshot messages
- **THEN** the backend rejects or ignores those fields and does not persist them
