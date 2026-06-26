## Why

CthuTool now has Prometheus metrics, Loki collection, and a Grafana logs panel, but backend observability events still rely on Nest's object logging shape instead of a stable JSON log envelope. Without a shared runtime log contract, Loki queries cannot reliably parse event fields such as `event`, `requestId`, `traceId`, `commandId`, `durationMs`, and `errorCode` across backend, web, desktop, and CLI diagnostics.

## What Changes

- Define a shared structured runtime log envelope for CthuTool application diagnostics.
- Update backend observability logging so events are emitted as one JSON object per stdout/stderr line.
- Keep logs safe for Loki by keeping correlation values as JSON fields rather than Kubernetes/Loki labels.
- Preserve existing backend observability event call sites while normalizing emitted fields.
- Align existing Web, Desktop, and CLI local diagnostics with the shared envelope semantics without requiring remote client event upload in this change.
- Add tests that prove backend logs are JSON parseable, include correlation fields, and redact sensitive details.

## Capabilities

### New Capabilities

- `apps-runtime-structured-logs`: Shared runtime log envelope, field semantics, redaction, and local/remote collection boundaries across backend, web, desktop, and CLI.

### Modified Capabilities

- `apps-backend-observability`: Backend structured events are emitted as JSON stdout/stderr records suitable for Loki ingestion and LogQL JSON parsing.
- `apps-web-observability`: Web diagnostic events align with the shared runtime log envelope for future client-event forwarding.
- `apps-cli-observability`: CLI diagnostics align with the shared runtime log envelope while preserving stderr/JSON stdout separation.
- `apps-desktop-observability`: Desktop diagnostics align with the shared runtime log envelope while remaining local-first.

## Impact

- Affected code: backend observability service and tests; minor type/field alignment in Web, Desktop, and CLI observability helpers if needed.
- Affected runtime behavior: backend observability events become JSON lines on stdout/stderr, improving Loki parsing.
- Affected platform: existing Alloy/Loki collection can ingest the JSON lines without additional platform resources.
- Non-goals: no `/api/client-events`, no Tempo, no OpenTelemetry tracing, and no new log storage service.
