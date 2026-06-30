# packages-browser-client-sdk Specification

## Purpose
Define the TypeScript browser client SDK for trusted applications using the backend public browser API.

## Requirements
### Requirement: Browser client package
The repository SHALL provide a TypeScript browser client SDK package for
third-party applications to consume the backend public browser API.

#### Scenario: Package exports client
- **WHEN** a caller imports the browser client package entrypoint
- **THEN** the package exports a `CthuBrowserClient` class and public TypeScript
  types for client options, browser session options, browser actions, action
  results, and browser client errors

#### Scenario: Package builds declarations
- **WHEN** the browser client package is built
- **THEN** it emits JavaScript output and TypeScript declaration files through
  the monorepo package build flow

#### Scenario: Package has no Playwright dependency
- **WHEN** the browser client package dependencies are inspected
- **THEN** it does not depend on Playwright, browser runtime packages, desktop
  agent packages, or backend application code

### Requirement: Backend-bound transport client
The SDK SHALL communicate only with the backend public browser API.

#### Scenario: Create session request
- **WHEN** a caller creates a browser page through the SDK
- **THEN** the SDK sends a create-session request to the configured backend base
  URL and stores the returned session ID in the page object

#### Scenario: Run action request
- **WHEN** a caller invokes a page operation that requires browser work
- **THEN** the SDK sends a run-actions request for the page session and returns
  the matching typed action result

#### Scenario: Close session request
- **WHEN** a caller closes a page
- **THEN** the SDK sends a close-session request to the configured backend and
  prevents further actions from using that page object

### Requirement: Playwright-like page convenience API
The SDK SHALL provide a small Playwright-like page API that maps methods to the
backend controlled action DSL.

#### Scenario: Navigation method
- **WHEN** a caller invokes `page.goto(url, options)`
- **THEN** the SDK sends a navigation action for the active session and returns
  the typed navigation result

#### Scenario: Selector interaction methods
- **WHEN** a caller invokes selector methods such as `page.click(selector)`,
  `page.fill(selector, value)`, or `page.waitForSelector(selector)`
- **THEN** the SDK sends the corresponding controlled action for the active
  session

#### Scenario: Content extraction methods
- **WHEN** a caller invokes `page.textContent(selector)`, `page.content()`,
  `page.title()`, or `page.screenshot(options)`
- **THEN** the SDK sends the corresponding controlled action and returns the
  extracted value in the method's typed return shape

### Requirement: SDK error handling
The SDK SHALL normalize backend transport and browser operation failures into
typed client errors.

#### Scenario: Backend returns structured error
- **WHEN** the backend returns a structured browser API error
- **THEN** the SDK throws or returns a `BrowserClientError` containing the
  backend error code, message, HTTP status when available, and safe metadata

#### Scenario: Transport fails
- **WHEN** the HTTP request fails before receiving a backend response
- **THEN** the SDK throws or returns a `BrowserClientError` with a transport
  failure code and original error cause when available

#### Scenario: Closed page is used
- **WHEN** a caller invokes a page action after `page.close()` succeeds
- **THEN** the SDK rejects the operation locally without sending a backend
  request

### Requirement: SDK documentation and examples
The browser client SDK SHALL document installation, configuration, session
lifecycle, and supported page methods.

#### Scenario: README includes basic usage
- **WHEN** a developer reads the package README
- **THEN** it includes a minimal example that creates a client, opens a page,
  navigates, extracts content, and closes the page

#### Scenario: README states limitations
- **WHEN** a developer reads the package README
- **THEN** it states that the SDK talks to the CthuTool backend, does not connect
  to Playwright directly, does not expose raw browser storage, and assumes a
  trusted backend deployment until API authentication is added
