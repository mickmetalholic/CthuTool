## MODIFIED Requirements

### Requirement: Desktop safe local diagnostics
CthuDesktop SHALL prevent local logs and diagnostics summaries from containing cookies, storage state, localStorage values, raw screenshots, raw HTML, tokens, browser profile directory internals, or other fields excluded by the shared runtime log envelope.

#### Scenario: Sensitive payload is excluded
- **WHEN** a browser command captures HTML or screenshot data
- **THEN** desktop observability records only bounded metadata, command context, and diagnostic identifiers rather than raw captured artifacts

#### Scenario: Desktop diagnostics use shared field names
- **WHEN** CthuDesktop records a local diagnostic event
- **THEN** the event uses stable fields for level, event, message, timestamp, safe details, and available correlation fields such as request id, trace id, command id, and operation
- **AND** the event remains local unless a separate client-event upload capability is implemented
