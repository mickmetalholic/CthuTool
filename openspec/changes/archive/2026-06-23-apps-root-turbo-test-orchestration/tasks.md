## 1. Audit and Contracts

- [x] 1.1 Audit package scripts that call `build:deps` from `build`, `typecheck`, `test`, and `test:cov`.
- [x] 1.2 Add or update root engineering contract tests for required Turbo validation task dependencies.
- [x] 1.3 Add or update contract tests that package validation scripts remain directly runnable or explicitly document Turbo-provided prerequisites.
- [x] 1.4 Add or update contract tests that Turbo outputs remain compatible with build and coverage artifact consumers.

## 2. Turbo Orchestration

- [x] 2.1 Update `turbo.json` so root validation tasks declare required upstream dependencies for root-managed packages.
- [x] 2.2 Add Turbo task entries for standardized test layer scripts only where they are needed for root orchestration.
- [x] 2.3 Keep root scripts delegated through Turbo without narrowing the current root validation surface.
- [x] 2.4 Preserve the root workspace boundary excluding `scratches/collection-hub`.

## 3. Package Script Simplification

- [x] 3.1 Remove redundant package-level dependency builds only where direct package `test` still passes.
- [x] 3.2 Remove redundant package-level dependency builds only where direct package `typecheck` still passes.
- [x] 3.3 Keep package-level dependency builds where they are required for direct filtered commands.
- [x] 3.4 Document any intentional Turbo-only prerequisite if a package script cannot remain self-contained.

## 4. Verification

- [x] 4.1 Run `pnpm run lint` from the repository root.
- [x] 4.2 Run `pnpm run typecheck` from the repository root.
- [x] 4.3 Run `SKIP_ROOT_WORKSPACE_CHECK=true pnpm run test` from the repository root.
- [x] 4.4 Run `SKIP_ROOT_WORKSPACE_CHECK=true pnpm run test:cov` from the repository root.
- [x] 4.5 Run representative direct filtered commands for any package whose dependency-build scripts changed.
- [x] 4.6 Record the relevant Turbo graph or command behavior summary for the implementation notes.
- [x] 4.7 Run `openspec status --change apps-root-turbo-test-orchestration` and confirm the change is apply-ready.
