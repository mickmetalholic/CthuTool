## ADDED Requirements

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
