# packages-browser-runtime-protocol Specification

## Purpose
Define the browser runtime protocol package for typed browser methods, payload schemas, JSON-RPC helpers, and operation-scoped challenges.
## Requirements
### Requirement: Browser runtime protocol package
The browser runtime protocol boundary SHALL define browser method names, params, results, public browser status metadata, detections, application error codes, and operation-scoped interaction challenges outside the generic agent protocol package.

#### Scenario: Browser method names are shared
- **WHEN** backend and desktop browser runtime code dispatch browser work
- **THEN** both sides use exported browser runtime method identifiers such as `browser.capturePage`, `browser.openLogin`, and `browser.verifyProfile`

#### Scenario: Browser payloads are parsed
- **WHEN** browser runtime params, results, errors, or challenges cross the agent command boundary
- **THEN** the browser runtime protocol boundary validates those browser-specific payloads with typed schemas

### Requirement: Browser JSON-RPC helpers
The browser runtime protocol boundary SHALL provide helpers that build and parse typed browser JSON-RPC requests, success results, and application errors while preserving the generic JSON-RPC envelope.

#### Scenario: Browser request is built
- **WHEN** backend browser runtime code requests a browser operation
- **THEN** the helper creates a JSON-RPC command with a stable `id`, browser method name, and typed browser params

#### Scenario: Browser error carries challenge data
- **WHEN** a browser operation requires user action
- **THEN** the JSON-RPC error uses a numeric JSON-RPC error code and stores the stable browser application error code and interaction challenge in `error.data`

### Requirement: Operation-scoped browser challenges
The browser runtime protocol boundary SHALL represent login requirements, expired profiles, verification failures, captcha, abnormal access, blocked access, and rate limiting as operation-scoped challenges or detections rather than durable pending tasks.

#### Scenario: Login is required
- **WHEN** a browser capture or profile operation cannot proceed because login is missing or expired
- **THEN** the result or error includes a public challenge with site id, profile name, action type, and public URLs when available

#### Scenario: Challenge omits sensitive browser state
- **WHEN** a browser challenge or status payload is returned
- **THEN** it does not contain cookies, localStorage values, storage-state contents, raw HTML, screenshots, desktop profile paths, or default Chrome profile paths

### Requirement: Crawler browser action schemas
The browser runtime protocol SHALL define typed schemas for crawler-focused browser actions that can be serialized across the backend and desktop agent boundary.

#### Scenario: Extended action types are validated
- **WHEN** a browser action payload uses `waitForLoadState`, `waitForURL`, `url`, `innerText`, `innerHTML`, `getAttribute`, `locatorCount`, `allTextContents`, `exists`, `press`, `hover`, `selectOption`, `check`, `uncheck`, `scroll`, `extractList`, `extractLinks`, `extractMeta`, `extractJsonLd`, or `waitForResponse`
- **THEN** the browser runtime protocol validates the action type, required fields, optional timeout, and action id before the payload is accepted as a browser runtime action

#### Scenario: Unsupported executable script payload is rejected
- **WHEN** a browser action payload attempts to carry arbitrary Playwright commands, executable script text, or function predicates
- **THEN** the browser runtime protocol rejects the payload as an invalid browser action

### Requirement: Crawler extraction descriptors
The browser runtime protocol SHALL define bounded extraction descriptors for structured crawler results.

#### Scenario: List extraction descriptor is validated
- **WHEN** an `extractList` action includes an item selector and field descriptors
- **THEN** the browser runtime protocol validates each field descriptor as a selector-based extraction for text, inner text, HTML, attribute, existence, or count

#### Scenario: Metadata extraction descriptor is validated
- **WHEN** an `extractLinks`, `extractMeta`, or `extractJsonLd` action is submitted
- **THEN** the browser runtime protocol accepts only bounded selector or extraction options and does not accept executable page code

### Requirement: Crawler action result schemas
The browser runtime protocol SHALL define safe result shapes for crawler actions without exposing raw Playwright handles or browser storage state.

#### Scenario: Selector extraction result is represented
- **WHEN** a selector extraction action completes
- **THEN** the result contains the requested text, HTML, attribute value, count, existence boolean, or text list in a typed field matching the action

#### Scenario: Structured extraction result is represented
- **WHEN** an `extractList`, `extractLinks`, `extractMeta`, or `extractJsonLd` action completes
- **THEN** the result contains structured JSON-serializable values and safe metadata without cookies, localStorage values, storage-state contents, profile paths, or raw Playwright objects

#### Scenario: Response wait result is represented
- **WHEN** a `waitForResponse` action completes
- **THEN** the result contains a bounded response summary with URL, method when available, status when available, content type when available, and timing metadata when available without response body, request headers, response headers, cookies, or authorization data

