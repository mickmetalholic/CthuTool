## ADDED Requirements

### Requirement: Browser agent capture module
The backend SHALL provide a `BrowserAgentCaptureModule` that owns agent-backed browser capture execution without owning browser content orchestration, site configuration, diagnostics persistence, task running, or public browser API routes.

#### Scenario: Module exports capture provider
- **WHEN** `BrowserAutomationModule` needs a browser capture provider
- **THEN** it imports `BrowserAgentCaptureModule` and receives the `BROWSER_CAPTURE_PROVIDER` binding from that module

#### Scenario: Module imports command and auth dependencies
- **WHEN** the agent-backed capture provider is constructed
- **THEN** its required agent command gateway and browser auth dependencies are provided through module imports rather than direct registration in `BrowserAutomationModule`

### Requirement: Agent browser command mapping
The backend SHALL map accepted browser capture requests to desktop agent browser protocol commands inside `BrowserAgentCaptureModule`.

#### Scenario: Capture command is dispatched
- **WHEN** an accepted browser capture request is executed
- **THEN** the agent-backed capture provider selects a browser-capable agent, sends a correlated `browser.capturePage` command through `AgentCommandGateway`, and includes the configured URL, site id, auth policy, profile name, login URL, verification URL, timeout, wait strategy, content inclusion flags, and blocked resource types

#### Scenario: Agent success is mapped to snapshot
- **WHEN** a desktop agent returns a successful browser result
- **THEN** the provider maps final URL, status, title, optional HTML, optional text, optional screenshot, detection, and agent id into a backend browser capture snapshot without exposing raw protocol transport internals

### Requirement: Agent browser error mapping
The backend SHALL map desktop agent browser errors into stable backend browser automation errors inside `BrowserAgentCaptureModule`.

#### Scenario: Missing browser-capable agent
- **WHEN** no online desktop agent advertises browser capability
- **THEN** the provider fails before dispatch with `AGENT_NOT_AVAILABLE` or `AGENT_CAPABILITY_MISSING` without starting local Playwright

#### Scenario: Auth-required error records pending auth
- **WHEN** a browser-capable agent reports missing auth for a required site profile
- **THEN** the provider maps the error to `AUTH_PROFILE_REQUIRED` and records or updates the pending auth task through `BrowserAuthModule`

#### Scenario: Expired auth error records pending auth
- **WHEN** a browser-capable agent reports expired auth for a required site profile
- **THEN** the provider maps the error to `AUTH_PROFILE_EXPIRED` and records or updates the pending auth task through `BrowserAuthModule`

#### Scenario: Other agent browser error is stable
- **WHEN** a browser-capable agent reports a non-auth browser command error
- **THEN** the provider maps the error to a stable backend browser command failure without mutating pending auth state
