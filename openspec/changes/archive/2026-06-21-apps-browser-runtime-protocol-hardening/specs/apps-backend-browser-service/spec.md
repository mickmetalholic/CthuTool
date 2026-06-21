## ADDED Requirements

### Requirement: BrowserModule aggregate boundary
The backend SHALL expose `BrowserModule` as the public aggregate module for backend browser workflows.

#### Scenario: Business module imports browser functionality
- **WHEN** a backend business module needs browser-backed content, screenshots, auth status, login, verification, or public browser workflow data
- **THEN** it imports `BrowserModule` and receives `BrowserService` from that module

#### Scenario: Browser internals are organized
- **WHEN** browser runtime, content helpers, auth helpers, detection, diagnostics, and site policy providers are implemented
- **THEN** they are imported or provided behind `BrowserModule` without becoming separate public dependencies for backend business modules

#### Scenario: Browser module exports are checked
- **WHEN** `BrowserModule` exports providers
- **THEN** it exports the public browser facade and does not export raw agent gateway, raw protocol helpers, or raw Playwright/runtime internals to business modules

### Requirement: BrowserService facade
The backend SHALL expose a `BrowserService` facade as the single supported browser workflow entry point for backend business modules.

#### Scenario: Business module needs page content
- **WHEN** a backend business module needs browser-backed page content
- **THEN** it imports `BrowserModule` and calls `BrowserService` rather than importing content, auth, desktop runtime, agent gateway, or protocol packages directly

#### Scenario: Business module needs screenshot
- **WHEN** a backend business module needs a browser-backed screenshot
- **THEN** it calls a typed `BrowserService` browser workflow method that applies site policy, auth/profile policy, and runtime challenge mapping before dispatching desktop browser work

#### Scenario: Business module needs auth action
- **WHEN** a backend business module or API needs profile status, login opening, or profile verification
- **THEN** it calls `BrowserService` auth workflow methods instead of calling `DesktopBrowserRuntimeService` directly

### Requirement: BrowserService owns browser workflow policy
`BrowserService` SHALL own backend browser workflow policy above `DesktopBrowserRuntimeService`.

#### Scenario: Site options are resolved
- **WHEN** a browser workflow request names a site or target URL
- **THEN** `BrowserService` resolves configured site metadata, allowed origins, auth policy, profile name, login URL, verification URL, timeout, and default blocked resources before dispatching runtime work

#### Scenario: URL is outside allowlist
- **WHEN** a browser workflow request targets an origin not allowed by resolved site policy
- **THEN** `BrowserService` rejects the request before dispatching desktop browser runtime work

#### Scenario: Runtime challenge is returned
- **WHEN** `DesktopBrowserRuntimeService` returns an interaction challenge
- **THEN** `BrowserService` surfaces a public browser-domain challenge or error without creating backend state snapshots or pending auth tasks

### Requirement: BrowserService owns content capture policy
`BrowserService` SHALL provide content and screenshot workflows that centralize detection, diagnostics, timeout, and safe result shaping.

#### Scenario: Page content is captured
- **WHEN** a caller requests page content through `BrowserService`
- **THEN** the service returns final URL, response status when available, page title when available, captured timestamp, optional HTML, optional text, auth usage metadata, detection result, and optional diagnostics reference

#### Scenario: Screenshot is captured
- **WHEN** a caller requests a screenshot through `BrowserService`
- **THEN** the service returns a bounded screenshot result or diagnostic reference without exposing cookies, localStorage values, storage-state contents, desktop profile paths, or raw transport payloads

#### Scenario: Blocked access is detected
- **WHEN** a content or screenshot workflow encounters login-required, captcha, abnormal access, rate limiting, or blocked content
- **THEN** `BrowserService` returns a structured detection or challenge and does not attempt to bypass the restriction

### Requirement: BrowserService does not expose raw Playwright
`BrowserService` SHALL expose product-approved browser workflows and SHALL NOT expose raw Playwright primitives.

#### Scenario: Raw browser primitive is requested
- **WHEN** backend code needs arbitrary selectors, script evaluation, page objects, browser contexts, cookies, storage state, or user default Chrome profile access
- **THEN** `BrowserService` does not provide that primitive and the workflow must be modeled as a typed browser runtime operation first

#### Scenario: Runtime operation is needed
- **WHEN** a new browser capability is required
- **THEN** the capability is added as a typed browser runtime protocol method and then surfaced through `BrowserService` only when it matches an approved backend workflow
