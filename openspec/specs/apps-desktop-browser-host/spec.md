# apps-desktop-browser-host Specification

## Purpose
TBD - created by archiving change apps-browser-agent-auth. Update Purpose after archive.
## Requirements
### Requirement: Desktop browser capability
CthuDesktop SHALL advertise a browser capability after it can receive controlled browser commands from the backend and execute them through its local Playwright host.

#### Scenario: Browser capability is advertised
- **WHEN** CthuDesktop starts with browser host support enabled
- **THEN** its agent registration includes a browser capability that backend agent selection can use

#### Scenario: Browser capability is not advertised before readiness
- **WHEN** CthuDesktop cannot initialize the browser host or profile store
- **THEN** its agent registration does not advertise browser capability

### Requirement: Controlled browser command handling
CthuDesktop SHALL handle only structured browser commands from the backend and SHALL NOT execute arbitrary Playwright scripts received over the agent connection.

#### Scenario: Capture page command
- **WHEN** CthuDesktop receives a `browser.capturePage` command for a configured site and valid URL
- **THEN** it opens the page with the requested profile or anonymous context, captures only requested fields, and returns a correlated result

#### Scenario: Unknown browser command
- **WHEN** CthuDesktop receives an unsupported browser command type
- **THEN** it returns a structured command error without executing browser work

#### Scenario: Arbitrary script is rejected
- **WHEN** a browser command payload attempts to provide executable script text as the browser task
- **THEN** CthuDesktop rejects the command without evaluating that script

### Requirement: Desktop browser profile store
CthuDesktop SHALL store required-auth site profiles locally using persistent browser profile directories under Electron app data.

#### Scenario: Required profile is present
- **WHEN** a required site profile exists locally and is verified
- **THEN** CthuDesktop can use that persistent profile for browser commands that require the site profile

#### Scenario: Required profile is missing
- **WHEN** a required site profile does not exist locally
- **THEN** CthuDesktop reports the profile as missing and creates or updates a pending auth task

#### Scenario: Raw profile data remains local
- **WHEN** CthuDesktop reports profile status to the backend
- **THEN** it does not include raw cookies, localStorage values, storage-state contents, or profile directory paths

### Requirement: Desktop login and verification flow
CthuDesktop SHALL provide a user-driven login and verification flow for required-auth site profiles.

#### Scenario: User starts login
- **WHEN** the user starts login for a pending required site profile
- **THEN** CthuDesktop opens a headed browser window at the site's configured login URL using that profile's persistent context

#### Scenario: User verifies login
- **WHEN** the user requests verification after completing login
- **THEN** CthuDesktop navigates to the configured verification URL, determines profile status, and reports a public profile summary to the backend

#### Scenario: Login verification succeeds
- **WHEN** verification confirms the user is logged in
- **THEN** CthuDesktop marks the profile `verified`, resolves matching pending auth tasks, and reports the verified profile to the backend

#### Scenario: Login window closes after user login
- **WHEN** the user closes a headed login browser window for a required site profile
- **THEN** CthuDesktop automatically verifies the profile using the configured verification URL and updates local profile and pending auth state

#### Scenario: Login verification fails
- **WHEN** verification cannot confirm logged-in status
- **THEN** CthuDesktop marks the profile `login_required` or `blocked` and keeps a pending auth task open

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

### Requirement: Pending auth task UI
CthuDesktop SHALL display pending auth tasks generated from local preflight, backend requests, or runtime failures.

#### Scenario: Local preflight finds missing required profile
- **WHEN** CthuDesktop loads backend site configuration and a required site has no verified local profile
- **THEN** it displays a pending auth task for that site profile

#### Scenario: Backend requests missing auth
- **WHEN** the backend sends or exposes a pending auth task for a required profile
- **THEN** CthuDesktop displays or updates the matching pending auth task without creating duplicates

#### Scenario: Runtime failure expires profile
- **WHEN** browser access with a verified profile reaches a login page or receives an expired-auth detection
- **THEN** CthuDesktop marks the profile `expired`, stops using it for required tasks, and displays a re-login pending auth task

### Requirement: Anonymous browser access
CthuDesktop SHALL use isolated temporary browser contexts for anonymous site access.

#### Scenario: Anonymous site capture
- **WHEN** CthuDesktop receives a capture command for an anonymous site
- **THEN** it uses a temporary context that is not backed by a required-auth persistent profile

#### Scenario: Anonymous access does not create profile
- **WHEN** anonymous site capture completes
- **THEN** CthuDesktop does not create or modify a persistent site profile

### Requirement: Browser execution limits
CthuDesktop SHALL enforce browser task timeout, concurrency, payload size, and resource-blocking controls for commands received from the backend.

#### Scenario: Browser command times out
- **WHEN** a browser command exceeds its configured timeout
- **THEN** CthuDesktop stops the command and returns a structured timeout error

#### Scenario: Resource blocking is applied
- **WHEN** a capture command declares resource types to block
- **THEN** CthuDesktop blocks those resource types during navigation

#### Scenario: Large artifacts are bounded
- **WHEN** captured HTML or screenshot data exceeds configured response limits
- **THEN** CthuDesktop returns a structured size-limit result or diagnostic reference rather than an unbounded WebSocket payload
