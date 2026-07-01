## ADDED Requirements

### Requirement: Crawler-focused page methods
The browser client SDK SHALL expose Playwright-like convenience methods for crawler-focused browser automation through the backend public browser API.

#### Scenario: Navigation helper methods are available
- **WHEN** a caller uses the SDK page object
- **THEN** the page object exposes typed methods for `url()`, `waitForLoadState(state, options)`, and `waitForURL(target, options)` that map to controlled backend actions

#### Scenario: Selector extraction helper methods are available
- **WHEN** a caller uses the SDK page object
- **THEN** the page object exposes typed methods for `innerText(selector)`, `innerHTML(selector)`, `getAttribute(selector, name)`, `locatorCount(selector)`, `allTextContents(selector)`, and `exists(selector)` that map to controlled backend actions

#### Scenario: Interaction helper methods are available
- **WHEN** a caller uses the SDK page object
- **THEN** the page object exposes typed methods for `press(selector, key)`, `hover(selector)`, `selectOption(selector, value)`, `check(selector)`, `uncheck(selector)`, and `scroll(target, options)` that map to controlled backend actions

### Requirement: Crawler-native extraction methods
The browser client SDK SHALL provide high-level extraction helpers for common crawler workflows.

#### Scenario: List extraction helper is available
- **WHEN** a caller invokes `page.extractList(itemSelector, fields, options)`
- **THEN** the SDK sends one controlled `extractList` action and returns a typed array of JSON-serializable item records

#### Scenario: Page metadata helpers are available
- **WHEN** a caller invokes `page.extractLinks(options)`, `page.extractMeta(options)`, or `page.extractJsonLd(options)`
- **THEN** the SDK sends the matching controlled action and returns typed structured crawler metadata

#### Scenario: Response wait helper is available
- **WHEN** a caller invokes `page.waitForResponse(target, options)`
- **THEN** the SDK sends a bounded response wait descriptor and returns a typed safe response summary without exposing raw Playwright response handles

### Requirement: SDK crawler boundary documentation
The browser client SDK SHALL document the expanded crawler automation surface and its non-Playwright compatibility boundaries.

#### Scenario: README includes crawler workflow example
- **WHEN** a developer reads the browser client SDK README
- **THEN** it includes an example that navigates, waits for page state, extracts a list of records, extracts metadata, and closes the page

#### Scenario: README states unsupported Playwright APIs
- **WHEN** a developer reads the browser client SDK README
- **THEN** it states that the SDK is a crawler-focused Playwright-like remote client and does not expose raw Playwright objects, arbitrary `evaluate`, route interception, browser context storage, downloads, uploads, or Playwright Test assertions

#### Scenario: Types describe safe result shapes
- **WHEN** a developer uses TypeScript with the SDK
- **THEN** public types describe crawler action inputs, extraction descriptors, extraction results, response summaries, and client errors without importing Playwright types
