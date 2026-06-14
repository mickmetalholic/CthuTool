## MODIFIED Requirements

### Requirement: Internal browser content service
The backend SHALL provide an internal browser content service that retrieves controlled page content snapshots for other backend modules through a browser capture provider.

#### Scenario: Fetch page content snapshot
- **WHEN** a backend module requests a page content snapshot for a configured site with HTML and text enabled
- **THEN** the service returns the final URL, response status when available, page title when available, captured timestamp, optional HTML, optional text, auth usage metadata, selected agent metadata, and a detection result

#### Scenario: Raw browser page is not exposed
- **WHEN** a backend module uses the browser content service
- **THEN** the service result does not expose a raw Playwright page, browser context, cookies, localStorage, storage-state file contents, or desktop profile path

#### Scenario: Agent infrastructure is hidden
- **WHEN** a backend module uses the browser content service
- **THEN** the service result does not expose raw WebSocket connections, command correlation maps, agent registry internals, or agent state storage internals

### Requirement: Browser provider abstraction
The backend SHALL hide browser capture execution details behind a browser capture provider abstraction and SHALL NOT include a backend-local Playwright provider as a supported implementation.

#### Scenario: Agent provider creates content snapshot
- **WHEN** the configured provider is the agent-backed browser capture provider and a page content request is accepted
- **THEN** the provider dispatches a controlled browser command through the agent command gateway and returns the requested content snapshot from the agent response

#### Scenario: Provider can be replaced later
- **WHEN** a future browser runtime provider is added
- **THEN** business modules using the browser content service do not need to change their content request or result handling contract

### Requirement: Agent-backed browser provider
The backend SHALL dispatch browser capture requests through a browser capture provider implementation backed by an online desktop agent that advertises browser capability.

#### Scenario: Browser-capable agent is available
- **WHEN** an accepted browser content request targets a site that can be served by an online browser-capable desktop agent
- **THEN** the agent-backed capture provider sends a correlated browser command through `AgentCommandGateway` and maps the agent response into the browser content service result

#### Scenario: No browser-capable agent is available
- **WHEN** an accepted browser content request requires browser execution and no online desktop agent advertises browser capability
- **THEN** the backend fails the request with `AGENT_NOT_AVAILABLE` or `AGENT_CAPABILITY_MISSING` without starting local Playwright

### Requirement: Pending auth task coordination
The backend SHALL coordinate required browser auth through `BrowserAuthModule` and public agent state when required site auth is missing or expired on the selected desktop agent.

#### Scenario: Required profile is missing
- **WHEN** a browser content request targets a required-auth site and no selected agent has reported a verified profile for that site
- **THEN** browser automation receives `AUTH_PROFILE_REQUIRED` from the auth/capture boundary and `BrowserAuthModule` records or updates a pending auth task with reason `missing`

#### Scenario: Required profile expires during access
- **WHEN** a desktop agent reports that a required profile produced a login-required or expired-auth result during browser access
- **THEN** `BrowserAuthModule` records or updates a pending auth task with reason `expired` and public agent state marks the profile summary as unavailable

#### Scenario: Duplicate pending task is coalesced
- **WHEN** multiple requests need the same site profile on the same desktop agent
- **THEN** `BrowserAuthModule` updates the existing open pending auth task instead of creating duplicate tasks

## REMOVED Requirements

### Requirement: Browser state snapshot projection
**Reason**: Browser state snapshots are public agent state projections and should be owned by `AgentStateModule`, not browser automation.
**Migration**: Route existing `browser.stateSnapshot` WebSocket messages to `AgentStateModule` while keeping public API behavior compatible.

### Requirement: Public profile summaries
**Reason**: Public browser profile summaries are a browser state slice within agent state; backend browser automation should consume them through browser auth or agent state readers instead of owning storage.
**Migration**: Move profile summary storage and pending-auth projection storage into `AgentStateModule`, then let `BrowserAuthModule` expose browser-specific status and workflows.
