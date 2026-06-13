## 1. Command Design

- [x] 1.1 Add `enable`, `disable`, and `status` subcommands under `completion`.
- [x] 1.2 Preserve existing `chc completion powershell` and `chc completion zsh` script-generation behavior.
- [x] 1.3 Reject unsupported managed shells with a clear error.

## 2. PowerShell Profile Management

- [x] 2.1 Resolve the current user's PowerShell profile path through PowerShell.
- [x] 2.2 Add an idempotent managed marker block for persistent completion loading.
- [x] 2.3 Remove only the managed marker block during disable.
- [x] 2.4 Create the profile directory and file when enabling and they do not exist.

## 3. Completion Candidates

- [x] 3.1 Update completion candidate discovery for `completion enable|disable|status`.
- [x] 3.2 Add nested shell candidates for managed completion commands.

## 4. Documentation

- [x] 4.1 Document one-shot loading, persistent enable, persistent disable, and status checks in `apps/cli/README.md`.

## 5. Verification

- [x] 5.1 Add integration tests for profile enable, disable, status, and idempotency using an isolated test profile path or mocked resolver.
- [x] 5.2 Add integration tests for new completion candidates.
- [x] 5.3 Run `pnpm --filter @cthutool/cli test -- completion-command`.
- [x] 5.4 Run `pnpm --filter @cthutool/cli typecheck`.
- [x] 5.5 Run `git diff --check`.
