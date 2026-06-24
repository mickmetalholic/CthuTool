## Why

After CLI observability was implemented and archived, full-repository `pnpm test` exposed an intermittent JSON-mode regression in `convert-to-cbz`: spawned CLI processes can time out, leave dangling child processes, and produce empty stdout under concurrent test load. JSON mode is a CLI contract boundary, so command completion must remain deterministic even when diagnostics are enabled.

## What Changes

- Stabilize `chc scripts convert-to-cbz --json` so successful empty-input runs and deliberate missing-input failures always exit deterministically.
- Preserve the existing JSON stdout contract: exactly one parseable JSON value on stdout and diagnostics kept off stdout.
- Ensure bundled script progress/logging resources are flushed and stopped across success, zero-file, and error paths.
- Tighten integration tests so spawned CLI subprocesses are killed on timeout/failure and do not leave dangling processes.
- Avoid changing archived OpenSpec history; this is a follow-up bugfix change against the current specs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-cli-observability`: Clarify that JSON-mode diagnostics must not delay command termination or leave active handles.
- `apps-cli-bundled-script-execution`: Clarify that bundled script JSON summary and error paths must flush/stop diagnostics and exit deterministically.
- `apps-cli-agent-contract`: Clarify that JSON stdout completion includes deterministic process completion in addition to parseable stdout.

## Impact

- Affects `apps/cli/src/index.ts`, `apps/cli/src/command/run-scripts.command.ts`, `apps/cli/src/flow/run-bundled-script.ts`, `apps/cli/src/scripts/convert-to-cbz/**`, and CLI integration tests.
- No public JSON payload shape changes are intended.
- No changes to archived change directories; only active code and current specs should be updated.
