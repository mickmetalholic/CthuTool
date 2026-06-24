## Context

The repository now has observability contracts and local emitters for the main runtime surfaces:

- Backend structured events are emitted through `BackendObservabilityService` and request context middleware.
- CLI diagnostics are stderr JSON lines gated by `CHC_CLI_DIAGNOSTICS`.
- Web diagnostics use a structured browser console logger and `observableFetch`.
- Desktop agent and browser host diagnostics are already wired through an in-memory recorder.

The remaining gap is not a missing logging backend; it is uneven call-site adoption. Web API calls can bypass `observableFetch`, backend readiness returns dependency state without emitting a readiness event, and CLI top-level commands do not all use the same command diagnostics lifecycle.

## Goals / Non-Goals

**Goals:**

- Make web production API call sites use the structured API correlation wrapper.
- Emit a backend readiness event whenever readiness is evaluated, including safe dependency status fields.
- Apply command start/complete/fail diagnostics consistently across top-level CLI commands.
- Keep all existing output safety contracts intact: JSON stdout purity, quiet-mode suppression, production console gating, and redaction.

**Non-Goals:**

- Add OpenTelemetry, metrics exporters, tracing backends, or centralized log storage.
- Redesign event schemas that are already sufficient for local diagnostics.
- Add active observability to pure UI or docs packages that do not own runtime side effects.
- Change existing user-facing command output or API response payloads except for adding diagnostics side effects.

## Decisions

1. Use existing local emitters instead of introducing a new sink.

   Backend remains Nest Logger based, CLI remains stderr JSON lines, and Web remains browser console based. This keeps the change focused on missing instrumentation coverage rather than ingestion architecture.

2. Treat Web API observability as a call-site migration.

   `observableFetch` already records action, route, status, duration, backend request id, and safe errors. Implementation should identify app API call sites and route them through the wrapper rather than adding another logger.

3. Record readiness as a backend event beside the existing readiness response.

   The readiness endpoint should still return the same dependency payload. The additional event should summarize browser agent and diagnostics store status with bounded labels and avoid paths or raw dependency payloads beyond the already safe diagnostics directory/status fields.

4. Centralize CLI command lifecycle wiring around the existing diagnostics helper.

   Commands should share a small wrapper or local pattern that creates `CliCommandDiagnostics`, records completion after successful command work, records deliberate command errors with stable codes, and records unexpected failures without breaking existing `runMain` behavior.

5. Verify through focused unit/integration tests.

   This change is mostly instrumentation. Tests should assert emitted structured events and output separation, not rely on manual log inspection.

## Risks / Trade-offs

- Duplicate logs from Web API wrappers if callers also log manually -> prefer replacing ad hoc diagnostics at migrated call sites.
- Backend readiness may be polled frequently -> emit bounded events only and avoid expensive dependency probes beyond the existing readiness check.
- CLI wrapper changes can accidentally alter exit behavior -> keep command output and `process.exitCode` behavior covered by existing CLI tests plus focused diagnostics tests.
- Some Web routes may not have API calls today -> migrate only real call sites and keep `observableFetch` tests as the contract for future routes.
