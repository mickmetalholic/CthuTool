## ADDED Requirements

### Requirement: CLI diagnostic stream separation
The CLI SHALL keep user-facing command output separate from diagnostics while aligning diagnostic event fields with the shared CthuTool client-event envelope.

#### Scenario: CLI event remains local-first
- **WHEN** CLI observability records a diagnostic event
- **THEN** the event includes a stable source, level, event name, message, timestamp, and safe details
- **AND** the event is not sent to `POST /api/client-events` by default
