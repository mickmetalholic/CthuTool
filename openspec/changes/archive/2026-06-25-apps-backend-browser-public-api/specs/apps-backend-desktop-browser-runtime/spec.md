## ADDED Requirements

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
