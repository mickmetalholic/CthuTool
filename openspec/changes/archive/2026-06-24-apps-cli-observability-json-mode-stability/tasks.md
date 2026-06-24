## 1. CLI Runtime Lifecycle

- [x] 1.1 Update `apps/cli/src/index.ts` so normal command execution awaits `runMain` and preserves existing exit-code behavior.
- [x] 1.2 Add or adjust tests proving JSON-mode commands resolve the CLI runner after success and deliberate command errors.

## 2. convert-to-cbz Cleanup

- [x] 2.1 Wrap conversion progress logger lifecycle so `flush` and `stop` run on zero-file, success, and error paths.
- [x] 2.2 Verify diagnostics-enabled JSON mode writes diagnostics only to stderr and one JSON value to stdout.

## 3. Integration Test Stability

- [x] 3.1 Refactor `run-scripts-convert-to-cbz-json.test.ts` to use a spawn helper with timeout, stdout/stderr capture, and guaranteed child cleanup.
- [x] 3.2 Keep assertions for successful empty-input JSON, diagnostics-enabled JSON, and missing-input JSON error behavior.

## 4. Verification

- [x] 4.1 Run `pnpm --filter @cthutool/cli test -- tests/integration/run-scripts-convert-to-cbz-json.test.ts`.
- [x] 4.2 Run `pnpm --filter @cthutool/cli test`.
- [x] 4.3 Run `pnpm test` to verify full workspace stability.
- [x] 4.4 Run `openspec validate --all`.
