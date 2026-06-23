## 1. Generated-Output Policy Contracts

- [x] 1.1 Add root engineering contract coverage for the generated-output directory set used by validation tools.
- [x] 1.2 Add contract coverage that root-managed TypeScript or framework config with broad include patterns excludes generated outputs.
- [x] 1.3 Add contract coverage that coverage artifacts remain configured as Turbo/CI/Codecov outputs rather than being removed.
- [x] 1.4 Confirm generated-output contracts preserve the root workspace boundary excluding `scratches/collection-hub`.

## 2. Validation Config Exclusions

- [x] 2.1 Normalize TypeScript exclusions for root-managed apps and packages whose include patterns can capture generated output directories.
- [x] 2.2 Update docs/Astro validation configuration so generated coverage assets do not appear in `astro check` diagnostics.
- [x] 2.3 Verify Vitest test discovery and coverage include/exclude patterns only target intended tests and source files.
- [x] 2.4 Verify Biome root includes continue to exclude generated output directories while linting root-managed source files.
- [x] 2.5 Confirm `.claude/`, `.codex/`, and `.cursor/` generated adapter files are not hand-edited by this change.

## 3. Verification

- [x] 3.1 Run a representative coverage command that creates package coverage output, including the docs package case that previously exposed generated diagnostics.
- [x] 3.2 Run `pnpm run typecheck` from the repository root and confirm generated coverage assets are not diagnosed.
- [x] 3.3 Run `pnpm run lint` from the repository root.
- [x] 3.4 Run `SKIP_ROOT_WORKSPACE_CHECK=true pnpm run test` from the repository root.
- [x] 3.5 Run `openspec status --change apps-root-generated-output-exclusions` and confirm the change is apply-ready.
