## MODIFIED Requirements

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
