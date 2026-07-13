## Why

`chc update` currently starts mutating the managed checkout immediately and reports only raw configuration, coarse step names, and a generic `updated` result. Users cannot tell whether an update exists, what changed, whether a long-running step is still active, or how to recover safely from a blocked or failed update.

## What Changes

- Add an update preflight model that resolves the source, inspects checkout safety, identifies current and target commits, and classifies install, update, no-op, blocked, and failed states before global installation.
- Keep an explicit, safe managed `chc update` direct—without a redundant confirmation—but stop before mutation when the checkout is dirty or cannot fast-forward safely.
- Add a read-only `chc update --check` path for update availability without changing the checkout or global installation.
- Skip checkout and `npm install -g` when the selected ref is already current.
- Replace coarse human output with TTY-aware progress, concise non-TTY output, current-to-target summaries, bounded commit highlights, and actionable phase-specific failures.
- Add command-specific verbose output while preserving shared `--quiet`, `--no-interactive`, and single-value `--json` contracts.
- Extend machine-readable update results with stable status, before/after identities, change counts, completed phases, and bounded failure context.
- Update CLI documentation and tests for check, install, update, already-current, blocked, failure, JSON, quiet, verbose, and TTY/non-TTY paths.
- Do not add periodic or shell-startup automatic update checks in this change.

## Capabilities

### New Capabilities

- `apps-cli-update-experience`: Defines update availability checks, preflight safety, state classification, adaptive human output, result summaries, and phase-specific recovery guidance.

### Modified Capabilities

- `apps-cli-self-installation`: Changes managed update execution to detect no-op updates, avoid unnecessary global reinstall, and refuse unsafe checkout mutation before applying an update.

## Impact

- `apps/cli` self-update command, manager, subprocess execution, output rendering, diagnostics, unit tests, integration tests, and committed runtime bundle.
- Root, CLI package, and docs-site lifecycle documentation.
- Existing `chc update`, override flags, `update_failed` error code, committed-bundle verification, and global install mechanism remain supported.
- No background service, shell startup hook, remote API, or new runtime dependency is introduced.
