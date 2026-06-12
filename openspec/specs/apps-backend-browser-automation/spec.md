## Purpose
Define backend-owned browser automation services, browser auth profiles, controlled diagnostics, and CLI auth helper behavior for internal page content retrieval.

## Requirements

### Requirement: Internal browser content service
The backend SHALL provide an internal browser content service that retrieves controlled page content snapshots for other backend modules.

#### Scenario: Fetch page content snapshot
- **WHEN** a backend module requests a page content snapshot for an allowed URL with HTML and text enabled
- **THEN** the service returns the final URL, response status when available, page title when available, captured timestamp, optional HTML, optional text, auth usage metadata, and a detection result

#### Scenario: Raw browser page is not exposed
- **WHEN** a backend module uses the browser content service
- **THEN** the service result does not expose a raw Playwright page, browser context, cookies, localStorage, or storage-state file contents

### Requirement: Browser provider abstraction
The backend SHALL hide browser runtime details behind a provider abstraction and SHALL include a local Playwright-backed provider as the initial implementation.

#### Scenario: Local provider creates content snapshot
- **WHEN** the configured provider is the local Playwright provider and a page content request is accepted
- **THEN** the provider creates an isolated browser context, navigates to the requested URL, captures the requested content fields, and closes browser resources after the task completes

#### Scenario: Provider can be replaced later
- **WHEN** a future browser runtime provider is added
- **THEN** business modules using the browser content service do not need to change their content request or result handling contract

### Requirement: Origin allowlist enforcement
The browser content service SHALL require each page content request to declare allowed origins and SHALL reject navigation outside those origins.

#### Scenario: URL origin is allowed
- **WHEN** a request URL has an origin listed in the request allowed origins
- **THEN** the service continues with browser navigation

#### Scenario: URL origin is rejected
- **WHEN** a request URL has an origin not listed in the request allowed origins
- **THEN** the service fails before navigation with an `ORIGIN_NOT_ALLOWED` error

### Requirement: Browser auth profiles
The backend SHALL support named browser auth profiles stored as Playwright-compatible storage-state bundles in a configured secrets directory.

#### Scenario: Auth profile is required and present
- **WHEN** a page content request sets `profileName` and `requireAuth` to true and a matching auth profile exists
- **THEN** the service uses that profile storage state for browser navigation and reports that auth was used

#### Scenario: Auth profile is required and missing
- **WHEN** a page content request sets `profileName` and `requireAuth` to true and no matching auth profile exists
- **THEN** the service fails before navigation with an `AUTH_STATE_MISSING` error

#### Scenario: Optional auth profile is missing
- **WHEN** a page content request sets `profileName` and `requireAuth` to false and no matching auth profile exists
- **THEN** the service continues anonymously and reports that auth was not used

#### Scenario: Auth state remains secret
- **WHEN** auth profile status or page content results are returned to callers
- **THEN** the backend does not include raw cookies, localStorage values, or storage-state file contents

### Requirement: Shared auth bundle format
The backend SHALL accept a shared auth bundle format that can be produced by CLI helper flows and browser extension flows.

#### Scenario: Valid auth bundle is stored
- **WHEN** a valid auth bundle contains a Playwright-compatible `storage-state.json` and profile metadata
- **THEN** the backend stores the bundle under the configured profile path and records the profile source and update time

#### Scenario: Invalid auth bundle is rejected
- **WHEN** an auth bundle is missing required storage-state fields or declares an invalid profile name
- **THEN** the backend rejects the bundle without replacing any existing stored profile

### Requirement: CLI auth helper
The CLI SHALL provide an auth helper flow that lets a user manually create a browser auth bundle for a named profile without storing account passwords.

#### Scenario: Manual login exports storage state
- **WHEN** the user runs the auth helper for a profile and completes login in the headed browser
- **THEN** the helper exports Playwright storage state and metadata for that profile

#### Scenario: Helper does not automate credentials
- **WHEN** the CLI auth helper opens a login page
- **THEN** it does not ask for, store, or automatically submit the user's account password

#### Scenario: Browser runtime is installed explicitly
- **WHEN** a user prepares browser auth on a machine without the required Playwright browser binary
- **THEN** the CLI provides explicit `browser doctor` and `browser install` commands instead of relying on package install hooks

#### Scenario: Stored auth profile is verified
- **WHEN** a user verifies a stored Douban auth profile
- **THEN** the CLI returns only the profile name and minimal user identity containing the Douban user id and nickname

### Requirement: Extension auth compatibility
The browser auth design SHALL support a future frontend-plus-browser-extension auth flow that produces the same backend auth bundle format.

#### Scenario: Extension uploads equivalent auth bundle
- **WHEN** a browser extension collects permitted cookies and origin storage for a profile
- **THEN** it can submit a Playwright-compatible auth bundle that the backend stores through the same validation path as CLI-created bundles

#### Scenario: Frontend cannot read site auth directly
- **WHEN** the frontend auth page starts an extension-based auth flow
- **THEN** the frontend itself does not read third-party site cookies or localStorage and relies on the extension or backend APIs for status updates

### Requirement: Task execution controls
The browser content service SHALL run browser tasks through a controlled task runner with timeout, concurrency, retry, and resource blocking controls.

#### Scenario: Concurrency limit is enforced
- **WHEN** multiple page content requests are submitted and the configured maximum concurrency is reached
- **THEN** additional requests wait for task capacity before starting browser navigation

#### Scenario: Navigation times out
- **WHEN** a page content request exceeds its configured timeout
- **THEN** the service stops the navigation task and returns a `NAVIGATION_TIMEOUT` error or failed detection result

#### Scenario: Resource blocking is applied
- **WHEN** a page content request declares resource types to block
- **THEN** the browser provider blocks those resource types during navigation

### Requirement: Block and auth detection
The browser content service SHALL classify known access problems into structured detection states rather than attempting to bypass them.

#### Scenario: Rate limit is detected
- **WHEN** navigation returns a rate-limit status or matching page content
- **THEN** the service reports `rate_limited` detection and does not retry indefinitely

#### Scenario: Login requirement is detected
- **WHEN** navigation redirects to a login page or matching page content indicates that login is required
- **THEN** the service reports `login_required` detection

#### Scenario: Captcha requirement is detected
- **WHEN** page content indicates that captcha or abnormal access verification is required
- **THEN** the service reports `captcha_required` detection and does not attempt automated captcha solving

### Requirement: Diagnostics storage
The browser content service SHALL store failure diagnostics behind diagnostic identifiers without returning raw sensitive artifacts by default.

#### Scenario: Failed request saves diagnostics
- **WHEN** a browser task fails or produces a blocked detection result and diagnostics are enabled
- **THEN** the backend stores diagnostic metadata and configured artifacts under the diagnostics directory and returns a diagnostics identifier

#### Scenario: Diagnostic artifacts are not returned inline
- **WHEN** a service result includes diagnostics
- **THEN** the result includes only diagnostic identifiers and summaries, not raw screenshots, HTML files, cookies, or storage-state contents
