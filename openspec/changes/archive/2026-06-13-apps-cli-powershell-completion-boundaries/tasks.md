## 1. PowerShell Adapter Boundary Handling

- [x] 1.1 Add PowerShell completion text behavior that appends a trailing space for non-flag candidates.
- [x] 1.2 Keep flag candidates free of automatic trailing spaces.
- [x] 1.3 Add an internal empty-current-word marker emitted by the PowerShell adapter.
- [x] 1.4 Translate the empty-current-word marker back to an empty word inside `chc __complete`.

## 2. Completion Protocol Semantics

- [x] 2.1 Preserve `chc __complete browser` as current-word prefix completion.
- [x] 2.2 Preserve `chc __complete browser <empty>` as nested child-command completion.
- [x] 2.3 Avoid treating exact current-word command matches as automatic descent into child commands.

## 3. Documentation

- [x] 3.1 Update PowerShell setup docs to pipe generated scripts through `Out-String` before `Invoke-Expression`.

## 4. Verification

- [x] 4.1 Add completion integration coverage for direct current-word completion and empty-current-word marker translation.
- [x] 4.2 Run `pnpm --filter @cthutool/cli test -- completion-command`.
- [x] 4.3 Run `pnpm --filter @cthutool/cli typecheck`.
- [x] 4.4 Run `pnpm --filter @cthutool/cli build`.
- [x] 4.5 Verify PowerShell `TabExpansion2` behavior for `chc browse`, `chc browser`, and `chc browser `.
