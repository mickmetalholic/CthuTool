## Why

Root workspace tests currently mix real test suites, type-only checks, and placeholder commands that print "No tests configured" while still passing CI. This makes the green check less meaningful and keeps coverage reporting focused on only part of the repository.

## What Changes

- Require every root-managed package under `apps/*` and `packages/*` to have meaningful test coverage instead of placeholder `test` or `test:cov` scripts.
- Standardize the non-CLI root workspace test runner on Vitest while keeping `@cthutool/cli` on Bun test to preserve its runtime fidelity.
- Move type-only contract checks out of `test` and into `typecheck`, so `test` means executable behavioral or smoke tests.
- Extend root engineering contract checks to reject noop test scripts and to verify the intended test runner split.
- Expand repository coverage generation and CI reporting so all root-managed packages with runtime tests have visible coverage artifacts or an explicit documented non-coverage rationale.
- Keep `scratches/collection-hub` outside this change; it remains a nested experimental workspace with separate dependency and test orchestration.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-root-engineering-config`: tighten root workspace testing, typecheck, test runner, and coverage requirements.

## Impact

- Root orchestration: `package.json`, `turbo.json`, root Vitest configuration, and root contract tests.
- Package scripts and test setup for `apps/backend`, `apps/desktop`, `apps/docs`, `apps/web`, `packages/agent-protocol`, `packages/app-shell`, `packages/config`, `packages/obsidian-enhancer`, and `packages/ui`.
- CLI package scripts remain Bun-based, but contract checks must explicitly allow that exception.
- CI coverage workflow and PR coverage comment logic.
- Test dependencies may remove Jest/ts-jest after backend NestJS tests are safely migrated to Vitest, and may add Vitest coverage support where missing.
