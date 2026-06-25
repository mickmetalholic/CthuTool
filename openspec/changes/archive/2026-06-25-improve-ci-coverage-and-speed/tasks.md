## 1. Contract Coverage

- [x] 1.1 Extend root CI contract tests to require lint, typecheck, test, build, CLI distribution, and coverage gates in the primary CI workflow.
- [x] 1.2 Extend workspace package script contract tests to require meaningful `lint`, `typecheck`, `test`, `test:cov`, and `build` scripts for every root-managed package.
- [x] 1.3 Add or update contract tests that verify root workspace orchestration excludes `scratches/collection-hub`.
- [x] 1.4 Add or update contract tests for Turbo cache restoration in workflows that run Turbo tasks.

## 2. Root CI and Turbo Orchestration

- [x] 2.1 Update root package scripts so package-level lint validation is orchestrated through Turbo while preserving root-level validation where needed.
- [x] 2.2 Update `.github/workflows/ci.yml` to split primary validation into focused jobs for lint, typecheck, test, build, CLI distribution, and coverage.
- [x] 2.3 Add `.turbo/cache` restore/save steps to CI jobs that run Turbo tasks while preserving pnpm dependency caching.
- [x] 2.4 Add a primary CI build gate that runs root-managed workspace build validation.
- [x] 2.5 Add a primary CI CLI distribution gate that runs `pnpm run check:cli-dist`.
- [x] 2.6 Scope CI job permissions so validation jobs use read-only contents access and coverage receives only the permissions it needs.

## 3. Desktop Artifact CI

- [x] 3.1 Update desktop artifact workflow path filters to include `packages/app-shell/**`, `packages/ui/**`, and shared Turbo or workspace configuration inputs.
- [x] 3.2 Update desktop artifact workflow validation to use Turbo filtered graph execution for `@cthutool/desktop...`.
- [x] 3.3 Add desktop package scripts that allow Windows and macOS packaging to reuse existing build output.
- [x] 3.4 Update desktop artifact workflow packaging steps to avoid intentionally rebuilding the same desktop output after graph build validation.

## 4. Backend Image CI

- [x] 4.1 Update backend image workflow triggers so relevant pull requests run backend Docker build validation.
- [x] 4.2 Split backend image workflow behavior so pull requests build without registry login, image push, or deployment manifest updates.
- [x] 4.3 Keep main branch backend image publishing with `main` and commit-SHA tags.
- [x] 4.4 Add concurrency protection for main branch backend image publishing and deployment manifest updates.
- [x] 4.5 Pin the backend Dockerfile Corepack pnpm version to the exact repository package manager version.

## 5. Verification

- [x] 5.1 Run OpenSpec validation for `improve-ci-coverage-and-speed`.
- [x] 5.2 Run affected root contract tests.
- [x] 5.3 Run root lint, typecheck, tests, build, and CLI distribution checks as feasible in the local worktree.
- [x] 5.4 Verify `git status` shows only files belonging to this change and no generated agent adapter files were edited.
