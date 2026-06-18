## Why

Root engineering configuration currently has several quality-gate gaps: `pnpm run lint` is failing, CI does not run `typecheck`, Turbo does not declare build or coverage outputs, and package scripts are inconsistent across workspace members. These issues make local and CI verification less predictable and make it harder to know which project areas are governed by root tooling.

## What Changes

- Fix the root lint gate so `pnpm run lint` passes for the root-managed `apps/*` and `packages/*` workspace.
- Add `pnpm run typecheck` to the primary CI check job.
- Declare Turbo task outputs for build and coverage artifacts so caching and invalidation match actual package outputs.
- Standardize root workspace package scripts for `build`, `test`, `test:cov`, `typecheck`, and `lint` where practical.
- Document and guard that `scratches/collection-hub` is an isolated experimental nested workspace, not part of the root `@cthutool/*` workspace gates.
- Keep test responsibility cleanup, coverage strategy expansion, lint-system redesign, and OpenSpec global configuration changes out of this change.

## Capabilities

### New Capabilities

- `apps-root-engineering-config`: Root workspace engineering configuration for lint, typecheck, Turbo task outputs, package scripts, and CI gates.

### Modified Capabilities

- `collection-hub-workspace`: Clarify that `scratches/collection-hub` remains an isolated experimental nested workspace outside root workspace orchestration.

## Impact

- Root configuration files: `package.json`, `biome.jsonc`, `turbo.json`, `pnpm-workspace.yaml`, and `.github/workflows/ci.yml`.
- Workspace package manifests under `apps/*/package.json` and `packages/*/package.json`.
- Root contract tests may be added or updated to capture package script and experimental workspace boundaries.
- `scratches/collection-hub` source packages and lockfile are not migrated into the root workspace as part of this change.
