# apps-backend-browser-service Specification

## Purpose
Define BrowserModule and BrowserService as the backend aggregate boundary for approved browser workflows and browser workflow policy.

## Requirements
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

### Requirement: Browser service anchors backend browser documentation
The backend browser documentation SHALL identify `BrowserService` as the business-facing aggregate boundary for approved browser workflows, while lower-level runtime, protocol, content, auth, diagnostics, and site-policy details remain in their owning capability specs.

#### Scenario: Capability map lists backend browser workflow owner
- **WHEN** a developer reads the OpenSpec capability map for backend browser workflows
- **THEN** `apps-backend-browser-service` is identified as the aggregate entry point for business-facing browser workflows
- **AND** lower-level runtime or protocol capabilities are listed as supporting boundaries rather than alternate business-module entry points

#### Scenario: Browser internals stay linked to owning specs
- **WHEN** the capability map describes browser content, auth, runtime protocol, public API, or client SDK capabilities
- **THEN** it links those capabilities to their owning specs without moving their requirements into the map

### Requirement: Browser agent capture capability retired
The backend SHALL NOT expose browser capture as an agent-named module capability; browser capture execution MUST be owned by `apps-backend-desktop-browser-runtime`.

#### Scenario: Capture execution is requested
- **WHEN** backend browser content or auth workflows need desktop browser capture
- **THEN** they use `desktop-browser-runtime` instead of `BrowserAgentCaptureModule`

### Requirement: Browser automation composition module retired
The backend SHALL NOT expose `BrowserAutomationModule` as a standalone browser domain or composition module, and the `apps/backend/src/modules/browser-automation/` directory SHALL remain absent after surviving errors, types, auth helpers, and stores move under browser-owned module boundaries.

#### Scenario: Browser behavior is registered
- **WHEN** the backend application starts
- **THEN** it imports browser auth, content, sites, and desktop runtime modules directly instead of importing `BrowserAutomationModule`

#### Scenario: Browser automation directory is absent
- **WHEN** backend source files are checked after migration
- **THEN** no code imports from `apps/backend/src/modules/browser-automation/` or from relative `browser-automation` paths

#### Scenario: Surviving shared code has browser-owned paths
- **WHEN** browser errors, content types, auth bundle helpers, or auth state stores remain necessary
- **THEN** they live under `apps/backend/src/modules/browser/shared`, `apps/backend/src/modules/browser/content`, or `apps/backend/src/modules/browser/auth`
