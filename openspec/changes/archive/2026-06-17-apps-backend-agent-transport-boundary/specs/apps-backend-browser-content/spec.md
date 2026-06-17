## ADDED Requirements

### Requirement: Browser content uses desktop runtime
The browser content module SHALL execute browser capture through `DesktopBrowserRuntimeModule` rather than an agent-named browser capture provider.

#### Scenario: Fetch page content snapshot
- **WHEN** `BrowserContentService` needs a browser capture snapshot
- **THEN** it delegates capture execution to `DesktopBrowserRuntimeModule` and receives a browser runtime capture result

#### Scenario: Agent transport stays hidden
- **WHEN** `BrowserContentService` handles a capture result
- **THEN** it does not access agent registry, raw WebSocket objects, command correlation maps, or agent state projection services

### Requirement: Browser content reports interaction challenges
The browser content module SHALL surface auth-required runtime outcomes as detection results or interaction challenges without mutating backend agent state.

#### Scenario: Required login is reported
- **WHEN** desktop browser runtime reports that login or profile verification is required for a content request
- **THEN** `BrowserContentService` returns a login-required detection and public interaction challenge metadata without creating a pending auth task

#### Scenario: Content is captured
- **WHEN** desktop browser runtime returns captured content
- **THEN** `BrowserContentService` continues to return the controlled content snapshot without exposing raw browser storage or transport internals
