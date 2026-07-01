## ADDED Requirements

### Requirement: Public crawler action validation
The backend public browser API SHALL accept crawler-focused browser actions only when they match the shared controlled action schema and current public API limits.

#### Scenario: Supported crawler action request is accepted
- **WHEN** a caller submits an active session action list containing supported crawler actions such as load-state waiting, selector extraction, scrolling, keyboard input, structured extraction, metadata extraction, or bounded response waiting
- **THEN** the backend validates the action list, preserves action order, and dispatches it to the session's owning desktop agent

#### Scenario: Invalid crawler action request is rejected
- **WHEN** a caller submits a crawler action with an unsupported type, missing required field, invalid selector, invalid timeout, oversized payload, or executable script content
- **THEN** the backend rejects the request before desktop dispatch with a structured invalid browser request error

### Requirement: Public crawler navigation safety
The backend public browser API SHALL preserve configured site navigation policy for expanded crawler automation.

#### Scenario: Navigation action origin is checked
- **WHEN** a crawler action navigates to a URL or waits for a URL target that includes a concrete HTTP origin
- **THEN** the backend validates that origin against the session site's allowed origins before dispatch when the target can be determined before execution

#### Scenario: Interaction action reports final URL
- **WHEN** a dispatched crawler interaction action can cause page navigation
- **THEN** the backend returns the desktop action result with safe final URL metadata when provided by the desktop runtime

### Requirement: Public crawler action results
The backend public browser API SHALL return ordered safe crawler action results without exposing desktop-owned browser internals.

#### Scenario: Structured crawler results are returned
- **WHEN** the desktop runtime returns successful crawler action results
- **THEN** the backend returns ordered action results containing safe typed values such as text, HTML snippets, attributes, counts, booleans, lists, links, meta records, JSON-LD records, URL values, or response summaries

#### Scenario: Sensitive crawler state is redacted
- **WHEN** crawler action results are returned to the public API caller
- **THEN** the response does not include cookies, localStorage values, sessionStorage values, Playwright storage-state contents, desktop profile paths, raw request or response headers, response bodies from network waiting, raw WebSocket objects, or raw Playwright handles

#### Scenario: Crawler result limits are enforced
- **WHEN** a crawler action result exceeds configured payload or item limits
- **THEN** the backend returns a structured limit error or a bounded result according to the public browser API limit contract
