## ADDED Requirements

### Requirement: Browser content observability
The browser content module SHALL emit observable events and metrics for site resolution, origin rejection, queueing, task execution, detection outcomes, timeouts, and diagnostics references.

#### Scenario: Blocked detection is correlated
- **WHEN** a browser content result reports a blocked, login-required, captcha-required, or rate-limited detection
- **THEN** the result and backend events include request context, site id when available, detection kind, summary, and diagnostics id when diagnostics are stored

#### Scenario: Origin rejection is observable
- **WHEN** a browser content request is rejected before dispatch because its origin is not allowed
- **THEN** the backend records an observable failure using a stable error code without navigating the browser runtime
