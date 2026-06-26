## MODIFIED Requirements

### Requirement: Structured backend events
The backend SHALL emit structured observability events for request lifecycle, exceptions, browser content tasks, diagnostics persistence, agent command dispatch, readiness checks, and accepted client diagnostic events as JSON records suitable for stdout/stderr collection into Loki.

#### Scenario: Client event is logged safely
- **WHEN** the backend accepts a client observability event
- **THEN** the backend emits a structured JSON log record with event `client.event_received`
- **AND** the record includes the backend ingestion request id, client source, client level, client event name, scope, route, status, duration, and safe error code when present
- **AND** the record does not include raw HTML, screenshots, cookies, storage-state values, tokens, form values, or browser profile directories

## ADDED Requirements

### Requirement: Backend client event ingestion
The backend SHALL expose a bounded client observability event ingestion endpoint for Web, Desktop, and CLI diagnostic summaries.

#### Scenario: Client event is accepted
- **WHEN** a client submits a valid event to `POST /api/client-events`
- **THEN** the backend returns an accepted response containing the backend request id for the ingestion request
- **AND** the backend logs the event through the structured backend observability logger

#### Scenario: Client event is rejected
- **WHEN** a client submits an event with an unsupported source, unsupported level, missing event name, missing message, malformed body, or oversized payload
- **THEN** the backend rejects the request with a client error
- **AND** the backend does not log the rejected client payload as an accepted client event

#### Scenario: Client event rate limit is enforced
- **WHEN** one client source and remote address submits too many events in the configured window
- **THEN** the backend rejects additional events with a rate-limit response
- **AND** the response still participates in backend request context logging
