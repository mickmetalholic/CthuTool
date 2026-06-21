## MODIFIED Requirements

### Requirement: Browser content module
The backend SHALL expose browser page content retrieval through `BrowserService`; any content-specific providers SHALL be internal implementation details that do not own public browser API routes, browser profile reporting routes, site configuration storage, browser auth coordination, or concrete agent/browser runtime command execution.

#### Scenario: Module exports content service
- **WHEN** another backend module needs controlled browser page content retrieval
- **THEN** it imports `BrowserModule` and receives `BrowserService` rather than importing `BrowserContentModule` or `BrowserContentService` directly

#### Scenario: Module imports runtime and site dependencies
- **WHEN** `BrowserService` is constructed
- **THEN** its browser execution dependency comes from `DesktopBrowserRuntimeModule` and its site configuration dependency comes from `SitesConfigModule`

#### Scenario: Module owns content pipeline providers
- **WHEN** `BrowserModule` is compiled
- **THEN** it registers or imports the internal task runner, block detector, and diagnostics store providers needed by content and screenshot workflows

### Requirement: Browser content reports interaction challenges
Browser content workflows exposed through `BrowserService` SHALL surface auth-required runtime outcomes as detection results or interaction challenges without mutating backend agent state or desktop pending task state.

#### Scenario: Required login is reported
- **WHEN** desktop browser runtime reports that login or profile verification is required for a content request
- **THEN** `BrowserService` returns a login-required detection and public interaction challenge metadata without creating a pending auth task

#### Scenario: Content is captured
- **WHEN** desktop browser runtime returns captured content
- **THEN** `BrowserService` continues to return the controlled content snapshot without exposing raw browser storage or transport internals
