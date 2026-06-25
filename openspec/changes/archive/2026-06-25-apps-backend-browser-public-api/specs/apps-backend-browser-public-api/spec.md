## ADDED Requirements

### Requirement: Public browser session API
The backend SHALL expose a public browser session API for trusted third-party
applications without exposing the desktop agent WebSocket protocol.

#### Scenario: Create browser session
- **WHEN** a caller requests a browser session for a configured site
- **THEN** the backend selects an online desktop agent with browser capability,
  creates a desktop browser session through the desktop browser runtime, stores a
  thin backend routing record, and returns an opaque public session ID

#### Scenario: Browser agent unavailable
- **WHEN** a caller requests a browser session and no desktop browser-capable
  agent is online
- **THEN** the backend returns a structured browser unavailable error without
  creating a routing record

#### Scenario: Unknown site is rejected
- **WHEN** a caller requests a browser session for an unknown site ID
- **THEN** the backend rejects the request before dispatching desktop browser
  work

### Requirement: Browser session routing store
The backend SHALL maintain browser session routing metadata separately from
desktop-owned Playwright state.

#### Scenario: Routing record is created
- **WHEN** a browser session is created successfully
- **THEN** the backend records the session ID, owning agent ID, site ID when
  present, profile name when present, creation timestamp, last-used timestamp,
  expiry timestamp, and active status

#### Scenario: Routing record is used
- **WHEN** a caller submits actions for an active session
- **THEN** the backend resolves the owning agent from the routing store and
  routes the action command to that same agent

#### Scenario: Missing routing record
- **WHEN** a caller submits actions for a session ID that is absent, closed, or
  expired in the routing store
- **THEN** the backend returns a structured session-not-found or session-expired
  error without broadcasting the command to all agents

### Requirement: Stateful browser action execution
The backend SHALL execute third-party browser work as bounded action lists within
an existing browser session.

#### Scenario: Run supported actions
- **WHEN** a caller submits supported browser actions for an active session
- **THEN** the backend validates the actions, forwards them through the desktop
  browser runtime, refreshes the session last-used timestamp, and returns ordered
  action results

#### Scenario: Unsupported action is rejected
- **WHEN** a caller submits an unsupported browser action type
- **THEN** the backend rejects the request before dispatching desktop browser
  work

#### Scenario: Action failure is reported
- **WHEN** desktop action execution fails for navigation, selector, timeout, or
  browser availability reasons
- **THEN** the backend returns a structured error that identifies the failing
  action without exposing cookies, localStorage, storage-state contents, profile
  paths, or raw transport internals

### Requirement: Public browser API safety controls
The backend SHALL enforce configured browser safety controls even when API
authentication is not part of the change.

#### Scenario: Origin allowlist is enforced
- **WHEN** a create-session request or action navigates to a URL whose origin is
  not allowed by the resolved site configuration
- **THEN** the backend rejects the request before desktop dispatch

#### Scenario: Sensitive state is not returned
- **WHEN** a session is created, actions are executed, or a session is closed
- **THEN** the backend response does not include cookies, localStorage values,
  Playwright storage-state contents, desktop profile paths, or raw WebSocket
  objects

#### Scenario: Payload limits are enforced
- **WHEN** action input or requested output exceeds configured size or timeout
  limits
- **THEN** the backend rejects or truncates the operation according to the public
  browser API limit contract

### Requirement: Browser session closure and cleanup
The backend SHALL provide explicit and automatic cleanup for public browser
sessions.

#### Scenario: Close browser session
- **WHEN** a caller closes an active browser session
- **THEN** the backend routes a close command to the owning desktop agent and
  removes or marks closed the backend routing record

#### Scenario: Expired session cleanup
- **WHEN** a browser session exceeds its expiry time
- **THEN** the backend stops routing new actions for that session and attempts to
  close the matching desktop browser session

#### Scenario: Desktop disconnect cleanup
- **WHEN** the owning desktop agent disconnects while sessions are active
- **THEN** the backend treats those sessions as unavailable and expires or closes
  their routing records
