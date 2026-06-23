## 1. Governance Contracts

- [x] 1.1 Update root package script contract tests to reject placeholder validation commands such as "No tests configured" and "No coverage configured".
- [x] 1.2 Add contract coverage for the runner policy: `@cthutool/cli` uses Bun test, all other runtime test packages use Vitest.
- [x] 1.3 Add contract coverage that package `test` scripts are not satisfied only by `tsc --noEmit`.
- [x] 1.4 Keep the root workspace boundary contract excluding `scratches/collection-hub`.

## 2. Shared Test Infrastructure

- [x] 2.1 Add root Vitest configuration for root engineering contract tests.
- [x] 2.2 Add or update package Vitest configuration for non-CLI packages that need runtime tests.
- [x] 2.3 Add Vitest coverage support shared by root-managed Vitest packages.
- [x] 2.4 Remove Jest and ts-jest configuration only after all Jest suites have equivalent Vitest execution.

## 3. Package Test Migration

- [x] 3.1 Migrate root engineering contract tests from Jest to Vitest.
- [x] 3.2 Migrate `packages/agent-protocol` tests from Jest to Vitest.
- [x] 3.3 Migrate `packages/config` tests from Jest to Vitest.
- [x] 3.4 Keep `apps/cli` on Bun test and ensure its `test:cov` remains Bun coverage.
- [x] 3.5 Add real Vitest runtime or smoke tests for `apps/docs`, `apps/web`, and `packages/obsidian-enhancer`.
- [x] 3.6 Add real Vitest runtime or smoke tests for `packages/app-shell` and `packages/ui`.
- [x] 3.7 Move shared package type-only contract files into the relevant `typecheck` command path rather than relying on `test`.

## 4. Backend Vitest Migration

- [x] 4.1 Create a backend Vitest configuration that preserves NestJS decorator metadata and module lifecycle behavior.
- [x] 4.2 Migrate backend mocks from Jest APIs to Vitest APIs without weakening assertions.
- [x] 4.3 Verify backend unit, module, and e2e tests pass under Vitest before deleting Jest dependencies.
- [x] 4.4 Remove backend Jest scripts and configuration after Vitest parity is proven.

## 5. Coverage and CI

- [x] 5.1 Replace placeholder `test:cov` scripts with real coverage-producing commands for runtime test packages.
- [x] 5.2 Update Turbo coverage outputs so package coverage artifacts are cacheable and discoverable.
- [x] 5.3 Update the CI coverage artifact upload paths to include root-managed runtime package coverage outputs.
- [x] 5.4 Update the PR coverage comment to report each collected package coverage summary.
- [x] 5.5 Update Codecov file inputs and flags to match the new coverage outputs.

## 6. Verification

- [x] 6.1 Run `pnpm run lint` from the repository root.
- [x] 6.2 Run `pnpm run typecheck` from the repository root.
- [x] 6.3 Run `SKIP_ROOT_WORKSPACE_CHECK=true pnpm run test` from the repository root.
- [x] 6.4 Run `SKIP_ROOT_WORKSPACE_CHECK=true pnpm run test:cov` from the repository root.
- [x] 6.5 Run `openspec status --change apps-root-test-governance` and confirm the change is apply-ready.
