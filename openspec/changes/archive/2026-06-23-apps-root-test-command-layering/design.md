## Context

The root workspace currently treats `test` as the canonical full validation command for root-managed runtime test suites. That command is intentionally broad: it includes root engineering contracts, package unit tests, CLI integration tests, and backend e2e-style checks. This preserves confidence but makes local iteration and CI ownership less obvious.

The clearest layering opportunities are in `@cthutool/cli` and `@cthutool/backend`. CLI already separates files under `tests/unit` and `tests/integration`; backend keeps e2e tests under `e2e` while module and service specs live under `src`. Other packages currently have smaller smoke or unit suites where adding layer scripts may add more maintenance cost than value.

This change should define the script vocabulary and start with packages that have real layer boundaries, without weakening `pnpm run test` or changing coverage policy.

## Goals / Non-Goals

**Goals:**

- Introduce standard root-managed test layer script names where a package has meaningful layers.
- Split CLI and backend package tests into unit, integration, and/or e2e commands using their existing runner choices.
- Keep package `test` scripts as the full default validation path.
- Keep root `pnpm run test` behavior at least as broad as it is today.
- Add contract coverage so future packages do not invent incompatible layer names or runner choices.
- Document which layers exist and how root CI should use them.

**Non-Goals:**

- Do not migrate CLI from Bun test.
- Do not change coverage artifact requirements or add coverage thresholds.
- Do not optimize Turbo scheduling in this change beyond what is needed for script correctness.
- Do not force every package to add empty layer scripts.
- Do not reorganize test files solely for naming aesthetics.
- Do not change `scratches/collection-hub`.

## Decisions

### Use additive layer scripts

Packages with meaningful test layers will add `test:unit`, `test:integration`, and/or `test:e2e`. A package is not required to expose a layer script if it does not have that layer.

Alternative considered: require all packages to expose all layer scripts. That would recreate the placeholder-script problem this repository just removed, because small packages would need no-op layer commands.

### Keep `test` as the full package default

For packages that add layer scripts, `test` will remain the full package test command and may delegate to layer scripts. Root `pnpm run test` should continue to run the full test surface.

Alternative considered: make `test` unit-only and move slower tests to separate CI jobs immediately. That would be a semantic change to the root gate and should be considered only after the layers are visible and stable.

### Start with CLI and backend

`@cthutool/cli` and `@cthutool/backend` have clear existing boundaries. CLI uses Bun and can target `tests/unit` and `tests/integration`. Backend uses Vitest and can target `src/**/*.spec.ts` for unit/module tests plus `e2e/**/*.e2e-spec.ts` for e2e tests.

Alternative considered: layer every package in one pass. That adds churn to packages whose current suites are already small and does not improve ownership.

### Preserve runner policy per package

Layer scripts must use the same runner policy as the package's main `test` script: CLI layers use Bun test, non-CLI runtime package layers use Vitest.

Alternative considered: use Vitest for all layer scripts to simplify naming. That would violate the CLI runtime-fidelity decision from the previous test governance change.

### Use contracts for vocabulary and coverage of the full default

Root engineering contract tests should verify that layer scripts use approved names and runners, and that `test` is not narrowed to only one layer without an explicit documented decision.

Alternative considered: rely on package-owner convention. That is weaker than existing root package script contracts and would let drift re-enter through new package scripts.

## Risks / Trade-offs

- Layer scripts accidentally omit tests from package `test` -> Keep `test` as full default and add contract tests for known layered packages.
- File globs diverge from future test locations -> Prefer runner include patterns in package config or scripts that match existing directory ownership, and update contracts when a package adds a new layer.
- More package scripts increase maintenance cost -> Only require layer scripts for packages with real layer boundaries.
- CI runtime does not improve immediately -> This change is about explicit layers; Turbo and CI optimization can follow once layer behavior is stable.

## Migration Plan

1. Add contract tests for the approved test layer vocabulary and runner policy.
2. Add CLI layer scripts using Bun test for unit and integration directories.
3. Add backend layer scripts using Vitest for source specs and e2e specs.
4. Keep `test` scripts delegating to the full set of package layers.
5. Document root and package layer behavior in the appropriate engineering configuration docs or scripts contract tests.
6. Run root typecheck and test verification.

## Open Questions

- Should backend module-level Nest specs be treated as unit or integration in naming? The initial implementation should keep them under the fast source-spec layer unless a specific suite requires external resources.
- Should root CI add separate layer jobs immediately, or should this change only expose the package scripts and leave CI decomposition for a later orchestration change?
