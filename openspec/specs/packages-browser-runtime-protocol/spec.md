# packages-browser-runtime-protocol Specification

## Purpose
TBD - created by archiving change apps-browser-runtime-protocol-hardening. Update Purpose after archive.
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
