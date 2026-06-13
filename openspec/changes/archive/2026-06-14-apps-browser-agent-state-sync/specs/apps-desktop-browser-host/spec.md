## MODIFIED Requirements

### Requirement: Desktop browser state projection
CthuDesktop SHALL publish non-sensitive local browser state snapshots to the backend over the agent WebSocket after connection and after local profile or pending-auth state changes.

#### Scenario: Agent connects with local browser state
- **WHEN** CthuDesktop is registered with the backend and its browser host is ready
- **THEN** it publishes a `browser.stateSnapshot` message containing local profile summaries and pending auth tasks without including cookies, storage-state contents, localStorage values, or profile paths

#### Scenario: Local browser state changes
- **WHEN** profile verification, login expiry detection, login window auto-verification, or profile clearing changes local browser state
- **THEN** CthuDesktop publishes an updated `browser.stateSnapshot` message over the active agent WebSocket connection

#### Scenario: Backend reconnect succeeds
- **WHEN** CthuDesktop reconnects to the backend after a backend restart or network interruption
- **THEN** it sends a fresh full browser state snapshot after successful registration acknowledgement

#### Scenario: Agent WebSocket is unavailable
- **WHEN** local browser state changes while CthuDesktop is disconnected from the backend
- **THEN** CthuDesktop keeps the local state and sends the latest full snapshot after the next successful registration

#### Scenario: Raw profile data remains local
- **WHEN** CthuDesktop reports browser state to the backend
- **THEN** it does not include raw cookies, localStorage values, storage-state contents, or profile directory paths
