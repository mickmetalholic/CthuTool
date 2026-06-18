## Context

The root workspace is a pnpm/Turbo monorepo for `apps/*` and `packages/*`. It currently has a root Biome lint gate, package-level build/test/typecheck scripts, CI for lint and tests, and an intentionally isolated nested workspace under `scratches/collection-hub`.

Several engineering configuration issues now need one focused pass:

- The root lint command fails before CI can provide a reliable signal.
- CI does not run the root `typecheck` script.
- Turbo tasks declare no outputs, which prevents meaningful build and coverage cache behavior.
- Package scripts are not consistently exposed across workspace members, so root orchestration depends on implicit Turbo skip behavior.
- `scratches/collection-hub` is an experimental nested workspace, but that boundary is easy to miss when reviewing root workspace configuration.

## Goals / Non-Goals

**Goals:**

- Restore a passing root lint gate for root-managed packages.
- Run typechecking in CI as a first-class quality gate.
- Declare Turbo outputs for build and coverage-producing tasks.
- Converge workspace package scripts enough that root orchestration is explicit and predictable.
- Preserve and document the experimental boundary for `scratches/collection-hub`.

**Non-Goals:**

- Redesign the test architecture or move lint checks out of tests.
- Expand Codecov/coverage policy beyond the existing root and backend uploads.
- Redesign the lint system across Biome, ESLint, and Prettier.
- Change OpenSpec global configuration rules.
- Migrate `scratches/collection-hub` into the root pnpm workspace.

## Decisions

### Keep root orchestration scoped to root workspace members

The root workspace will continue to target `apps/*` and `packages/*`. `scratches/collection-hub` remains a nested experimental workspace with its own package manager files and verification entrypoint.

Alternative considered: add `scratches/collection-hub/*` to the root workspace. This would create one dependency graph, but it would also couple experimental dependencies, lockfile churn, and verification failures into the root product workspace. That is out of scope for this change.

### Treat package scripts as a workspace contract

Root workspace packages should expose the scripts that root orchestration expects: `build`, `test`, `test:cov`, `typecheck`, and `lint`, with narrow exceptions only when a package cannot perform that action meaningfully. No-op scripts are acceptable when they make intentional absence explicit.

This makes the multi-package toolchain install/check flow clearer: after `pnpm install`, a developer or CI runner can use root commands as the canonical bootstrap verification surface instead of remembering per-package exceptions. In this context, "bootstrap/check flow" means a repeatable sequence such as install dependencies, then run lint, typecheck, build, and tests from the repo root with all workspace packages participating predictably.

Alternative considered: rely on Turbo silently skipping packages without matching scripts. This is less noisy initially, but it hides accidental omissions and makes root commands less useful as contracts.

### Add typecheck to the main CI gate

The CI check job should run `pnpm run typecheck` after lint and before or alongside tests. This makes TypeScript errors block PRs and main pushes even when tests do not cover the affected package.

Alternative considered: only run package-specific typechecks in targeted workflows. That misses cross-workspace changes and duplicates logic.

### Declare Turbo outputs by artifact type

Turbo should cache build and coverage tasks based on known output directories such as `dist`, framework output directories, Electron release output, and coverage output. Typecheck and test tasks can remain outputless unless they produce durable artifacts.

Alternative considered: leave all outputs empty. That is simpler but gives up Turbo's artifact cache for the commands most likely to benefit from it.

### Preserve agent configuration boundaries without expanding this change

The repository intentionally tracks portable agent/project instructions under `.claude/`, `.codex/`, `.cursor/`, and `codex/`, while excluding local runtime state such as auth, sessions, caches, logs, and generated adapters. This change should not reorganize those folders. If implementation touches root ignores or scripts, it must not weaken that boundary.

## Risks / Trade-offs

- **Risk: package script no-ops hide real gaps** -> Keep no-ops explicit and prefer real commands where package tooling already exists.
- **Risk: CI time increases after adding typecheck** -> Typecheck catches failures earlier and can use Turbo caching locally; later CI optimization can split jobs if needed.
- **Risk: Turbo outputs miss package-specific artifacts** -> Start with known current outputs and update as new package build outputs are introduced.
- **Risk: experimental workspace remains unverified by root CI** -> Document the boundary clearly and leave a future task to add a separate experimental workspace CI path if desired.

## Migration Plan

1. Update root and package configuration files.
2. Add or update contract tests for script convergence and experimental workspace boundaries.
3. Run root lint and typecheck locally.
4. Leave `scratches/collection-hub` package contents and lockfile untouched unless only documentation or boundary metadata is needed.

## Open Questions

- Should a future CI workflow run `pnpm run check` inside `scratches/collection-hub` on paths-limited changes?
- Should the root repo eventually provide one `pnpm run check` command that orders lint, typecheck, build, and tests?
