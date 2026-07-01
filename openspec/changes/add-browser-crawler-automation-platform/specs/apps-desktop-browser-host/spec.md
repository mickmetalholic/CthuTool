## ADDED Requirements

### Requirement: Desktop crawler action execution
CthuDesktop SHALL execute crawler-focused structured browser actions against desktop-owned Playwright sessions without evaluating arbitrary scripts from the caller.

#### Scenario: Extended actions execute in order
- **WHEN** CthuDesktop receives a `browser.runActions` command containing supported crawler actions for an active session
- **THEN** it executes the actions against the session page in order and returns ordered typed results for each completed action

#### Scenario: Unsupported crawler action is rejected
- **WHEN** CthuDesktop receives an unsupported crawler action type or invalid crawler action payload
- **THEN** it rejects the command with a structured browser runtime error without executing that action or subsequent actions

#### Scenario: Arbitrary script is not evaluated
- **WHEN** a crawler action payload contains executable script text, raw Playwright command names, or function predicates
- **THEN** CthuDesktop rejects the action without evaluating the payload in the page

### Requirement: Desktop crawler extraction
CthuDesktop SHALL provide safe crawler extraction results from the current session page.

#### Scenario: Selector extraction succeeds
- **WHEN** CthuDesktop executes selector extraction actions for text, inner text, HTML, attributes, existence, counts, or all text contents
- **THEN** it returns the requested values as JSON-serializable bounded action results

#### Scenario: Structured list extraction succeeds
- **WHEN** CthuDesktop executes an `extractList` action with an item selector and field descriptors
- **THEN** it evaluates the descriptors against each matched item and returns a bounded array of JSON-serializable item records

#### Scenario: Page metadata extraction succeeds
- **WHEN** CthuDesktop executes `extractLinks`, `extractMeta`, or `extractJsonLd`
- **THEN** it returns bounded structured values from the current page without returning raw cookies, browser storage, profile paths, or Playwright handles

### Requirement: Desktop crawler interaction and waiting
CthuDesktop SHALL support common crawler interaction and waiting actions while preserving runtime limits and access-control behavior.

#### Scenario: Interaction action succeeds
- **WHEN** CthuDesktop executes supported interaction actions such as hover, press, select option, check, uncheck, or scroll
- **THEN** it performs the action with the configured timeout and returns a safe result with final URL metadata when available

#### Scenario: Load and response wait succeed
- **WHEN** CthuDesktop executes `waitForLoadState`, `waitForURL`, or `waitForResponse`
- **THEN** it waits according to the validated descriptor and timeout and returns a safe result without exposing raw network headers, response bodies, or Playwright response handles

#### Scenario: Access controls are not bypassed
- **WHEN** crawler action execution encounters login-required, captcha, abnormal access, rate limiting, or blocked content
- **THEN** CthuDesktop returns the structured detection or runtime error instead of attempting to bypass the restriction

### Requirement: Desktop crawler payload limits
CthuDesktop SHALL enforce configured payload, timeout, and item-count limits for crawler action execution.

#### Scenario: Large extraction result is bounded
- **WHEN** a crawler extraction result exceeds configured payload or item-count limits
- **THEN** CthuDesktop returns a bounded result or structured size-limit error rather than an unbounded WebSocket payload

#### Scenario: Crawler action times out
- **WHEN** a crawler action exceeds its configured timeout
- **THEN** CthuDesktop stops waiting for that action and returns a structured timeout error
