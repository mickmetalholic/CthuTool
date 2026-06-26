## Context

The GitOps observability stack already deploys Loki and Grafana Alloy. Alloy collects Kubernetes stdout/stderr logs from the `cthutool` namespace and sends them to Loki with bounded labels. The backend also has structured observability call sites, request context, and Prometheus metrics, but the emitted backend logs are formatted through Nest `Logger` with an object payload rather than a single stable JSON log record.

Web, Desktop, and CLI already have local structured diagnostics. They are not automatically collected by the Kubernetes Loki path, so this change should align their field semantics without introducing remote client-event upload.

## Goals / Non-Goals

**Goals:**

- Emit backend observability events as one JSON object per line.
- Include stable top-level fields for `service`, `source`, `level`, `event`, `message`, `timestamp`, correlation IDs, duration, status, and error code when present.
- Preserve existing backend observability call sites and redaction guarantees.
- Keep correlation values as log fields, not Loki labels.
- Keep Web/Desktop/CLI diagnostics compatible with the shared envelope semantics.

**Non-Goals:**

- Do not add `/api/client-events`.
- Do not deploy or configure Tempo or OpenTelemetry tracing.
- Do not replace Loki, Alloy, or Prometheus.
- Do not require Desktop, Web, or CLI to upload logs remotely.

## Decisions

### Emit JSON directly from the backend observability service

`BackendObservabilityService` should own the final log envelope and write JSON lines to an injectable sink, defaulting to process stdout/stderr. This keeps every existing backend observability call site intact while making Loki ingestion deterministic.

Alternatives considered:

- Continue using Nest `Logger` object metadata: rejected because the actual stdout shape depends on Nest logger formatting and is harder to query with LogQL JSON parsing.
- Add a logging library such as pino: deferred because the current need is a small structured sink, not a full app-wide logger replacement.

### Flatten common searchable fields

Common fields such as `requestId`, `traceId`, `commandId`, `durationMs`, `status`, and `errorCode` should be top-level when supplied. The original sanitized details can remain under `details` for less common context. This supports direct LogQL JSON filters without promoting high-cardinality values to Loki labels.

### Keep client runtimes local-first

Web, Desktop, and CLI diagnostics should use compatible names and redaction behavior, but this change does not upload client events. Client upload needs separate rate limiting, schema validation, and privacy controls.

## Risks / Trade-offs

- [Risk] Direct JSON logging bypasses Nest logger formatting. -> Mitigation: keep this scoped to observability events and use injectable sinks for tests.
- [Risk] Logs can contain high-cardinality fields. -> Mitigation: high-cardinality correlation values remain JSON fields and are not Loki labels; sensitive fields are redacted.
- [Risk] Existing tests mock only `observability.record` call sites and not emitted logs. -> Mitigation: add direct unit tests for the backend observability service.

## Migration Plan

1. Define the shared runtime log envelope requirement.
2. Update backend observability service to build sanitized JSON log records.
3. Preserve existing `record()` input shape and call sites.
4. Add focused unit tests for JSON output, severity routing, correlation flattening, and redaction.
5. Validate OpenSpec and affected backend tests.

Rollback is a normal backend rollback. Loki/Alloy can continue collecting stdout/stderr regardless of the log shape.

## Open Questions

- Should a later change move bootstrap and agent registry logs onto the same JSON envelope, or keep this first implementation limited to `BackendObservabilityService` events?
