## Why

The current CI configuration validates important quality gates, but it does not consistently prove that every root-managed package can lint, typecheck, test, build, and produce required artifacts before merge. CI also leaves Turborepo's cross-package caching underused, so broader validation would become slower unless the workflow structure is improved at the same time.

## What Changes

- Restructure the primary CI workflow into focused jobs for lint, typecheck, tests, build, CLI distribution checks, and coverage.
- Route root-managed workspace validation through Turborepo task orchestration so package work can run in parallel according to the workspace dependency graph.
- Add persistent GitHub Actions caching for `.turbo/cache` while preserving pnpm store caching.
- Add build validation to primary CI so package, app, and framework build failures are caught before merge.
- Add a CLI distribution check to primary CI so publishable CLI entrypoints and generated output stay in sync.
- Strengthen CI contract tests so every root-managed workspace package exposes meaningful standard validation scripts.
- Update desktop artifact CI so package dependency changes trigger packaging validation and Turbo filtered tasks validate the desktop dependency graph.
- Update backend image CI so pull requests validate Docker builds without pushing images, while main branch pushes still publish images and update deployment manifests.
- Add concurrency protection for backend deployment manifest updates.
- Pin tool versions consistently across CI and Docker builds.

## Capabilities

### New Capabilities
- `apps-backend-image-ci`: Backend container image CI behavior, including PR build validation, main branch image publishing, and deployment manifest update safety.

### Modified Capabilities
- `apps-root-engineering-config`: Expand root CI requirements to cover build, CLI distribution checks, Turbo orchestration, Turbo cache persistence, and stronger workspace script contracts.
- `apps-desktop-packaging-ci`: Update desktop artifact CI requirements so dependency package changes trigger validation and desktop packaging uses the workspace task graph efficiently.

## Impact

- Affected workflows: `.github/workflows/ci.yml`, `.github/workflows/desktop-artifacts.yml`, `.github/workflows/backend-image.yml`.
- Affected scripts: root `package.json` scripts, desktop package scripts, and contract tests under `tests/contract`.
- Affected build configuration: `turbo.json` and `apps/backend/Dockerfile`.
- CI behavior changes: broader pre-merge validation, better parallelism, cache reuse across GitHub Actions runs, and safer backend deployment manifest updates.
