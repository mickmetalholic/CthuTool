## Context

The current observability stack collects backend stdout/stderr logs with Alloy and stores them in Loki. A separate direct client-to-Loki path would require public credentials, stricter abuse controls, and more platform exposure. The safer first step is to let clients submit bounded diagnostic summaries to the backend and have the backend log them through the already-collected structured JSON path.

## Goals / Non-Goals

**Goals:**

- Accept client observability events at `POST /api/client-events`.
- Preserve or generate backend request IDs on the event ingestion request.
- Validate source, level, event name, message, and optional correlation fields.
- Bound payload size and detail depth, and redact secrets, cookies, HTML, screenshots, storage state, tokens, profile paths, and form values.
- Rate-limit event ingestion per client source and remote address.
- Provide Web-side helpers for opt-in remote reporting.

**Non-Goals:**

- Do not send client events directly to Loki, Tempo, or OpenTelemetry.
- Do not upload raw request/response bodies, DOM snapshots, screenshots, storage, cookies, or form input values.
- Do not enable Desktop or CLI remote upload by default.
- Do not use client event fields as Prometheus or Loki labels.

## Decisions

### Backend endpoint owns validation and logging

The backend endpoint accepts a compact event envelope from `cthutool.web`, `cthutool.desktop`, or `cthutool.cli`. Accepted events are logged as `client.event_received` through `BackendObservabilityService`, with original client fields nested under sanitized details. The backend request context remains the authoritative ingestion correlation ID.

### Web reporting is explicit and best-effort

Web logging continues to write local console diagnostics. A configured reporter can POST sanitized warn/error events to the backend. Reporter failures are swallowed to avoid recursive telemetry failures or user-visible errors.

### Desktop and CLI remain local-first

Desktop and CLI already produce structured local diagnostics. This change defines the shared contract they would use later, but it does not make local tools depend on backend availability.

## Risks / Trade-offs

- [Risk] Client event endpoint can be abused. -> Mitigation: payload bounds, source validation, and per-source remote-address rate limiting.
- [Risk] Client events can include high-cardinality values. -> Mitigation: keep those values in JSON fields only, never as metrics or Loki labels.
- [Risk] Remote reporting can mask app errors if it throws. -> Mitigation: reporter uses best-effort fire-and-forget behavior.

## Migration Plan

1. Add OpenSpec requirements for client event ingestion and Web opt-in reporting.
2. Implement backend client-event validation, rate limiting, logging, and tests.
3. Implement Web reporter integration and tests.
4. Validate specs and run affected backend/Web checks.

Rollback is a normal backend/Web rollback. Existing local logging and Loki backend log collection continue to work without the endpoint.
