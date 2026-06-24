## Context

Root-managed runtime packages now have real test and coverage commands, stable coverage artifact requirements, and explicit generated-output exclusions in the engineering config spec. Coverage visibility is useful, but it does not prevent regressions once packages have enough tests to make coverage meaningful.

The repository has uneven package maturity. Backend, config, and agent-protocol have meaningful existing coverage signals. Smaller app shell, UI, docs, web, and smoke-test-focused packages should remain visible without being blocked by premature thresholds. The CLI uses Bun coverage, so any policy must preserve its runner-specific behavior instead of forcing Vitest conventions onto it.

## Goals / Non-Goals

**Goals:**

- Add package-aware coverage quality gates for root-managed runtime packages with mature coverage signals.
- Keep early thresholds conservative so they prevent obvious regressions without requiring broad test rewrites.
- Keep coverage visibility for packages that are not yet threshold-gated.
- Make CI failures identify the package and coverage metric that failed.
- Capture the graduation policy for moving packages from visibility-only to threshold-gated coverage.

**Non-Goals:**

- Do not add a single repository-wide coverage threshold.
- Do not require smoke-test-heavy packages to meet thresholds in this change.
- Do not migrate `@cthutool/cli` from Bun coverage.
- Do not change `scratches/collection-hub` coverage behavior.
- Do not treat generated coverage artifacts as source files.

## Decisions

### Gate only mature packages first

Initial gates should apply to packages with enough existing behavioral coverage to make a threshold meaningful: backend, config, and agent-protocol. These packages already have stable runtime tests and coverage artifacts, so thresholds can catch regressions without forcing low-surface packages into artificial tests.

Alternative considered: set thresholds for every runtime package immediately. That would create noise for docs, web, UI, app-shell, and other smoke-test-focused packages where low coverage reflects scope rather than regression.

### Use per-package thresholds, not a root aggregate threshold

Thresholds should live at the package runner level where the package owns its test surface and coverage output. The root coverage command should fail if a threshold-gated package fails, but it should not rely on a blended root aggregate that can hide a package regression.

Alternative considered: enforce one root-level threshold from combined coverage. That is simpler to configure, but it allows large packages to mask regressions in smaller ones and makes ownership unclear.

### Keep initial thresholds conservative and explicit

The first thresholds should be lower than current observed package coverage, leaving headroom for non-semantic coverage variation while preventing large drops. Threshold values should be explicit in the package coverage configuration and documented in root engineering contracts.

Alternative considered: set thresholds near current coverage. That maximizes protection but makes unrelated refactors more likely to fail on incidental line-count shifts.

### Maintain visibility-only status for immature packages

Packages without threshold gates should still produce and publish coverage artifacts. Their coverage remains visible in CI comments and Codecov, but failure is reserved for artifact production drift rather than percentage drift.

Alternative considered: exempt immature packages from coverage entirely. That reduces noise, but it removes the trend data needed to decide when they are ready for gates.

## Risks / Trade-offs

- Thresholds may fail during legitimate refactors -> Keep initial thresholds conservative and package-local.
- Package coverage output may differ between Vitest and Bun -> Preserve runner-specific coverage configuration and avoid Vitest-only assumptions for CLI.
- Teams may treat visibility-only packages as ungoverned -> Document graduation criteria and keep their artifact contracts enforced.
- Coverage can incentivize low-value tests -> Gate only mature packages first and avoid thresholds for smoke-test-only packages.

## Migration Plan

1. Record current package coverage baselines from existing `test:cov` outputs.
2. Add conservative package-local thresholds for backend, config, and agent-protocol.
3. Update root engineering contracts to distinguish threshold-gated packages from visibility-only packages.
4. Ensure CI and root coverage commands fail with package-identifiable threshold errors.
5. Document graduation criteria for adding future packages to the threshold-gated set.
6. Verify root lint, typecheck, test, and coverage commands after thresholds are configured.

Rollback is to remove or relax the package-local threshold configuration while keeping coverage artifact production and reporting intact.

## Open Questions

- What exact initial threshold values should be chosen from the latest coverage baselines?
- Should CLI Bun coverage receive a threshold now, or remain visibility-only until Bun coverage output is normalized with the Vitest packages?
