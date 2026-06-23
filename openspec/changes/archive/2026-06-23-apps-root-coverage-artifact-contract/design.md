## Context

The root workspace now runs real tests and coverage for root-managed apps and
packages. Coverage is visible, but artifact production is not yet a strict
contract: CI upload paths, Codecov inputs, PR comment logic, and package
runner configuration can drift independently.

The workspace also intentionally keeps `@cthutool/cli` on Bun test while
non-CLI runtime packages use Vitest. Any coverage artifact policy needs to
support both runner families without forcing fake coverage outputs or
percentage thresholds.

## Goals / Non-Goals

**Goals:**

- Define stable coverage artifact paths for root-managed runtime test suites.
- Make CI, Codecov, PR comments, Turbo outputs, and package `test:cov`
  scripts agree on those paths.
- Preserve the runner split: Bun coverage for CLI and Vitest coverage for
  non-CLI runtime packages.
- Add contract tests that fail when coverage artifacts or CI inputs drift.
- Keep the change limited to artifact visibility and discoverability.

**Non-Goals:**

- Do not introduce coverage percentage thresholds.
- Do not migrate `@cthutool/cli` from Bun to Vitest.
- Do not fake coverage for packages that have no runtime coverage support.
- Do not change `scratches/collection-hub`.
- Do not optimize Turbo scheduling beyond what is needed for artifact paths.

## Decisions

### Standardize on package-local `coverage/`

Runtime packages should write coverage artifacts to their package-local
`coverage/` directory. This matches Vitest defaults, Bun's configurable
coverage directory, existing Turbo output scoping, and CI glob patterns.

Alternative considered: collect everything into a root `coverage/` tree. That
would simplify a single upload path but would make local package commands less
self-contained and would complicate Turbo package cache boundaries.

### Require `lcov.info` for uploadable runtime coverage

Every root-managed runtime package with coverage support should produce
`coverage/lcov.info`. This gives Codecov and artifact uploads one stable file
shape across Vitest and Bun packages.

Alternative considered: rely only on runner-native summaries. That keeps each
runner closer to defaults, but CI upload and Codecov inputs would still need
runner-specific branching.

### Treat summary JSON as required where supported by the runner

Vitest packages should produce `coverage/coverage-summary.json` so the PR
comment can report package coverage without parsing lcov. Bun coverage should
remain accepted with lcov and text output unless the current Bun version can
produce compatible JSON without extra tooling.

Alternative considered: require summary JSON for all packages. That would make
PR comments uniform, but it may force custom conversion for Bun before there is
a clear need.

### Validate scripts and CI contracts, not exact runner internals

Root contract tests should verify observable policy: package `test:cov`
commands are real coverage commands, expected artifact paths are represented
in CI and Codecov configuration, and runner exceptions are explicit.

Alternative considered: assert exact script strings. That would catch drift
aggressively but would make harmless script refactors brittle.

## Risks / Trade-offs

- Bun coverage output shape differs from Vitest -> Keep the required common
  artifact to `lcov.info` and make summary JSON runner-specific.
- Package coverage commands become slower -> This change only standardizes
  artifacts; performance optimization belongs to the Turbo orchestration
  follow-up.
- Contract tests overfit current package names -> Derive package expectations
  from root-managed package manifests where possible.
- Coverage artifacts pollute validation tools -> The generated-output
  exclusion change should run before or alongside implementation; this change
  should still avoid adding coverage files to source checks.

## Migration Plan

1. Inventory root-managed runtime packages and their coverage runner.
2. Update package `test:cov` scripts and runner config so artifacts land in
   stable package-local `coverage/` directories.
3. Ensure Vitest packages emit text, lcov, and JSON summary reporters.
4. Ensure CLI Bun coverage emits lcov and text reporters into `coverage/`.
5. Update Turbo coverage outputs, CI artifact upload paths, Codecov inputs,
   and PR comment collection to use the stable paths.
6. Add or update root engineering contract tests for the artifact policy.
7. Run root typecheck, tests, and coverage verification.

Rollback is straightforward: revert the package script/config and CI contract
changes. No persisted runtime data or application behavior is migrated.

## Open Questions

- Should Bun coverage summaries be converted to `coverage-summary.json` later
  if PR comments need CLI percentage details?
- Should packages with only smoke tests be listed separately in PR coverage
  comments to distinguish low coverage from missing artifacts?
