# apps-backend-desktop-browser-runtime Specification

## Purpose
Define the backend desktop browser runtime client for typed browser operations, session lifecycle commands, runtime errors, challenges, and observability.

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

### Requirement: Desktop browser runtime session operations
The backend desktop browser runtime SHALL expose session lifecycle operations
for public browser API services without exposing agent transport internals.

#### Scenario: Create desktop browser session command
- **WHEN** a backend service requests browser session creation
- **THEN** the desktop browser runtime sends a typed session creation command
  through the generic agent command gateway and returns public session metadata

#### Scenario: Run desktop browser session actions
- **WHEN** a backend service requests action execution for an existing browser
  session
- **THEN** the desktop browser runtime sends a typed action command to the
  session's owning desktop agent and maps the result to ordered action results

#### Scenario: Close desktop browser session command
- **WHEN** a backend service requests browser session closure
- **THEN** the desktop browser runtime sends a typed close command to the
  session's owning desktop agent and reports success or a structured runtime
  error

### Requirement: Runtime session transport boundary
The desktop browser runtime SHALL keep public browser session operations behind
the existing agent command gateway boundary.

#### Scenario: Runtime hides WebSocket transport
- **WHEN** public browser API code creates sessions, runs actions, or closes
  sessions
- **THEN** it uses desktop browser runtime methods rather than accessing raw
  WebSocket connections, command correlation maps, or agent registry internals

#### Scenario: Runtime does not import Playwright
- **WHEN** desktop browser runtime code implements session operations
- **THEN** it does not import Playwright browser, context, page, locator, or
  storage-state APIs

#### Scenario: Runtime maps interaction challenge
- **WHEN** desktop reports that a required profile needs login or verification
- **THEN** the runtime returns public challenge metadata without creating raw
  pending-auth state or exposing browser profile internals

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

### Requirement: Desktop browser runtime observability
The backend desktop browser runtime SHALL preserve request and command correlation while reporting selected agent availability, browser capability status, command outcome, and runtime diagnostics.

#### Scenario: Runtime unavailable is observable
- **WHEN** no online desktop agent has browser capability
- **THEN** the runtime returns its existing unavailable result and emits an observable event with a stable reason code and request correlation metadata when available

#### Scenario: Runtime command result is correlated
- **WHEN** a desktop browser runtime command completes or fails
- **THEN** the backend records the JSON-RPC id, agent id, runtime method, duration, and outcome without exposing raw browser artifacts
