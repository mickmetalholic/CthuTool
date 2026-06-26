## Why

The CI checks are now broad enough to protect the monorepo, but the workflow layout and scoped-check behavior still need to be made easier to require, maintain, and reason about. Required checks should have stable names and green no-op behavior, while workflow files should map cleanly to product areas.

## What Changes

- Split the CLI distribution check out of the primary CI workflow into a dedicated CLI workflow file.
- Rename scoped workflow files to short area names:
  - `.github/workflows/cli.yml`
  - `.github/workflows/backend.yml`
  - `.github/workflows/desktop.yml`
- Keep workflow display names explicit, such as `CLI Distribution`, `Backend Image`, and `Desktop Artifacts`.
- Keep scoped checks required-safe by triggering workflows consistently and skipping heavy work inside jobs when affected inputs are unchanged.
- Add PR-run concurrency so superseded CI, CLI, backend, and desktop runs are cancelled for the same branch or pull request.
- Include `tsconfig.json` in CLI distribution affected-input detection.
- Preserve the current decision to keep coverage/test duplication for now.
- Update contract tests and affected-workflow coverage so workflow naming, skip semantics, and dependency-driven affected detection stay guarded.

## Capabilities

### New Capabilities
- `apps-cli-distribution-ci`: Dedicated CI behavior for validating the committed CLI distribution bundle with required-safe affected-input skipping.

### Modified Capabilities
- `apps-root-engineering-config`: Primary CI no longer owns the CLI distribution job and gains required-safe workflow structure expectations for scoped checks.
- `apps-backend-image-ci`: Backend image CI uses the renamed backend workflow file, stable required-safe skip behavior, and PR-run concurrency.
- `apps-desktop-packaging-ci`: Desktop artifact CI uses the renamed desktop workflow file, stable required-safe skip behavior, and PR-run concurrency.

## Impact

- Affected GitHub Actions workflows under `.github/workflows/`.
- Affected CI helper scripts under `scripts/ci/`.
- Affected contract tests under `tests/contract/`.
- Required status check configuration should continue to reference stable job names rather than workflow file names.
- No runtime application APIs or user-facing behavior change.
