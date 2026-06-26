## 1. Workflow Layout

- [x] 1.1 Move `.github/workflows/backend-image.yml` to `.github/workflows/backend.yml` without leaving the old workflow file behind.
- [x] 1.2 Move `.github/workflows/desktop-artifacts.yml` to `.github/workflows/desktop.yml` without leaving the old workflow file behind.
- [x] 1.3 Create `.github/workflows/cli.yml` for the `cli-dist` job and remove `cli-dist` from `.github/workflows/ci.yml`.
- [x] 1.4 Keep workflow display names explicit: `CI`, `CLI Distribution`, `Backend Image`, and `Desktop Artifacts`.

## 2. Required-Safe Scoped Checks

- [x] 2.1 Ensure `scripts/ci/affected-workflow.mjs` supports `cli-dist`, `backend-image`, and `desktop-artifacts` targets with recursive workspace dependency detection.
- [x] 2.2 Ensure scoped jobs always appear on pull requests and complete successfully without heavy work when affected inputs are unchanged.
- [x] 2.3 Include `tsconfig.json` in CLI distribution affected-input detection.
- [x] 2.4 Preserve stable required-facing job names for `cli-dist`, `validate`, and `Package desktop (...)`.

## 3. Concurrency

- [x] 3.1 Add pull-request-safe concurrency to `ci.yml`.
- [x] 3.2 Add pull-request-safe concurrency to `cli.yml`.
- [x] 3.3 Add pull-request-safe concurrency to `backend.yml` without breaking the existing serialized main-branch backend publish job.
- [x] 3.4 Add pull-request-safe concurrency to `desktop.yml`.

## 4. Tests and Verification

- [x] 4.1 Update workflow contract tests for the renamed workflow files, dedicated CLI workflow, stable skip behavior, and absence of duplicate old workflow files.
- [x] 4.2 Update affected-workflow contract tests for CLI `tsconfig.json`, backend recursive dependencies, desktop recursive dependencies, and unrelated-file skips.
- [x] 4.3 Run `corepack pnpm exec vitest run tests/contract/ci-workflow.test.ts tests/contract/ci-affected-workflow.test.ts`.
- [x] 4.4 Run `openspec validate --change refine-ci-required-workflows`.
- [x] 4.5 Run `git diff --check`.
- [x] 4.6 Confirm generated agent adapter files under `.claude/`, `.codex/`, and `.cursor/` were not hand-edited by this change.
