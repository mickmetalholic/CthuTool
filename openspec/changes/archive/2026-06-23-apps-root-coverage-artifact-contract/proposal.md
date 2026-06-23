## Why

The repository now runs real coverage commands for root-managed runtime test packages, but the expected coverage artifact shape is still loose. CI, Codecov, and PR comments depend on stable paths such as `coverage/lcov.info` and summary JSON files, so missing or inconsistent artifacts can silently reduce coverage visibility.

Before introducing coverage thresholds, the repository should first make coverage artifact production observable and contractually stable.

## What Changes

- Require runtime test packages with coverage support to produce stable coverage artifacts.
- Define package-level expectations for `coverage/lcov.info` and, where the runner supports it, `coverage/coverage-summary.json`.
- Add root engineering contract tests that verify `test:cov` scripts and CI coverage inputs agree on artifact paths.
- Keep `@cthutool/cli` on Bun coverage while documenting runner-specific artifact differences.
- Keep coverage visibility non-blocking on percentage thresholds in this change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-root-engineering-config`: tighten coverage artifact requirements for root-managed runtime test suites.

## Impact

- Package `test:cov` scripts and runner configuration for root-managed apps/packages.
- Turbo coverage outputs, CI coverage artifact upload, PR coverage summary logic, and Codecov inputs.
- Root engineering contract tests for coverage artifact consistency.
- No coverage percentage thresholds.
- No changes under `scratches/collection-hub`.

## Sequencing

This should follow generated-output exclusion cleanup. It should precede coverage quality gates so thresholds are built on reliable artifact production.
