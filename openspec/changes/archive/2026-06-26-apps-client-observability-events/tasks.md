## 1. OpenSpec Contract

- [x] 1.1 Define backend client-event ingestion requirements.
- [x] 1.2 Define Web opt-in client-event reporting requirements.
- [x] 1.3 Document Desktop and CLI as local-first clients aligned with the event envelope.

## 2. Backend Client Event Endpoint

- [x] 2.1 Add backend client-event validation, redaction, payload bounds, and rate limiting.
- [x] 2.2 Add `POST /api/client-events` under the observability module.
- [x] 2.3 Log accepted client events through the backend structured JSON logger with backend request context.
- [x] 2.4 Add backend unit tests for acceptance, rejection, redaction, and rate limiting.

## 3. Web Client Reporter

- [x] 3.1 Add an opt-in Web client-event reporter that posts sanitized warn/error events to the backend.
- [x] 3.2 Wire the reporter into the existing Web logger as a non-blocking optional sink.
- [x] 3.3 Add Web tests for payload shape, level filtering, and failure swallowing.

## 4. Verification

- [x] 4.1 Run affected backend tests and typecheck.
- [x] 4.2 Run affected Web tests and typecheck.
- [x] 4.3 Run `openspec validate apps-client-observability-events --strict`.
