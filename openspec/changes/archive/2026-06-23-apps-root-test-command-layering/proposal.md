## Why

The current root `test` command runs a mix of unit tests, integration tests, and e2e-style checks. That gives broad confidence, but it also makes runtime, speed, and failure ownership less obvious. CLI and backend suites are the clearest examples: both contain fast unit tests alongside slower integration or e2e flows.

The repository needs explicit test layers before optimizing execution time or changing CI gates.

## What Changes

- Introduce a consistent package script vocabulary for test layers where packages need it: `test:unit`, `test:integration`, and `test:e2e`.
- Start with packages that already have meaningful layer boundaries, especially `@cthutool/cli` and `@cthutool/backend`.
- Keep existing `test` behavior as the canonical full default unless a package explicitly documents a narrower local default.
- Add root engineering contract tests for layer script naming and runner consistency.
- Document which root CI jobs run which layers.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-root-engineering-config`: define root-managed test command layering and orchestration expectations.

## Impact

- Package scripts and test file organization for backend and CLI first, then other packages only where useful.
- Root and CI test orchestration if separate layer jobs are introduced.
- Test documentation and root engineering contract tests.
- No semantic weakening of the existing root `test` gate.
- No changes under `scratches/collection-hub`.

## Sequencing

This can proceed after coverage artifact contracts or in parallel if it does not change coverage behavior. It should precede Turbo test orchestration optimization so performance work has explicit layers to schedule.
