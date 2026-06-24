## MODIFIED Requirements

### Requirement: Web API correlation
The web app SHALL route production frontend API requests through structured API observability so requests are correlated with backend request identifiers, route or action labels, response status, duration, and safe error codes.

#### Scenario: API failure is correlated
- **WHEN** a frontend API request fails
- **THEN** web observability records the frontend action, request URL path or route label, status when available, duration, safe error code, and backend request id when returned

#### Scenario: API success is correlated
- **WHEN** a frontend API request succeeds
- **THEN** web observability records the action, route label, status, duration, and backend request id when returned without logging response bodies by default

#### Scenario: App API call site uses structured API observability
- **WHEN** web application code calls a backend API from a route, component, action, or data loader
- **THEN** the call uses the shared observable API request path or an equivalent structured logger event with action, route, duration, status, and backend request id fields
