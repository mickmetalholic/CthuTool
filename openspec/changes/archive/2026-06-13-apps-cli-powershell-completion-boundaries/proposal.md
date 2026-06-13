## Why

PowerShell completion for `chc` can mis-handle command-position boundaries: completing `chc browse` may produce `chc browser` without moving to the next word, and the next Tab can replace `browser` with a child command such as `auth` or `install`. Windows command shims can also drop an empty current-word argument, so the CLI needs an explicit boundary contract for PowerShell adapters.

## What Changes

- Tighten PowerShell completion behavior so non-flag command candidates complete with a trailing space and advance to the next word.
- Preserve the distinction between completing the current command word and completing an empty word after a command path.
- Add a PowerShell-safe empty-word marker for the internal completion protocol so Windows/Volta command shims cannot collapse `chc __complete browser ""` into `chc __complete browser`.
- Add tests that cover the `chc browse` to `chc browser ` flow and the `chc browser <Tab>` subcommand flow.
- Correct PowerShell setup documentation so generated multi-line scripts are evaluated as a single script block.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-cli-shell-completion`: Clarify PowerShell word-boundary behavior and empty current-word transport for nested command completion.

## Impact

- Affects the PowerShell script rendered by `apps/cli/src/command/completion.command.ts`.
- Affects the internal `chc __complete` protocol only for an adapter-owned empty-word marker.
- Adds integration coverage in `apps/cli/tests/integration/completion-command.test.ts`.
- Updates PowerShell setup guidance in `apps/cli/README.md`.
