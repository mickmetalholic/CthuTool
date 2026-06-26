## ADDED Requirements

### Requirement: Desktop diagnostics and observability contract
The Desktop app SHALL emit structured local diagnostics that align with the shared CthuTool client-event envelope and SHALL NOT upload diagnostics remotely unless explicitly configured by a later change.

#### Scenario: Desktop event remains local-first
- **WHEN** Desktop observability records a diagnostic event
- **THEN** the event includes a stable source, level, event name, message, timestamp, and safe details
- **AND** the event is not sent to `POST /api/client-events` by default
