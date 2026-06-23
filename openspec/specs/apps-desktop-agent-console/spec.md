# apps-desktop-agent-console Specification

## Purpose
TBD - created by archiving change apps-desktop-agent-console. Update Purpose after archive.
## Requirements
### Requirement: Desktop workspace application
The system SHALL add a first-class Electron desktop application package under the root workspace.

#### Scenario: Desktop package is included in the workspace
- **WHEN** dependencies are installed from the repository root
- **THEN** the desktop application package is discovered by the existing `apps/*` pnpm workspace pattern

#### Scenario: Desktop development commands are available
- **WHEN** a developer inspects the desktop package scripts
- **THEN** the package exposes commands for development, build, typecheck, and tests

### Requirement: Desktop backend connection configuration
The desktop application SHALL let the user configure and persist the backend URL and local agent identity.

#### Scenario: Backend URL is configured
- **WHEN** the user enters a backend URL in the desktop app
- **THEN** the desktop app stores the URL in local desktop configuration and uses it for future backend connections

#### Scenario: Agent identity is generated
- **WHEN** the desktop app starts without an existing agent id
- **THEN** it generates and persists a stable local agent id for future registrations

#### Scenario: Agent display metadata is editable
- **WHEN** the user changes the local device display name
- **THEN** the next registration uses the updated display name while keeping the stable agent id

### Requirement: Desktop WebSocket agent connection
The desktop main process SHALL connect to the configured backend WebSocket endpoint and register the desktop instance as an agent.

#### Scenario: Agent registers after connection
- **WHEN** the desktop app establishes a WebSocket connection to the backend
- **THEN** it sends an `agent.hello` message containing agent id, device name, platform, app version, and capabilities

#### Scenario: Agent sends heartbeats
- **WHEN** the desktop app remains connected to the backend
- **THEN** it sends heartbeat messages on the configured interval

#### Scenario: Agent reconnects after interruption
- **WHEN** the backend connection closes unexpectedly
- **THEN** the desktop app marks itself disconnected and retries connection with backoff until a connection is restored or the user disables the connection

#### Scenario: Initial capabilities are empty
- **WHEN** the first desktop app version registers with the backend
- **THEN** it declares an empty capabilities list and does not advertise browser or host-control capabilities

### Requirement: Desktop management home page
The desktop renderer SHALL provide a management home page backed by desktop connection state and backend APIs.

#### Scenario: Local connection state is visible
- **WHEN** the desktop app is running
- **THEN** the home page shows the configured backend URL, connection status, local agent id, local display name, and last connection error when present

#### Scenario: Connected agents are visible
- **WHEN** the desktop app is connected to the backend and the backend returns online agents
- **THEN** the home page displays the backend's connected agent list with agent id, display name, platform, version, capabilities, connection state, and last seen time

#### Scenario: Agent list refresh handles failure
- **WHEN** the home page cannot fetch the connected agent list from the backend
- **THEN** it shows a recoverable error state without clearing local connection configuration

### Requirement: Desktop console remains a frontend only
The desktop renderer SHALL not own business data, browser parsing, Douban logic, or MCP behavior.

#### Scenario: Renderer reads backend APIs
- **WHEN** the renderer displays agent data
- **THEN** it obtains that data from backend APIs or main-process connection state rather than maintaining an independent registry

#### Scenario: Browser controls are absent
- **WHEN** the first desktop console version is opened
- **THEN** it does not expose controls for launching browsers, fetching pages, verifying Douban login, or executing host tasks

### Requirement: Agent console observable state
The desktop agent console SHALL display agent and browser capability status using observable state summaries that can be correlated with backend and local diagnostics.

#### Scenario: Agent status includes freshness
- **WHEN** the agent console displays the local agent connection
- **THEN** it includes connection status, last registration or heartbeat freshness, backend URL context, and last safe error summary when available

#### Scenario: Browser capability status is visible
- **WHEN** browser capability is unavailable or degraded
- **THEN** the agent console displays a safe runtime diagnostic summary and does not expose local profile internals

