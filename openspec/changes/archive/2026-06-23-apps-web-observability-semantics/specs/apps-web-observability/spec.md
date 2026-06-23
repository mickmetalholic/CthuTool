## ADDED Requirements

### Requirement: Web API correlation
The web app SHALL correlate frontend API requests with backend request identifiers, route or action labels, response status, duration, and safe error codes.

#### Scenario: API failure is correlated
- **WHEN** a frontend API request fails
- **THEN** web observability records the frontend action, request URL path or route label, status when available, duration, safe error code, and backend request id when returned

#### Scenario: API success is correlated
- **WHEN** a frontend API request succeeds
- **THEN** web observability records the action, route label, status, duration, and backend request id when returned without logging response bodies by default

### Requirement: Web console diagnostics
The web app SHALL provide a development console diagnostics contract with stable levels, scopes, event names, correlation fields, and safe redaction.

#### Scenario: Development console event is structured
- **WHEN** web code emits a development diagnostic event
- **THEN** it uses a structured logger with level, scope, event, message, and safe contextual fields rather than ad hoc console arguments

#### Scenario: Production console output is constrained
- **WHEN** the web app runs in production mode
- **THEN** debug and info diagnostics are silent by default and warn or error diagnostics remain redacted and bounded

### Requirement: Web UI error semantics
The web app SHALL define observable UI warning and error semantics for recoverable API failures, route-level errors, and error boundary fallbacks.

#### Scenario: Error boundary reports safe summary
- **WHEN** a route or component error boundary catches an error
- **THEN** web observability records a safe summary, route context, and correlation metadata without logging sensitive input values
