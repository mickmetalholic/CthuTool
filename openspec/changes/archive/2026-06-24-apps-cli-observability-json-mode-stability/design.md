## Context

The observability implementation added structured diagnostics around CLI commands and bundled scripts. Targeted runs of `run-scripts-convert-to-cbz-json.test.ts` pass, and direct `convert-to-cbz --input <empty-dir> --json` produces valid JSON. However, full `pnpm test` exposed timeouts and dangling Bun subprocesses around the same JSON-mode integration tests, which means the runtime lifecycle is not robust enough under concurrent test load.

## Goals / Non-Goals

**Goals:**
- Make JSON-mode `scripts convert-to-cbz` completion deterministic for success and deliberate command-error paths.
- Keep diagnostics off stdout and keep stdout to one parseable JSON value.
- Ensure progress loggers and diagnostics do not leave active handles after zero-file, success, or error paths.
- Make the integration tests enforce cleanup of spawned processes.

**Non-Goals:**
- Redesigning CLI observability event names or payloads.
- Changing `convert-to-cbz` conversion behavior for real input files.
- Introducing a telemetry backend or changing archived OpenSpec history.

## Decisions

1. Await the CLI entrypoint command runner.
   - Rationale: `src/index.ts` currently starts `runMain(...)` without top-level await in the normal execution path. Awaiting it makes process completion and error handling explicit in Bun.
   - Alternative considered: leave entrypoint unchanged and only extend test timeouts. That masks the lifecycle ambiguity.

2. Use `try/finally` around conversion progress logger cleanup.
   - Rationale: logger `flush` and `stop` must run even when no files are found or when conversion errors occur.
   - Alternative considered: add cleanup only to the zero-file branch. That leaves future error paths fragile.

3. Harden subprocess tests with a helper.
   - Rationale: Tests that spawn CLI subprocesses should enforce timeouts, collect stdout/stderr after process exit, and kill the child on failure.
   - Alternative considered: increase test timeout only. That does not prevent dangling processes.

## Risks / Trade-offs

- Awaiting `runMain` could expose previously swallowed command errors -> keep existing catch behavior and set `process.exitCode` consistently.
- Forcing cleanup in tests may hide a production hang -> tests should fail with captured stdout/stderr and only kill after timeout.
- Logger cleanup may emit diagnostics later than before -> keep diagnostics on stderr and preserve stdout ordering.

## Migration Plan

1. Update CLI entrypoint lifecycle to await command execution.
2. Wrap convert-to-cbz conversion logger lifecycle in cleanup-safe control flow.
3. Refactor JSON-mode integration tests to use a spawn helper with timeout and guaranteed cleanup.
4. Run the targeted CLI integration test and then full `pnpm test`.

## Open Questions

- Should all CLI subprocess integration tests share the same spawn helper in a later cleanup?
- Should command completion diagnostics be emitted before or after script JSON output in diagnostics-enabled JSON mode?
