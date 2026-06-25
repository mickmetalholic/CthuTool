## Why

`@cthutool/obsidian-enhancer` is small enough to become the first visibility-only package upgraded through the new coverage gate process. Strengthening its domain tests creates a low-risk proving ground for package graduation before larger frontend packages are gated.

## What Changes

- Expand tests for Obsidian enhancer domain utilities, tag handling, excluded root handling, and adapter boundaries.
- Add negative and edge-case coverage for invalid inputs.
- Record a coverage baseline and evaluate whether the package can graduate to threshold-gated coverage.
- Keep Obsidian runtime integration mocked or adapter-boundary focused.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-root-engineering-config`: add Obsidian enhancer coverage expectations and threshold graduation evaluation.

## Impact

- `packages/obsidian-enhancer/src/**` and `packages/obsidian-enhancer/tests/**`.
- Package Vitest coverage configuration if it graduates to gated coverage.
- Coverage policy documentation and root engineering contract tests.
