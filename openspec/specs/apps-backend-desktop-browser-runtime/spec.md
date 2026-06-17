# apps-backend-desktop-browser-runtime Specification

## Purpose
TBD - created by archiving change apps-backend-agent-transport-boundary. Update Purpose after archive.
## Requirements
### Requirement: Desktop browser runtime module
The backend SHALL provide a `DesktopBrowserRuntimeModule` that exposes desktop browser capability operations without exposing agent transport internals or backend-local Playwright APIs.

#### Scenario: Browser runtime is consumed by backend services
- **WHEN** a backend browser service needs to execute browser work on a desktop client
- **THEN** it imports the desktop browser runtime module and uses browser capability methods rather than calling the agent registry or WebSocket server directly

#### Scenario: Playwright remains desktop-owned
- **WHEN** backend code uses the desktop browser runtime
- **THEN** it does not import Playwright browser, context, page, or storage-state APIs

### Requirement: Runtime commands use generic agent transport
The desktop browser runtime SHALL dispatch typed browser capability commands through the generic agent command gateway.

#### Scenario: Capture command is dispatched
- **WHEN** a caller requests a page capture through the desktop browser runtime
- **THEN** the runtime sends a typed browser capture command through the generic agent command gateway and maps the typed result to the runtime capture result

#### Scenario: Auth command is dispatched
- **WHEN** a caller requests login opening or profile verification through the desktop browser runtime
- **THEN** the runtime sends a typed browser auth command through the generic agent command gateway and returns public auth status metadata

#### Scenario: Runtime status is queried
- **WHEN** a caller requests browser profile status or runtime diagnostics
- **THEN** the runtime queries the selected desktop browser capability on demand rather than reading mirrored agent state

### Requirement: Browser runtime interaction challenges
The desktop browser runtime SHALL represent missing user action as operation-scoped interaction challenges.

#### Scenario: Auth is required
- **WHEN** a desktop browser operation cannot proceed because login or profile verification is required
- **THEN** the runtime returns or raises a structured challenge containing public site/profile/action metadata without creating an agent-owned pending task

#### Scenario: Challenge excludes sensitive data
- **WHEN** an interaction challenge is returned
- **THEN** it does not include cookies, localStorage values, storage-state contents, desktop profile paths, raw screenshots, or raw HTML
