## 1. Baseline and Policy

- [x] 1.1 Run current package coverage commands for `@cthutool/backend`, `@cthutool/config`, and `@cthutool/agent-protocol` to record baseline coverage values.
- [x] 1.2 Choose conservative initial thresholds for the threshold-gated packages based on the recorded baselines.
- [x] 1.3 Add or update root engineering coverage policy documentation with threshold-gated packages, visibility-only packages, and graduation criteria.
- [x] 1.4 Document that `@cthutool/cli` remains Bun coverage and is not threshold-gated in this change.

## 2. Coverage Gate Configuration

- [x] 2.1 Add package-local coverage thresholds for `@cthutool/backend`.
- [x] 2.2 Add package-local coverage thresholds for `@cthutool/config`.
- [x] 2.3 Add package-local coverage thresholds for `@cthutool/agent-protocol`.
- [x] 2.4 Confirm visibility-only packages still produce coverage artifacts without percentage thresholds.

## 3. Governance Contracts

- [x] 3.1 Add root engineering contract coverage for the threshold-gated package list.
- [x] 3.2 Add contract coverage that threshold values are visible in package runner configuration or referenced policy data.
- [x] 3.3 Add contract coverage that visibility-only packages are not forced to pass coverage percentage thresholds.
- [x] 3.4 Add contract coverage that future gated package additions require policy or contract updates.

## 4. CI and Developer Feedback

- [x] 4.1 Verify root coverage execution fails package-locally when a gated package drops below threshold.
- [x] 4.2 Ensure coverage failure output identifies the package and metric that failed.
- [x] 4.3 Keep PR coverage comments and Codecov uploads using existing package-local coverage artifacts.
- [x] 4.4 Confirm coverage thresholds are not implemented as hidden CI-only shell checks.

## 5. Verification

- [x] 5.1 Run `pnpm run lint` from the repository root.
- [x] 5.2 Run `pnpm run typecheck` from the repository root.
- [x] 5.3 Run `SKIP_ROOT_WORKSPACE_CHECK=true pnpm run test` from the repository root.
- [x] 5.4 Run `SKIP_ROOT_WORKSPACE_CHECK=true pnpm run test:cov` from the repository root.
- [x] 5.5 Run `openspec status --change apps-root-coverage-quality-gates` and confirm the change is apply-ready.
