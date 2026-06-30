# apps-web-observability Specification

## Purpose
Define the web frontend observability contract for API correlation, safe console diagnostics, and UI error reporting in the browser-hosted CthuTool management console.

## Requirements
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

### Requirement: Web console diagnostics
The web app SHALL provide a development console diagnostics contract with stable levels, scopes, event names, correlation fields, safe redaction, and field names compatible with the shared runtime log envelope.

#### Scenario: Development console event is structured
- **WHEN** web code emits a development diagnostic event
- **THEN** it uses a structured logger with level, scope, event, message, source, and safe contextual fields rather than ad hoc console arguments

#### Scenario: Production console output is constrained
- **WHEN** the web app runs in production mode
- **THEN** debug and info diagnostics are silent by default and warn or error diagnostics remain redacted and bounded

#### Scenario: Web diagnostics stay local-first
- **WHEN** the web app emits a structured diagnostic event
- **THEN** it is not uploaded to the backend by this requirement
- **AND** future upload behavior requires a separate client-event ingestion capability

### Requirement: Web UI error semantics
The web app SHALL define observable UI warning and error semantics for recoverable API failures, route-level errors, error boundary fallbacks, and optional backend client-event reporting.

#### Scenario: Error boundary reports safe summary
- **WHEN** a route or component error boundary catches an error
- **THEN** web observability records a safe summary, route context, and correlation metadata without logging sensitive input values

#### Scenario: Web event is reported to backend
- **WHEN** Web client-event reporting is configured and a warn or error diagnostic is emitted
- **THEN** the web app sends a sanitized diagnostic summary to `POST /api/client-events`
- **AND** reporter failures do not throw into the UI workflow

#### Scenario: Web remote reporting is opt in
- **WHEN** Web client-event reporting is not configured
- **THEN** web diagnostics remain local console events and no backend client-event request is made
