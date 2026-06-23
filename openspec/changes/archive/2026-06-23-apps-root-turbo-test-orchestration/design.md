## Context

Root validation now spans ten root-managed packages across apps and packages. Some package scripts call `build:deps` before tests, coverage, or typecheck so direct package commands work reliably. At the same time, root commands run through Turbo, which already has a dependency graph and can schedule upstream builds more efficiently than repeated script-level `pnpm --filter ... build` calls.

The current tension is intentional: package scripts need to remain usable in isolation, while root validation should avoid redundant dependency builds. This change focuses on root-managed orchestration only and keeps `scratches/collection-hub` outside scope.

## Goals / Non-Goals

**Goals:**

- Make Turbo task dependencies the primary source of root validation orchestration.
- Preserve direct package command usability for local development and targeted debugging.
- Reduce redundant dependency builds in root `test`, `test:cov`, and `typecheck` flows where Turbo can safely own the dependency edge.
- Add contract coverage for Turbo dependency and output assumptions so future packages do not drift.
- Keep root commands semantically equivalent: optimization must not narrow the validation surface.

**Non-Goals:**

- Do not change test assertions or application runtime behavior.
- Do not introduce coverage thresholds.
- Do not require every package to expose test layer scripts.
- Do not optimize `scratches/collection-hub`.
- Do not hand-edit generated agent adapter instructions.

## Decisions

### Use Turbo for root orchestration, not for all local command semantics

Root commands should rely on Turbo `dependsOn` relationships for cross-package ordering. Package scripts may still include `build:deps` or equivalent safeguards when they need to work outside Turbo, such as `pnpm --filter @cthutool/desktop test`.

Alternative considered: remove all package-level `build:deps` and rely only on Turbo. That would be faster in root CI but would make direct package commands fragile unless every test configuration imports workspace sources instead of built outputs.

### Prefer explicit Turbo tasks over hidden script coupling

If root validation needs a build before a package's test or typecheck, that dependency should be visible in `turbo.json`. This makes the root graph reviewable and lets Turbo cache or parallelize work consistently.

Alternative considered: keep dependency builds inside package scripts only. That preserves local behavior but makes root validation do repeated work and hides dependency edges from Turbo.

### Optimize only after contract tests describe the graph

Contract tests should first assert the expected Turbo task dependencies, cache outputs, and root/package script boundaries. Then implementation can remove redundant script-level builds where the contract proves root orchestration remains correct.

Alternative considered: change scripts first and rely on command-level verification. That would work once, but it would not prevent future drift.

### Measure behavior with command verification rather than strict timing gates

This change should document or capture before/after command behavior, but it should not gate on wall-clock duration. Local hardware, caches, and Turbo cache state make timing thresholds brittle.

Alternative considered: add a performance budget to CI. That would be noisy before the repository has stable historical timing data.

## Risks / Trade-offs

- Removing a package-level dependency build breaks direct package commands -> Keep package scripts self-contained unless tests prove they import source directly or direct filtered commands still pass.
- Turbo dependency graph becomes over-constrained and reduces parallelism -> Add only required upstream dependencies and verify root commands still run successfully.
- Root tests become faster but less complete -> Contract tests must assert root `test` and `test:cov` still delegate to full package validation surfaces.
- Repeated builds remain in some packages -> Accept this where local command fidelity matters more than root speed.
- Timing claims become unstable -> Record command behavior and graph changes, but avoid timing thresholds.

## Migration Plan

1. Audit package scripts that invoke `build:deps` in `build`, `typecheck`, `test`, and `test:cov`.
2. Add root engineering contract tests for Turbo dependency relationships, task outputs, and package direct-command safeguards.
3. Update `turbo.json` so root validation tasks declare the cross-package dependencies they require.
4. Remove or simplify redundant package-level dependency builds only where direct package commands remain valid.
5. Run root lint, typecheck, test, and coverage commands.
6. Capture the final Turbo graph or command behavior summary in the implementation notes.

Rollback is straightforward: restore the previous package script dependency builds and Turbo task definitions if validation semantics regress.

## Open Questions

- Which package scripts can safely drop `build:deps` because their tests already alias workspace sources?
- Should root command scripts eventually call `turbo run test --continue` for broader failure reporting, or keep the current fail-fast behavior?
- Should this change add explicit Turbo tasks for test layers immediately, or only after layer scripts are fully standardized across the target packages?
