## Purpose
Define backend-owned browser automation services, browser auth profiles, controlled diagnostics, and CLI auth helper behavior for internal page content retrieval.
## Requirements
### Requirement: Internal browser content service
The backend SHALL provide an internal browser content service that retrieves controlled page content snapshots for other backend modules by dispatching browser work to desktop agents.

#### Scenario: Fetch page content snapshot
- **WHEN** a backend module requests a page content snapshot for a configured site with HTML and text enabled
- **THEN** the service returns the final URL, response status when available, page title when available, captured timestamp, optional HTML, optional text, auth usage metadata, selected agent metadata, and a detection result

#### Scenario: Raw browser page is not exposed
- **WHEN** a backend module uses the browser content service
- **THEN** the service result does not expose a raw Playwright page, browser context, cookies, localStorage, storage-state file contents, or desktop profile path

### Requirement: Browser provider abstraction
The backend SHALL hide browser runtime details behind an agent-backed provider abstraction and SHALL NOT include a backend-local Playwright provider as a supported implementation.

#### Scenario: Agent provider creates content snapshot
- **WHEN** the configured provider is the agent browser provider and a page content request is accepted
- **THEN** the provider dispatches a controlled browser command to a selected desktop agent and returns the requested content snapshot from the agent response

#### Scenario: Provider can be replaced later
- **WHEN** a future browser runtime provider is added
- **THEN** business modules using the browser content service do not need to change their content request or result handling contract

### Requirement: Origin allowlist enforcement
The browser content service SHALL require each page content request to resolve to a configured site origin and SHALL reject navigation outside that site's origins.

#### Scenario: URL origin is allowed
- **WHEN** a request URL has an origin listed by the resolved site configuration
- **THEN** the service continues with agent browser dispatch

#### Scenario: URL origin is rejected
- **WHEN** a request URL has an origin not listed by the resolved site configuration
- **THEN** the service fails before agent dispatch with an `ORIGIN_NOT_ALLOWED` error

### Requirement: Task execution controls
The browser content service SHALL run browser tasks through a controlled task runner with timeout, concurrency, retry, and resource blocking controls.

#### Scenario: Concurrency limit is enforced
- **WHEN** multiple page content requests are submitted and the configured maximum concurrency is reached
- **THEN** additional requests wait for task capacity before starting browser navigation

#### Scenario: Navigation times out
- **WHEN** a page content request exceeds its configured timeout
- **THEN** the service stops the navigation task and returns a `NAVIGATION_TIMEOUT` error or failed detection result

#### Scenario: Resource blocking is applied
- **WHEN** a page content request declares resource types to block
- **THEN** the browser provider blocks those resource types during navigation

### Requirement: Block and auth detection
The browser content service SHALL classify access problems reported by desktop agents into structured detection states rather than attempting to bypass them.

#### Scenario: Rate limit is detected
- **WHEN** the desktop agent reports a rate-limit status or matching page content
- **THEN** the service reports `rate_limited` detection and does not retry indefinitely

#### Scenario: Login requirement is detected
- **WHEN** the desktop agent reports a login page redirect or page content indicating that login is required
- **THEN** the service reports `login_required` detection and updates pending auth state when the site auth policy is required

#### Scenario: Captcha requirement is detected
- **WHEN** the desktop agent reports that page content indicates captcha or abnormal access verification is required
- **THEN** the service reports `captcha_required` detection and does not attempt automated captcha solving

### Requirement: Diagnostics storage
The browser content service SHALL store failure diagnostics behind diagnostic identifiers without returning raw sensitive artifacts by default.

#### Scenario: Failed request saves diagnostics
- **WHEN** a browser task fails or produces a blocked detection result and diagnostics are enabled
- **THEN** the backend stores diagnostic metadata and configured artifacts under the diagnostics directory and returns a diagnostics identifier

#### Scenario: Diagnostic artifacts are not returned inline
- **WHEN** a service result includes diagnostics
- **THEN** the result includes only diagnostic identifiers and summaries, not raw screenshots, HTML files, cookies, or storage-state contents

### Requirement: Backend browser site configuration
The backend browser automation module SHALL consume effective site configurations from the backend sites config module, using the shared config package data shape to map allowed origins to site identifiers, auth policy, login URL, verification URL, default profile name, and detection hints.

#### Scenario: Required site is configured
- **WHEN** a backend module requests browser content for a URL whose origin matches a configured required-auth site
- **THEN** the browser automation module resolves the site id, default profile name, login URL, verification URL, and `required` auth policy from `SitesConfigService` before dispatching any browser task

#### Scenario: Anonymous site is configured
- **WHEN** a backend module requests browser content for a URL whose origin matches a configured anonymous site
- **THEN** the browser automation module resolves the site id and `anonymous` auth policy from `SitesConfigService` without requiring any profile

#### Scenario: Unknown site is rejected
- **WHEN** a backend module requests browser content for a URL that does not match any configured site origin
- **THEN** the browser automation module fails before dispatching browser work with a `SITE_NOT_CONFIGURED` error

#### Scenario: JSON override updates built-in site
- **WHEN** backend starts with a browser sites JSON file that overrides a built-in site by `siteId`
- **THEN** `/api/browser/sites` and browser content resolution use the merged site configuration exposed by `SitesConfigModule`

#### Scenario: JSON override is invalid
- **WHEN** backend starts with an explicit browser sites JSON file that cannot be read or validated
- **THEN** backend startup fails with a configuration error that identifies the file and validation issue

#### Scenario: No JSON override is configured
- **WHEN** backend starts without a browser sites JSON file path
- **THEN** browser automation uses the built-in default site configuration exposed by `SitesConfigModule`

### Requirement: Agent-backed browser provider
The backend SHALL dispatch browser content requests through a connected desktop agent that advertises browser capability.

#### Scenario: Browser-capable agent is available
- **WHEN** an accepted browser content request targets a site that can be served by an online browser-capable desktop agent
- **THEN** the backend sends a correlated browser command to that agent and maps the agent response into the browser content service result

#### Scenario: No browser-capable agent is available
- **WHEN** an accepted browser content request requires browser execution and no online desktop agent advertises browser capability
- **THEN** the backend fails the request with `AGENT_NOT_AVAILABLE` or `AGENT_CAPABILITY_MISSING` without starting local Playwright

### Requirement: Pending auth task coordination
The backend SHALL create or update pending auth tasks when required site auth is missing or expired on the selected desktop agent.

#### Scenario: Required profile is missing
- **WHEN** a browser content request targets a required-auth site and the selected agent has not reported a verified profile for that site
- **THEN** the backend records or updates a pending auth task with reason `missing` and returns `AUTH_PROFILE_REQUIRED`

#### Scenario: Required profile expires during access
- **WHEN** a desktop agent reports that a required profile produced a login-required or expired-auth result during browser access
- **THEN** the backend records or updates a pending auth task with reason `expired` and marks the public profile summary as unavailable

#### Scenario: Duplicate pending task is coalesced
- **WHEN** multiple requests need the same site profile on the same desktop agent
- **THEN** the backend updates the existing open pending auth task instead of creating duplicate tasks

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
