## Why

Several package scripts now run dependency builds directly before tests or typechecks. That keeps single-package commands self-contained, but it can duplicate work under Turbo and make root validation slower than necessary. As test layers become clearer, Turbo should own more orchestration while package scripts remain understandable and usable.

The repository needs a focused optimization pass that preserves correctness while reducing redundant dependency builds.

## What Changes

- Review root Turbo task dependencies for `build`, `typecheck`, `test`, `test:cov`, and any new test layer scripts.
- Move cross-package orchestration into Turbo `dependsOn` where doing so preserves local package command behavior.
- Keep package scripts self-contained when developers run them directly outside Turbo.
- Add contract coverage for Turbo task outputs and dependency relationships that are required by root validation.
- Measure or document before/after validation behavior for the affected commands.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-root-engineering-config`: optimize root-managed Turbo validation orchestration while preserving package command contracts.

## Impact

- `turbo.json`, root scripts, and selected package scripts.
- Potential CI runtime improvements for root validation and coverage jobs.
- Root engineering contract tests for Turbo orchestration assumptions.
- No changes to test assertions or application runtime behavior.
- No changes under `scratches/collection-hub`.

## Sequencing

This should follow test command layering. It may also depend on coverage artifact contracts if `test:cov` orchestration is optimized.
