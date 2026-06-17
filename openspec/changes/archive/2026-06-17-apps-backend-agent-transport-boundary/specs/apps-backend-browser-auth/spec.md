## ADDED Requirements

### Requirement: Browser auth uses desktop runtime on demand
The backend browser auth workflow SHALL query desktop browser runtime status on demand and SHALL NOT depend on server-mirrored agent browser profile state.

#### Scenario: Auth status is requested
- **WHEN** a caller requests auth status for a configured browser site/profile
- **THEN** `BrowserAuthModule` queries `DesktopBrowserRuntimeModule` and returns public profile status metadata

#### Scenario: Profile status is unavailable
- **WHEN** no eligible desktop browser runtime can answer the status query
- **THEN** `BrowserAuthModule` returns a structured availability or capability error without reading agent state projections

### Requirement: Browser auth returns interaction challenges
The backend browser auth workflow SHALL return operation-scoped user interaction challenges when login or verification is required.

#### Scenario: Login is required
- **WHEN** a browser auth workflow detects a missing or expired required profile
- **THEN** it returns a challenge with site id, profile name, action type, login URL when available, and verification URL when available

#### Scenario: Login challenge is resolved
- **WHEN** a caller asks desktop to open login or verify the profile for a challenge
- **THEN** `BrowserAuthModule` dispatches the request through `DesktopBrowserRuntimeModule` and returns public verification status

## REMOVED Requirements

### Requirement: Browser auth task coordination
**Reason**: Pending auth tasks create backend-owned global task state before the product workflow is defined.

**Migration**: Use operation-scoped interaction challenges. If a future product workflow needs durable tasks, it SHALL own that state outside the agent layer.
