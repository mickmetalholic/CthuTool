## 1. Lint Gate

- [x] 1.1 Update Biome configuration so Tailwind CSS directives used by root-managed packages parse successfully.
- [x] 1.2 Fix existing root-managed Biome diagnostics without changing runtime behavior.
- [x] 1.3 Run `pnpm run lint` from the repository root and confirm it passes.

## 2. Package Script Contract

- [x] 2.1 Inspect every root workspace package under `apps/*` and `packages/*` for `build`, `test`, `test:cov`, `typecheck`, and `lint` scripts.
- [x] 2.2 Add real scripts where package tooling already supports the standard command.
- [x] 2.3 Add explicit no-op scripts for standard commands that are intentionally unsupported by a package.
- [x] 2.4 Add or update contract tests that verify the root workspace package script contract.

## 3. Turbo and CI Configuration

- [x] 3.1 Declare Turbo `build` outputs for current root workspace package artifact directories.
- [x] 3.2 Declare Turbo `test:cov` outputs for generated coverage directories.
- [x] 3.3 Update the primary CI check job to run `pnpm run typecheck`.
- [x] 3.4 Run or inspect the CI workflow contract tests that cover the typecheck gate.

## 4. Experimental Workspace Boundary

- [x] 4.1 Document that `scratches/collection-hub` is an experimental nested workspace outside root orchestration.
- [x] 4.2 Add or update contract tests that verify root workspace globs do not include `scratches/collection-hub`.
- [x] 4.3 Confirm no implementation step migrates `scratches/collection-hub` into the root pnpm workspace.

## 5. Verification

- [x] 5.1 Run `pnpm run typecheck` from the repository root and record the result.
- [x] 5.2 Run targeted contract tests for root package scripts, CI workflow, and workspace boundaries.
- [x] 5.3 Review `git diff` to confirm only this change's engineering configuration and OpenSpec artifacts were modified.
