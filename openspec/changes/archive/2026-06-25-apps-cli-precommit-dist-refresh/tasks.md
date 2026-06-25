## 1. Pre-Commit Script

- [x] 1.1 Add a root script that inspects staged Git paths and exits without work when no CLI bundle-affecting files are staged.
- [x] 1.2 Define the staged path matcher for `apps/cli/src/**`, CLI package metadata, root package manager metadata, and CLI build configuration files that can affect `apps/cli/dist/index.js`.
- [x] 1.3 When matching paths are staged, run `pnpm --filter @cthutool/cli build`.
- [x] 1.4 Stage only `apps/cli/dist/index.js` after a successful CLI build.
- [x] 1.5 Run `pnpm run check:cli-dist` after staging and fail with clear diagnostics if build, staging, or freshness verification fails.

## 2. Hook Wiring

- [x] 2.1 Wire the pre-commit script into the existing Husky pre-commit flow before lint-staged completes the commit.
- [x] 2.2 Adjust lint-staged configuration if needed so generated `apps/cli/dist/index.js` does not fail formatter checks as an ignored generated file.
- [x] 2.3 Keep unrelated staged changes outside the pre-commit script's staging scope.

## 3. Documentation

- [x] 3.1 Update root documentation to explain that CLI source commits automatically refresh and stage the dist bundle during pre-commit.
- [x] 3.2 Keep manual `pnpm --filter @cthutool/cli build` and `pnpm run check:cli-dist` instructions documented for explicit verification and CI/debug workflows.

## 4. Tests and Verification

- [x] 4.1 Add root contract coverage for the staged path matcher and no-op behavior on unrelated staged paths.
- [x] 4.2 Add root contract coverage that matching staged CLI inputs trigger build, dist staging, and freshness verification commands.
- [x] 4.3 Add root contract coverage proving only `apps/cli/dist/index.js` is auto-staged by the safeguard.
- [x] 4.4 Run the focused root contract tests, `pnpm run check:cli-dist`, `pnpm run lint`, and OpenSpec validation for `apps-cli-precommit-dist-refresh`.
