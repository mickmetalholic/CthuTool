## MODIFIED Requirements

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
