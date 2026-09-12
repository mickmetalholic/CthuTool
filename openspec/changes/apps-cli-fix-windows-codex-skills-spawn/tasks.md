## 1. Fix the pinned skills process runner

- [x] 1.1 Launch npm's JavaScript npx entrypoint through Node on Windows while preserving the pinned CLI argument array and existing behavior on other platforms.
- [x] 1.2 Update the CLI integration fixture to exercise the Windows process path and assert the pinned invocation.

## 2. Verify and package the fix

- [x] 2.1 Run the focused Codex skills unit and CLI integration tests, TypeScript typecheck, and Biome checks.
- [x] 2.2 Rebuild the committed CLI bundle and verify a read-only `codex skills --json` invocation on Windows.
- [x] 2.3 Validate this OpenSpec change and the affected main capability; review `git diff --check` and confirm generated adapters and `codex/plugins/cthu-codex` are untouched.
