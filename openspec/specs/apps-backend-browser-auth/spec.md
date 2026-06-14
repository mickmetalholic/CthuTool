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

### Requirement: Browser auth task coordination
The backend SHALL coordinate pending browser auth tasks as workflow intent while storing public task state in agent state.

#### Scenario: Backend creates login intent
- **WHEN** backend needs a required-auth profile for a site and no verified profile is available
- **THEN** `BrowserAuthModule` creates or updates a pending auth task for the selected agent, site id, and profile name

#### Scenario: Duplicate login intent is coalesced
- **WHEN** multiple backend requests need the same site profile on the same agent
- **THEN** `BrowserAuthModule` updates the existing pending auth task rather than creating duplicates

#### Scenario: Verified profile resolves task
- **WHEN** desktop reports a verified profile for a pending site/profile
- **THEN** backend resolves or hides the matching pending auth task from public status

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

