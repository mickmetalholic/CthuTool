## Why

Backend logs are now collected through stdout/stderr into Loki, but Web, Desktop, and CLI diagnostics remain local-only. Operators need a narrow, safe path for client runtimes to report high-signal warnings and errors so frontend failures can be correlated with backend request IDs and viewed in the same log backend.

## What Changes

- Add a backend `POST /api/client-events` endpoint for sanitized client observability events.
- Validate event shape, bound payload size, redact sensitive details, and rate-limit accepted client events before logging.
- Log accepted client events through the existing backend structured JSON logger so Loki collection continues to use the Kubernetes stdout/stderr path.
- Add a Web client-event reporter that can POST already-sanitized warn/error events to the backend when configured.
- Keep Desktop and CLI local-first in this change while defining the same client-event contract for later opt-in upload.

## Capabilities

### Modified Capabilities

- `apps-backend-observability`: Backend accepts safe client observability events and emits them as structured backend logs.
- `apps-web-observability`: Web diagnostics can opt in to backend client-event reporting while retaining local console diagnostics.
- `apps-desktop-observability`: Desktop diagnostics align with the client-event contract but do not upload by default.
- `apps-cli-observability`: CLI diagnostics align with the client-event contract but do not upload by default.

## Impact

- Affected code: backend observability module and Web observability helpers/tests.
- Affected runtime behavior: configured Web clients may send warn/error diagnostic summaries to `/api/client-events`.
- Affected platform: no new services; Loki receives these events through backend JSON stdout/stderr logs.
- Non-goals: no OpenTelemetry tracing, no browser-side automatic session replay, no raw payload/body capture, and no default Desktop/CLI remote upload.
