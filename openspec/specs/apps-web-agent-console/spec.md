# apps-web-agent-console Specification

## Purpose
Define the deployed Web Agent console's secure local-bridge bootstrap, Local Network Access UX, management UI, transport, and route isolation.
## Requirements
### Requirement: Deployed Web Agent route
Each supported environment Web deployment SHALL provide an Agent console/settings route that is served by the Web application rather than the local Agent.

#### Scenario: Tray opens active environment
- **WHEN** tray or CLI opens the selected environment's Agent URL with a valid endpoint/ticket fragment
- **THEN** the deployed route renders using the environment's shared Web UI and starts the local bridge connection flow

#### Scenario: Page is opened directly
- **WHEN** the route loads without a bridge ticket
- **THEN** it may show cloud state but directs the operator to open/reconnect the local Agent through tray or CLI and does not scan localhost ports

### Requirement: Safe fragment bootstrap
The Web route SHALL read loopback endpoint, environment id, and one-time ticket only from the URL fragment, exchange it immediately, clear it from browser history state, and retain the returned bearer only in memory.

#### Scenario: Bootstrap succeeds
- **WHEN** the fragment environment matches the deployment and ticket exchange succeeds
- **THEN** the page clears bootstrap data and uses the memory token for subsequent JSON RPC

#### Scenario: Deployment environment mismatches
- **WHEN** the fragment or bridge reports another active environment
- **THEN** the page does not request an environment switch and instructs the operator to select the matching tray environment

#### Scenario: Page reloads
- **WHEN** a connected page reloads after fragment data was cleared
- **THEN** it requires a fresh launch from tray or CLI rather than reading a persisted bearer

### Requirement: Local Network Access UX
The Web route SHALL distinguish browser permission, Agent-not-running, ticket-expired, Origin-denied, version-incompatible, backend-offline, and healthy states.

#### Scenario: Browser permission is required
- **WHEN** loopback Fetch triggers a Local Network Access prompt
- **THEN** the page explains why the selected environment needs access and waits for the user's decision

#### Scenario: Permission is denied
- **WHEN** the browser blocks loopback access
- **THEN** the page provides browser-appropriate remediation and does not claim the Agent is uninstalled without further evidence

#### Scenario: Bridge version is incompatible
- **WHEN** Web and local bridge protocol versions cannot negotiate
- **THEN** the page presents an Agent/CLI update action without attempting unsupported operations

### Requirement: High-trust Agent route isolation
The deployed Agent route SHALL use restrictive security policy, self-hosted code, and no advertising, analytics, or unnecessary third-party scripts while it holds a local bearer token.

#### Scenario: Agent route responses are inspected
- **WHEN** the route is served in production
- **THEN** its CSP and asset graph restrict executable code to the approved self-hosted application bundle

#### Scenario: Telemetry captures an error
- **WHEN** bootstrap or RPC fails
- **THEN** telemetry excludes URL fragments, endpoint tickets, bearer tokens, authorization headers, backend secrets, cookies, and raw local payloads

### Requirement: Local Agent management UI
The route SHALL present active environment/readiness, backend state, Chrome runtime, environment-scoped profiles, autostart, versions, diagnostics, and safe settings controls from bridge resources.

#### Scenario: Local Agent is connected
- **WHEN** bridge bootstrap succeeds
- **THEN** the page shows current local state and only actions supported by the negotiated bridge version

#### Scenario: Destructive profile action is selected
- **WHEN** the operator requests profile deletion
- **THEN** the page requires explicit confirmation and presents lock/error outcomes from the bridge

### Requirement: Local controlled browser UI
The deployed route SHALL invoke only documented controlled browser operations and SHALL render bounded progress, results, challenges, and errors without raw local authentication state.

#### Scenario: Browser operation runs
- **WHEN** the operator starts a supported local browser action
- **THEN** the page sends the versioned bridge command and displays correlated bounded status/result

#### Scenario: Browser challenge occurs
- **WHEN** the Agent returns a supported login or access challenge
- **THEN** the page presents an actionable public challenge state without cookies, profile contents, or arbitrary scripts

### Requirement: Fetch-first bridge transport
The first Agent console release SHALL work through Fetch JSON RPC and bounded polling without requiring WebSocket support.

#### Scenario: Browser does not allow insecure local WebSocket
- **WHEN** Fetch loopback access is supported but `ws://` is unavailable or gated differently
- **THEN** settings, diagnostics, and controlled operations remain usable through Fetch/polling
