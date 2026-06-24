## 1. Web API Observability Adoption

- [x] 1.1 Identify web app backend API call sites and replace direct `fetch` usage with `observableFetch` or an equivalent structured API observability wrapper.
- [x] 1.2 Add action and route labels for migrated web API calls without logging request or response bodies by default.
- [x] 1.3 Add or update web tests proving API success, HTTP failure, and network failure emit structured diagnostics with backend request id when available.

## 2. Backend Readiness Events

- [x] 2.1 Inject backend observability into the health readiness path without changing the liveness or readiness response shape.
- [x] 2.2 Emit a structured readiness event containing overall readiness, browser agent status, diagnostics store status, and safe dependency identifiers.
- [x] 2.3 Add backend tests for ready and degraded readiness events, including warning level behavior for degraded dependencies.

## 3. CLI Command Diagnostics Coverage

- [x] 3.1 Audit top-level CLI commands and identify commands that do not use `CliCommandDiagnostics`.
- [x] 3.2 Add a shared helper or consistent local pattern so each top-level command emits start and completion or failure diagnostics.
- [x] 3.3 Preserve existing CLI stdout, stderr, JSON mode, quiet mode, and exit-code behavior while adding diagnostics.
- [x] 3.4 Add CLI tests proving diagnostics are emitted for representative success, deliberate command error, and unexpected failure paths.

## 4. Verification

- [x] 4.1 Run targeted web tests for API observability.
- [x] 4.2 Run targeted backend health/observability tests.
- [x] 4.3 Run targeted CLI diagnostics tests.
- [x] 4.4 Run `openspec validate --all`.
- [x] 4.5 Run the relevant package test suites or full `pnpm test` if the implementation touches shared runtime behavior.
