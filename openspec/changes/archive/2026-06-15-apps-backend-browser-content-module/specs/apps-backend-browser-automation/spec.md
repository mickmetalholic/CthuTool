## MODIFIED Requirements

### Requirement: Internal browser content service
The backend SHALL make internal browser content retrieval available through `BrowserContentModule`, while `BrowserAutomationModule` SHALL consume and export that module as part of the public browser backend composition.

#### Scenario: Fetch page content snapshot
- **WHEN** a backend module requests a page content snapshot for a configured site with HTML and text enabled
- **THEN** the service returns the final URL, response status when available, page title when available, captured timestamp, optional HTML, optional text, auth usage metadata, selected agent metadata, and a detection result

#### Scenario: Raw browser page is not exposed
- **WHEN** a backend module uses the browser content service
- **THEN** the service result does not expose a raw Playwright page, browser context, cookies, localStorage, storage-state file contents, or desktop profile path

#### Scenario: Agent infrastructure is hidden
- **WHEN** a backend module uses the browser content service
- **THEN** the service result does not expose raw WebSocket connections, command correlation maps, agent registry internals, or agent state storage internals

#### Scenario: Browser automation composes browser content
- **WHEN** `BrowserAutomationModule` is compiled
- **THEN** it imports `BrowserContentModule` and does not directly register browser content pipeline providers

### Requirement: Browser provider abstraction
The backend SHALL hide browser capture execution details behind a browser capture provider abstraction supplied to `BrowserContentModule` by `BrowserAgentCaptureModule` and SHALL NOT include a backend-local Playwright provider as a supported implementation.

#### Scenario: Agent provider creates content snapshot
- **WHEN** the configured provider is the agent-backed browser capture provider and a page content request is accepted
- **THEN** `BrowserContentService` uses the `BROWSER_CAPTURE_PROVIDER` binding from `BrowserAgentCaptureModule`, and the provider dispatches a controlled browser command through the agent command gateway before returning the requested content snapshot from the agent response

#### Scenario: Provider can be replaced later
- **WHEN** a future browser runtime provider is added
- **THEN** business modules using the browser content service do not need to change their content request or result handling contract

### Requirement: Backend browser site configuration
The backend browser automation module SHALL expose public browser site configuration APIs from `SitesConfigModule`, while `BrowserContentModule` SHALL consume effective site configurations from `SitesConfigModule` for page content request resolution.

#### Scenario: Required site is configured
- **WHEN** a backend module requests browser content for a URL whose origin matches a configured required-auth site
- **THEN** the browser content module resolves the site id, default profile name, login URL, verification URL, and `required` auth policy from `SitesConfigService` before dispatching any browser task

#### Scenario: Anonymous site is configured
- **WHEN** a backend module requests browser content for a URL whose origin matches a configured anonymous site
- **THEN** the browser content module resolves the site id and `anonymous` auth policy from `SitesConfigService` without requiring any profile

#### Scenario: Unknown site is rejected
- **WHEN** a backend module requests browser content for a URL that does not match any configured site origin
- **THEN** the browser content module fails before dispatching browser work with a `SITE_NOT_CONFIGURED` error

#### Scenario: JSON override updates built-in site
- **WHEN** backend starts with a browser sites JSON file that overrides a built-in site by `siteId`
- **THEN** `/api/browser/sites` and browser content resolution use the merged site configuration exposed by `SitesConfigModule`

#### Scenario: JSON override is invalid
- **WHEN** backend starts with an explicit browser sites JSON file that cannot be read or validated
- **THEN** backend startup fails with a configuration error that identifies the file and validation issue

#### Scenario: No JSON override is configured
- **WHEN** backend starts without a browser sites JSON file path
- **THEN** browser automation and browser content use the built-in default site configuration exposed by `SitesConfigModule`

### Requirement: Agent-backed browser provider
The backend browser automation module SHALL consume agent-backed browser capture through `BrowserContentModule` and `BrowserAgentCaptureModule` rather than registering content pipeline providers or the concrete agent-backed provider directly.

#### Scenario: Browser-capable agent is available
- **WHEN** an accepted browser content request targets a site that can be served by an online browser-capable desktop agent
- **THEN** `BrowserContentService` delegates capture execution through `BROWSER_CAPTURE_PROVIDER` and receives a browser capture snapshot without depending on `AgentCommandGateway` directly

#### Scenario: No browser-capable agent is available
- **WHEN** an accepted browser content request requires browser execution and no online desktop agent advertises browser capability
- **THEN** the backend fails the request with `AGENT_NOT_AVAILABLE` or `AGENT_CAPABILITY_MISSING` without starting local Playwright

#### Scenario: Browser automation module wiring
- **WHEN** `BrowserAutomationModule` is compiled
- **THEN** it imports `BrowserContentModule` and does not register `BrowserContentService`, `BrowserTaskRunner`, `BrowserBlockDetector`, `BrowserDiagnosticsStore`, `AgentBrowserCaptureProvider`, or the agent-backed capture provider token itself
