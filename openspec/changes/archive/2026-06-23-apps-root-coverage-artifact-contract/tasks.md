## 1. Coverage Artifact Inventory

- [x] 1.1 Inventory root-managed runtime packages under `apps/*` and `packages/*` and classify each coverage runner as Vitest or Bun.
- [x] 1.2 Document which packages are expected to emit `coverage/lcov.info`.
- [x] 1.3 Document which Vitest packages are expected to emit `coverage/coverage-summary.json`.
- [x] 1.4 Confirm `scratches/collection-hub` remains outside the root-managed coverage contract.

## 2. Contract Tests

- [x] 2.1 Extend root package script contract tests to verify runtime package `test:cov` scripts execute real coverage-producing runners.
- [x] 2.2 Add contract coverage that non-CLI Vitest packages have coverage configuration capable of producing lcov and summary JSON artifacts.
- [x] 2.3 Add contract coverage that `@cthutool/cli` remains the Bun coverage exception and is required to produce lcov output.
- [x] 2.4 Add or update CI workflow contract tests so artifact upload paths, Codecov inputs, and PR summary collection use the declared coverage artifact paths.

## 3. Package Coverage Configuration

- [x] 3.1 Update shared Vitest coverage configuration patterns so non-CLI runtime packages emit text, lcov, and JSON summary reporters.
- [x] 3.2 Update package `test:cov` scripts where needed so coverage artifacts are written under package-local `coverage/` directories.
- [x] 3.3 Update `@cthutool/cli` Bun coverage configuration so lcov output is produced under `apps/cli/coverage/`.
- [x] 3.4 Ensure packages without runtime coverage support do not use placeholder coverage scripts.

## 4. Root and CI Coverage Consumers

- [x] 4.1 Update Turbo `test:cov` outputs so root, app, and package coverage artifacts are cacheable and discoverable.
- [x] 4.2 Update CI coverage artifact upload paths to include root, app, and package `coverage/**` outputs.
- [x] 4.3 Update Codecov file inputs to include root, app, and package `coverage/lcov.info` files.
- [x] 4.4 Update PR coverage comment collection so expected Vitest summary artifacts are collected consistently and missing expected summaries are visible as configuration drift.

## 5. Verification

- [x] 5.1 Run `pnpm run typecheck` from the repository root.
- [x] 5.2 Run `SKIP_ROOT_WORKSPACE_CHECK=true pnpm run test` from the repository root.
- [x] 5.3 Run `SKIP_ROOT_WORKSPACE_CHECK=true pnpm run test:cov` from the repository root.
- [x] 5.4 Verify expected `coverage/lcov.info` files exist for root-managed runtime packages after coverage runs.
- [x] 5.5 Verify expected Vitest `coverage/coverage-summary.json` files exist after coverage runs.
- [x] 5.6 Run `openspec status --change apps-root-coverage-artifact-contract` and confirm the change is apply-ready.
