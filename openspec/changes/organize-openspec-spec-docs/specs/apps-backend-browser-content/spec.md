## MODIFIED Requirements

### Requirement: Browser content module
The backend SHALL expose browser page content retrieval through `BrowserService`; any content-specific providers SHALL be internal implementation details that do not own public browser API routes, browser profile reporting routes, site configuration storage, browser auth coordination, or concrete agent/browser runtime command execution.

#### Scenario: Module exports content workflow
- **WHEN** another backend module needs controlled browser page content retrieval
- **THEN** it imports `BrowserModule` and receives `BrowserService` rather than importing content-specific providers directly

#### Scenario: Module imports runtime and site dependencies
- **WHEN** `BrowserService` is constructed
- **THEN** its browser execution dependency comes from `DesktopBrowserRuntimeModule` and its site configuration dependency comes from `SitesConfigModule`

#### Scenario: Module owns content pipeline providers
- **WHEN** `BrowserModule` is compiled
- **THEN** it registers or imports the internal task runner, block detector, and diagnostics store providers needed by content and screenshot workflows

### Requirement: Browser content orchestration
The backend SHALL retrieve controlled page content snapshots through `BrowserService` while preserving the existing content request and result contract.

#### Scenario: Fetch page content snapshot
- **WHEN** a backend module requests a page content snapshot for a configured site with HTML and text enabled
- **THEN** `BrowserService` returns the final URL, response status when available, page title when available, captured timestamp, optional HTML, optional text, auth usage metadata, selected agent metadata, and a detection result

#### Scenario: Request is normalized from site configuration
- **WHEN** a page content request omits site-derived values such as allowed origins, auth policy, profile name, timeout, login URL, verification URL, or default blocked resources
- **THEN** `BrowserService` resolves those values from `SitesConfigService` before invoking desktop browser runtime work

#### Scenario: Unknown site is rejected
- **WHEN** a page content request targets a URL that does not match any configured site origin and does not provide explicit allowed origins
- **THEN** `BrowserService` fails before dispatching browser work with `SITE_NOT_CONFIGURED`

### Requirement: Origin allowlist enforcement
The browser content workflow SHALL require each page content request to resolve to an allowed site origin and SHALL reject navigation outside that site's origins.

#### Scenario: URL origin is allowed
- **WHEN** a request URL has an origin listed by the resolved site configuration or explicit request allowed origins
- **THEN** `BrowserService` continues with desktop browser runtime dispatch

#### Scenario: URL origin is rejected
- **WHEN** a request URL has an origin not listed by the resolved allowed origins
- **THEN** `BrowserService` fails before desktop browser runtime dispatch with `ORIGIN_NOT_ALLOWED`

### Requirement: Task execution controls
The browser content workflow SHALL run browser tasks through controlled internal providers with timeout, concurrency, delay, and resource blocking controls.

#### Scenario: Concurrency limit is enforced
- **WHEN** multiple page content requests are submitted and the configured maximum concurrency is reached
- **THEN** additional requests wait for task capacity before starting browser capture

#### Scenario: Navigation times out
- **WHEN** a page content request exceeds its configured timeout
- **THEN** the task runner fails the task with `NAVIGATION_TIMEOUT`

#### Scenario: Resource blocking is forwarded
- **WHEN** a page content request declares resource types to block or resolves default blocked resources from site configuration
- **THEN** `BrowserService` forwards the blocked resource types to the desktop browser runtime request

### Requirement: Block detection
The browser content workflow SHALL classify access problems reported by browser capture results into structured detection states without attempting to bypass them.

#### Scenario: Rate limit is detected
- **WHEN** the capture result includes a rate-limit status or matching page content
- **THEN** `BrowserService` reports `rate_limited` detection and does not retry indefinitely

#### Scenario: Login requirement is detected
- **WHEN** the capture result includes a login page redirect or page content indicating that login is required
- **THEN** `BrowserService` reports `login_required` detection

#### Scenario: Captcha requirement is detected
- **WHEN** the capture result indicates captcha or abnormal access verification is required
- **THEN** `BrowserService` reports `captcha_required` detection and does not attempt automated captcha solving

### Requirement: Diagnostics storage
The browser content workflow SHALL store failure diagnostics behind diagnostic identifiers without returning raw sensitive artifacts by default.

#### Scenario: Failed request saves diagnostics
- **WHEN** a browser task fails or produces a blocked detection result and diagnostics are enabled
- **THEN** the backend stores diagnostic metadata and configured artifacts under the diagnostics directory and returns a diagnostics identifier

#### Scenario: Diagnostic artifacts are not returned inline
- **WHEN** a service result includes diagnostics
- **THEN** the result includes only diagnostic identifiers and summaries, not raw screenshots, HTML files, cookies, or storage-state contents

### Requirement: Browser content uses desktop runtime
The browser content workflow SHALL execute browser capture through `DesktopBrowserRuntimeModule` rather than an agent-named browser capture provider.

#### Scenario: Fetch page content snapshot
- **WHEN** `BrowserService` needs a browser capture snapshot
- **THEN** it delegates capture execution to `DesktopBrowserRuntimeModule` and receives a browser runtime capture result

#### Scenario: Agent transport stays hidden
- **WHEN** `BrowserService` handles a capture result
- **THEN** it does not access agent registry, raw WebSocket objects, command correlation maps, or agent state projection services

### Requirement: Browser content reports interaction challenges
Browser content workflows exposed through `BrowserService` SHALL surface auth-required runtime outcomes as detection results or interaction challenges without mutating backend agent state or desktop pending task state.

#### Scenario: Required login is reported
- **WHEN** desktop browser runtime reports that login or profile verification is required for a content request
- **THEN** `BrowserService` returns a login-required detection and public interaction challenge metadata without creating a pending auth task

#### Scenario: Content is captured
- **WHEN** desktop browser runtime returns captured content
- **THEN** `BrowserService` continues to return the controlled content snapshot without exposing raw browser storage or transport internals

### Requirement: Browser content observability
The browser content workflow SHALL emit observable events and metrics for site resolution, origin rejection, queueing, task execution, detection outcomes, timeouts, and diagnostics references.

#### Scenario: Blocked detection is correlated
- **WHEN** a browser content result reports a blocked, login-required, captcha-required, or rate-limited detection
- **THEN** the result and backend events include request context, site id when available, detection kind, summary, and diagnostics id when diagnostics are stored

#### Scenario: Origin rejection is observable
- **WHEN** a browser content request is rejected before dispatch because its origin is not allowed
- **THEN** the backend records an observable failure using a stable error code without navigating the browser runtime
