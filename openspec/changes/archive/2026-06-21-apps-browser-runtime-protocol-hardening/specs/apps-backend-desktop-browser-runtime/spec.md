## MODIFIED Requirements

### Requirement: Runtime commands use generic agent transport
The desktop browser runtime SHALL dispatch typed browser runtime operations through JSON-RPC command envelopes carried by the generic agent command gateway.

#### Scenario: Capture command is dispatched
- **WHEN** a caller requests a page capture through the desktop browser runtime
- **THEN** the runtime builds a `browser.capturePage` JSON-RPC request through browser runtime protocol helpers, sends it through the generic agent command gateway, and maps the browser runtime result to the runtime capture result

#### Scenario: Auth command is dispatched
- **WHEN** a caller requests login opening or profile verification through the desktop browser runtime
- **THEN** the runtime builds the matching browser runtime JSON-RPC request through browser runtime protocol helpers and returns public auth status metadata

#### Scenario: Runtime status is queried
- **WHEN** a caller requests browser profile status or runtime diagnostics
- **THEN** the runtime queries the selected desktop browser capability on demand rather than reading mirrored agent state

### Requirement: Browser runtime interaction challenges
The desktop browser runtime SHALL represent missing user action as operation-scoped interaction challenges.

#### Scenario: Auth is required
- **WHEN** a desktop browser operation cannot proceed because login or profile verification is required
- **THEN** the runtime returns or raises a structured challenge containing public site/profile/action metadata without creating an agent-owned, backend-owned, or desktop pending task

#### Scenario: Challenge excludes sensitive data
- **WHEN** an interaction challenge is returned
- **THEN** it does not include cookies, localStorage values, storage-state contents, desktop profile paths, raw screenshots, or raw HTML

## ADDED Requirements

### Requirement: Runtime is not a business facade
The desktop browser runtime SHALL remain a lower-level backend client for typed desktop browser runtime operations and SHALL NOT own site policy, profile permission policy, content diagnostics, or business module integration.

#### Scenario: Business module needs browser workflow
- **WHEN** a backend business module needs page content, screenshots, auth status, login opening, or profile verification
- **THEN** it calls `BrowserService` instead of calling `DesktopBrowserRuntimeService` directly

#### Scenario: BrowserService dispatches runtime work
- **WHEN** `BrowserService` has resolved site policy and needs desktop execution
- **THEN** it calls `DesktopBrowserRuntimeService` with typed runtime options

### Requirement: Runtime maps browser JSON-RPC errors
The desktop browser runtime SHALL parse browser runtime JSON-RPC errors and convert browser application errors into runtime errors or operation-scoped challenges.

#### Scenario: Browser challenge error is returned
- **WHEN** the desktop agent returns a JSON-RPC error whose `error.data` contains a browser interaction challenge
- **THEN** the runtime exposes that challenge to the caller without asking the agent registry or task center for mirrored state

#### Scenario: Non-browser command error is returned
- **WHEN** the desktop agent returns a JSON-RPC error without a browser challenge
- **THEN** the runtime exposes a structured runtime failure with the JSON-RPC error code, message, and public data
