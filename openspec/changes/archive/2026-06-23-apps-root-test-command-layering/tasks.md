## 1. Governance Contracts

- [x] 1.1 Add root package script contract coverage for approved test layer script names.
- [x] 1.2 Add contract coverage that test layer scripts do not use placeholder or no-op commands.
- [x] 1.3 Add contract coverage that CLI layer scripts use Bun test.
- [x] 1.4 Add contract coverage that non-CLI layer scripts use Vitest.
- [x] 1.5 Add contract coverage that packages with layer scripts keep `test` as the full package default.

## 2. CLI Test Layers

- [x] 2.1 Add `@cthutool/cli` `test:unit` script targeting existing CLI unit tests.
- [x] 2.2 Add `@cthutool/cli` `test:integration` script targeting existing CLI integration tests.
- [x] 2.3 Update `@cthutool/cli` `test` script to run both CLI layers without reducing the current test surface.
- [x] 2.4 Verify CLI layer commands preserve Bun preload, timeout, and runtime behavior.

## 3. Backend Test Layers

- [x] 3.1 Add `@cthutool/backend` `test:unit` script targeting source-level backend specs.
- [x] 3.2 Add `@cthutool/backend` `test:e2e` script targeting backend e2e specs.
- [x] 3.3 Update `@cthutool/backend` `test` script to run both backend layers without reducing the current test surface.
- [x] 3.4 Verify backend layer commands preserve dependency builds and NestJS Vitest configuration.

## 4. Documentation and Scope Control

- [x] 4.1 Document root-managed test layer semantics in the appropriate engineering configuration documentation or script contract comments.
- [x] 4.2 Confirm smaller packages are not forced to add empty layer scripts.
- [x] 4.3 Confirm generated agent adapter files under `.claude/`, `.codex/`, and `.cursor/` are not hand-edited.
- [x] 4.4 Confirm `scratches/collection-hub` remains outside this change.

## 5. Verification

- [x] 5.1 Run `pnpm --filter @cthutool/cli test:unit` from the repository root.
- [x] 5.2 Run `pnpm --filter @cthutool/cli test:integration` from the repository root.
- [x] 5.3 Run `pnpm --filter @cthutool/backend test:unit` from the repository root.
- [x] 5.4 Run `pnpm --filter @cthutool/backend test:e2e` from the repository root.
- [x] 5.5 Run `pnpm run typecheck` from the repository root.
- [x] 5.6 Run `SKIP_ROOT_WORKSPACE_CHECK=true pnpm run test` from the repository root.
- [x] 5.7 Run `openspec status --change apps-root-test-command-layering` and confirm the change is apply-ready.
