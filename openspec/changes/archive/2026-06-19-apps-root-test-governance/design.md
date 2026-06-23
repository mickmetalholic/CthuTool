## Context

The root-managed workspace covers `apps/*` and `packages/*`; `scratches/collection-hub` is a nested experimental workspace and remains outside root orchestration. Today the root test gate combines Jest contract tests, package test scripts, type-only package checks, and placeholder commands that print "No tests configured" while exiting successfully.

The current package landscape has three different legitimate needs:

- `@cthutool/cli` should keep Bun test because it validates CLI behavior in the runtime used by the package.
- Browser, backend, docs, web, and shared packages should converge on Vitest for runtime tests.
- Type-only public API contracts for shared UI packages belong in `typecheck`, not `test`.

## Goals / Non-Goals

**Goals:**

- Make `test` mean real executable tests for every root-managed package.
- Keep CLI on Bun test while standardizing other runtime tests on Vitest.
- Move type-only contracts into `typecheck` and keep them covered by root CI.
- Remove or replace placeholder `test` and `test:cov` scripts.
- Make coverage output and PR reporting reflect all root-managed runtime test suites with coverage support.
- Add contract checks so the governance rules fail fast when new packages drift.

**Non-Goals:**

- Do not change `scratches/collection-hub` dependency, test, or CI behavior.
- Do not rewrite CLI tests to Vitest.
- Do not use coverage thresholds as a gate in this change; visibility comes first.
- Do not make type-only packages produce artificial runtime coverage.

## Decisions

### Keep the CLI on Bun test

`@cthutool/cli` validates command behavior, Bun entrypoints, and bundled script flows. Keeping Bun test preserves runtime fidelity and avoids a migration that would reduce confidence.

Alternative considered: migrate all packages, including CLI, to Vitest. This would simplify the runner list but would make CLI integration tests less representative of the package runtime.

### Use Vitest for non-CLI runtime tests

Root contract tests, backend, desktop, docs, web, and shared packages will use Vitest for runtime tests. This removes Jest and ts-jest from the root-managed test stack once backend migration is complete.

Alternative considered: keep Jest for backend and small packages. That lowers immediate risk but preserves two Node test stacks for similar TypeScript runtime tests.

### Treat backend migration as a focused step

Backend NestJS tests use decorators and dependency injection. The migration must ensure decorator metadata and Nest testing module behavior work under Vitest before removing Jest. If the default Vitest transform is insufficient, the implementation should add a narrowly scoped transformer such as SWC for backend tests rather than changing application code.

Alternative considered: change backend tests to avoid Nest module wiring. That would weaken coverage of the module and e2e contracts.

### Move type-only contracts to typecheck

Packages such as `@cthutool/app-shell` and `@cthutool/ui` currently use `test` to run TypeScript-only public API checks. These checks are useful, but they should run under `typecheck` so `test` remains reserved for executable runtime behavior.

Alternative considered: keep type-only checks under `test` and document exceptions. That keeps less implementation churn but leaves the root test signal ambiguous.

### Coverage reporting is visible before it is strict

The coverage job should collect and publish coverage artifacts for root Vitest packages, backend, desktop, and CLI where available. Packages whose only validation is typecheck should not fake coverage; they should either add runtime tests or document why coverage is not applicable.

Alternative considered: introduce coverage thresholds immediately. That increases friction before the repository has consistent package-level coverage visibility.

## Risks / Trade-offs

- Backend Vitest migration fails on Nest decorator metadata or lifecycle hooks -> Validate backend test config in isolation before deleting Jest dependencies; use a backend-scoped transformer if needed.
- Coverage tooling differs between Bun and Vitest -> Keep CLI coverage as Bun-generated output and merge/report it separately from Vitest outputs.
- Minimal tests for docs/web/obsidian-enhancer become shallow smoke tests -> Prefer focused smoke tests now, then let package owners grow behavior-specific tests as features mature.
- Contract tests overfit script strings -> Validate observable policies such as no placeholder scripts and expected runner families, not exact commands beyond necessary exceptions.

## Migration Plan

1. Add or update contract tests that define the target policy while allowing existing failures during implementation only through the in-flight change.
2. Add Vitest runtime smoke tests for packages that currently have placeholder tests.
3. Move type-only tests from `test` into `typecheck` for shared UI packages and add runtime smoke tests where needed.
4. Migrate root, package protocol/config tests, desktop coverage, and docs/web/obsidian-enhancer to Vitest.
5. Migrate backend to Vitest with Nest-compatible transform support, then remove Jest and ts-jest dependencies/configuration.
6. Update CI coverage artifact collection, PR coverage comments, and Codecov file list.
7. Run root lint, typecheck, test, and coverage verification before archiving.

## Open Questions

- Which backend Vitest transformer gives the smallest reliable configuration for NestJS decorator metadata in this repository?
- Should coverage PR comments list every package independently, or group low-surface packages under a shared "workspace packages" section?
