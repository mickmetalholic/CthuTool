## MODIFIED Requirements

### Requirement: Browser auth workflow service
The backend SHALL keep browser login workflow semantics behind `BrowserService` while desktop remains the source of truth for actual browser login state and browser profile status is queried on demand through the desktop browser runtime.

#### Scenario: Auth status queries runtime
- **WHEN** a caller requests browser auth status for a configured site
- **THEN** `BrowserService` queries `DesktopBrowserRuntimeModule` for public profile status without reading raw cookies, localStorage, storage-state contents, desktop profile paths, or server-mirrored profile state

#### Scenario: Required site needs login
- **WHEN** a required-auth site has no verified browser profile according to the desktop browser runtime
- **THEN** `BrowserService` reports an operation-scoped login challenge for the configured site and profile without creating or returning a pending auth task

#### Scenario: Login state is desktop-owned
- **WHEN** a browser login completes or expires on desktop
- **THEN** the next explicit status or verification request reads the resulting public profile state from desktop instead of relying on pushed backend state snapshots

### Requirement: Browser auth uses desktop runtime on demand
The backend browser auth workflow SHALL be exposed through `BrowserService`, query desktop browser runtime status on demand, and SHALL NOT depend on server-mirrored agent browser profile state.

#### Scenario: Auth status is requested
- **WHEN** a caller requests auth status for a configured browser site/profile
- **THEN** `BrowserService` queries `DesktopBrowserRuntimeModule` and returns public profile status metadata

#### Scenario: Profile status is unavailable
- **WHEN** no eligible desktop browser runtime can answer the status query
- **THEN** `BrowserService` returns a structured availability or capability error without reading agent state projections

### Requirement: Browser auth returns interaction challenges
The backend browser auth workflow exposed through `BrowserService` SHALL return operation-scoped user interaction challenges when login or verification is required.

#### Scenario: Login is required
- **WHEN** a browser auth workflow detects a missing or expired required profile
- **THEN** it returns a challenge with site id, profile name, action type, login URL when available, and verification URL when available

#### Scenario: Login challenge is resolved
- **WHEN** a caller asks desktop to open login or verify the profile for a challenge
- **THEN** `BrowserService` dispatches the request through `DesktopBrowserRuntimeModule` and returns public verification status

## REMOVED Requirements

### Requirement: Agent-backed auth provider
**Reason**: Browser auth must not dispatch browser commands directly through the generic agent gateway or own agent-specific command details.
**Migration**: External callers use `BrowserService`; BrowserService uses `DesktopBrowserRuntimeModule`, which owns browser runtime protocol mapping and generic agent gateway dispatch.

#### Scenario: Auth provider is removed
- **WHEN** browser auth needs login opening or profile verification
- **THEN** `BrowserService` calls the desktop browser runtime instead of an agent-backed auth provider
