# apps-backend-browser-auth Specification

## Purpose
TBD - created by archiving change apps-backend-agent-browser-layer-split. Update Purpose after archive.
## Requirements
### Requirement: Browser auth workflow service
The backend SHALL provide a `BrowserAuthModule` that owns browser login workflow semantics while desktop remains the source of truth for actual browser login state.

#### Scenario: Auth status reads public agent state
- **WHEN** a caller requests browser auth status for a configured site
- **THEN** `BrowserAuthModule` reads public browser state from `AgentStateModule` and returns profile status without reading raw cookies, localStorage, storage-state contents, or desktop profile paths

#### Scenario: Required site needs login
- **WHEN** a required-auth site has no verified browser profile in public agent state
- **THEN** `BrowserAuthModule` reports a pending login need for the configured site and profile

#### Scenario: Login state is desktop-owned
- **WHEN** a browser login completes or expires on desktop
- **THEN** desktop reports the resulting public profile state to backend rather than backend writing real login state

### Requirement: Agent-backed auth provider
The backend SHALL hide desktop login and profile verification commands behind a browser auth provider interface.

#### Scenario: Login command is requested
- **WHEN** a user or backend workflow asks desktop to open a login flow for a configured site
- **THEN** the agent-backed auth provider sends a controlled browser auth command through `AgentCommandGateway`

#### Scenario: Profile verification command is requested
- **WHEN** backend needs to verify a configured browser profile
- **THEN** the agent-backed auth provider sends a controlled verification command through `AgentCommandGateway`

#### Scenario: Auth provider returns public result
- **WHEN** desktop responds to a login or verification command
- **THEN** the provider returns only public status metadata and does not return raw auth storage

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

