## 1. Update Planning Model

- [x] 1.1 Add stable update identity, plan classification, apply result, phase event, bounded change-summary, and typed phase-failure models to the self-update domain.
- [x] 1.2 Implement preflight resolution for absent, current, update-available, dirty, and diverged checkout states without changing checkout files or the global installation.
- [x] 1.3 Add dependency-injected unit tests for branch, annotated/lightweight tag, raw commit, missing checkout, dirty checkout, diverged branch, equal target, and available target planning.

## 2. Check and Apply Execution

- [x] 2.1 Add the `chc update --check` command path and prove it performs no clone, checkout, pull, bundle-install verification, or npm global installation.
- [x] 2.2 Route `chc update` through its plan, recheck checkout safety before mutation, skip all apply phases when current, and preserve clone/fetch/checkout/bundle/global-install behavior when work is required.
- [x] 2.3 Replace raw update failures with phase-aware `update_failed` errors containing concise summaries, bounded safe causes, recovery hints, and optional verbose command context.
- [x] 2.4 Extend self-update unit tests to verify installed, updated, up-to-date, blocked, phase-failure, no-op, and time-of-check/time-of-use safety behavior and exact subprocess ordering.

## 3. User-Facing Output Contracts

- [x] 3.1 Implement shared update event rendering for interactive TTY progress and stable non-TTY lines, including source identity, current-to-target summary, and at most five bounded commit highlights.
- [x] 3.2 Add command-specific `--verbose` rendering and preserve quiet suppression, non-interactive prompt suppression, diagnostics separation, redaction, and single-value JSON stdout.
- [x] 3.3 Extend structured JSON results with stable check/apply status, before/target/after identities, completed phases, and bounded change or failure metadata.
- [x] 3.4 Add integration tests for TTY and non-TTY check, install, update, already-current, dirty/diverged block, quiet, verbose, JSON success/error, and actionable human failure output.

## 4. Documentation and Verification

- [x] 4.1 Update root, CLI package, and docs-site lifecycle documentation for direct safe updates, `--check`, already-current behavior, commit summaries, safety blocks, quiet/verbose/JSON modes, and the absence of automatic background checks.
- [x] 4.2 Refresh the committed CLI runtime bundle and confirm generated `.claude/`, `.codex/`, and `.cursor/` adapters remain unchanged.
- [x] 4.3 Run CLI formatting/lint, type checking, full CLI tests, committed-bundle verification, docs build, OpenSpec strict validation, and source/committed-bundle update help and non-mutating check smoke tests.
