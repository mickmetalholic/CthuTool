## 1. Runtime Log Contract

- [x] 1.1 Add an OpenSpec capability for shared runtime structured log envelope semantics.
- [x] 1.2 Update backend observability requirements so backend events are emitted as JSON stdout/stderr records.
- [x] 1.3 Document that Web, Desktop, and CLI diagnostics align to the same envelope without remote upload in this change.

## 2. Backend Structured Logging

- [x] 2.1 Update `BackendObservabilityService` to normalize observability events into one JSON record per line.
- [x] 2.2 Route warning and error records to stderr and informational records to stdout.
- [x] 2.3 Promote common fields such as `requestId`, `traceId`, `commandId`, `durationMs`, `status`, and `errorCode` to top-level JSON fields when present.
- [x] 2.4 Preserve redaction of cookies, tokens, HTML, screenshots, storage state, profile paths, and other sensitive details.
- [x] 2.5 Keep existing backend observability call sites source-compatible.

## 3. Tests and Verification

- [x] 3.1 Add unit tests for backend JSON log shape and severity routing.
- [x] 3.2 Add tests proving sensitive details are redacted from emitted JSON.
- [x] 3.3 Run affected backend tests.
- [x] 3.4 Run `openspec validate apps-runtime-structured-logs --strict`.
