## Why

`@cthutool/app-shell` and `@cthutool/ui` are shared frontend foundations, but their current tests are closer to runtime smoke checks than behavior coverage. Improving them together reduces risk for desktop and web consumers and creates better confidence before either package is threshold-gated.

## What Changes

- Add behavior tests for app-shell runtime contracts, navigation definitions, and integration with shared UI primitives.
- Add component behavior tests for UI components beyond utility-level `cn` coverage.
- Preserve shared package type contracts under `typecheck`.
- Record coverage baselines and decide whether either package is ready for threshold-gated coverage.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-root-engineering-config`: add shared app-shell and UI test coverage expectations.

## Impact

- `packages/app-shell/src/**`, `packages/app-shell/tests/**`, `packages/ui/src/**`, and `packages/ui/tests/**`.
- Package Vitest configuration if coverage thresholds are introduced.
- Coverage policy documentation and root engineering contract tests.
