## Context

The CLI runtime bundle is committed at `apps/cli/dist/index.js` so installation and update flows can run without `pnpm` or `bun` on target machines. That creates a release-discipline requirement: source changes that affect the CLI bundle must refresh and commit the generated bundle in the same change.

The repository already has Husky and lint-staged in the root workflow, so commit-time automation is the right local safety net. The guard should only run when staged files can affect the CLI bundle, because rebuilding on every commit would slow unrelated work and make generated-file churn more likely.

## Goals / Non-Goals

**Goals:**

- Detect staged changes that can affect `apps/cli/dist/index.js`.
- Rebuild the CLI bundle during pre-commit when those inputs are staged.
- Stage the refreshed bundle before the commit is created.
- Run the existing bundle freshness check after rebuilding.
- Keep the hook behavior covered by root contract tests.

**Non-Goals:**

- Change installer or `chc update` target-machine prerequisites.
- Run the CLI build for unrelated commits.
- Replace `pnpm --filter @cthutool/cli dev` for local watch-mode development.
- Remove the manual `pnpm --filter @cthutool/cli build` and `pnpm run check:cli-dist` commands.

## Decisions

- Implement a dedicated root script for the pre-commit bundle refresh.
  - Rationale: a script can inspect staged paths, run the build only when needed, stage `apps/cli/dist/index.js`, and run the freshness check with clearer diagnostics than inline lint-staged commands.
  - Alternative considered: put the full shell logic directly in `package.json`. That would make the hook harder to read and harder to test.

- Trigger from staged Git paths rather than file-system mtimes.
  - Rationale: the hook should react to what is about to be committed, and staged path inspection avoids rebuilding for untracked or unrelated local edits.
  - Alternative considered: rebuild whenever CLI source files differ from HEAD. That could surprise developers by staging generated output for work they did not intend to commit.

- Treat CLI source, CLI package metadata, and bundle-affecting root lock/config files as inputs.
  - Rationale: TypeScript source is the common case, but dependency and build metadata can also change the generated bundle.
  - Alternative considered: watch only `apps/cli/src/**`. That is simpler but misses dependency or build-script changes.

- Stage only `apps/cli/dist/index.js` after a successful build.
  - Rationale: the hook should not stage arbitrary developer edits. The committed bundle is the only generated output this guard owns.
  - Alternative considered: run `git add apps/cli/dist`. That could accidentally stage future generated files if the dist directory grows.

## Risks / Trade-offs

- [Risk] Pre-commit becomes slower for CLI source commits. -> Mitigation: trigger only when staged paths can affect the bundle.
- [Risk] Hook failure can block commits when dependencies are not installed. -> Mitigation: emit a clear message telling developers to install dependencies or run the build/check commands manually.
- [Risk] lint-staged may still attempt to format ignored generated output. -> Mitigation: keep generated bundle refresh in a dedicated hook script and adjust lint-staged matching if needed so ignored dist files do not fail the commit path.
- [Risk] Developers can bypass hooks. -> Mitigation: keep `pnpm run check:cli-dist` as CI/manual verification.
