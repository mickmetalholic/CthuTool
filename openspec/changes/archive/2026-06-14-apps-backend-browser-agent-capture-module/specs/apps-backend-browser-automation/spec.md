## MODIFIED Requirements

### Requirement: Browser provider abstraction
The backend SHALL hide browser capture execution details behind a browser capture provider abstraction supplied by `BrowserAgentCaptureModule` and SHALL NOT include a backend-local Playwright provider as a supported implementation.

#### Scenario: Agent provider creates content snapshot
- **WHEN** the configured provider is the agent-backed browser capture provider and a page content request is accepted
- **THEN** `BrowserContentService` uses the `BROWSER_CAPTURE_PROVIDER` binding from `BrowserAgentCaptureModule`, and the provider dispatches a controlled browser command through the agent command gateway before returning the requested content snapshot from the agent response

#### Scenario: Provider can be replaced later
- **WHEN** a future browser runtime provider is added
- **THEN** business modules using the browser content service do not need to change their content request or result handling contract

### Requirement: Agent-backed browser provider
The backend browser automation module SHALL consume agent-backed browser capture through `BrowserAgentCaptureModule` rather than registering the concrete agent-backed provider directly.

#### Scenario: Browser-capable agent is available
- **WHEN** an accepted browser content request targets a site that can be served by an online browser-capable desktop agent
- **THEN** `BrowserContentService` delegates capture execution through `BROWSER_CAPTURE_PROVIDER` and receives a browser capture snapshot without depending on `AgentCommandGateway` directly

#### Scenario: No browser-capable agent is available
- **WHEN** an accepted browser content request requires browser execution and no online desktop agent advertises browser capability
- **THEN** the backend fails the request with `AGENT_NOT_AVAILABLE` or `AGENT_CAPABILITY_MISSING` without starting local Playwright

#### Scenario: Browser automation module wiring
- **WHEN** `BrowserAutomationModule` is compiled
- **THEN** it imports `BrowserAgentCaptureModule` and does not register `AgentBrowserCaptureProvider` or the agent-backed capture provider token itself
