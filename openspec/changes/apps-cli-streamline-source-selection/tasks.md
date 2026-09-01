## 1. Refine managed source state and switching

- [x] 1.1 Add an explicit internal distinction between ready, absent, and existing-invalid managed sources, and verify focused source-manager unit tests classify missing paths, invalid checkouts, missing bundles, and valid managed checkouts without matching human reason strings.
- [x] 1.2 Remove the `bootstrap` switch option and make direct or interactive `remote` selection provision only an absent managed path through the existing safe managed install flow; verify unit tests cover successful provisioning, locking, postcondition verification, and the existing-checkout relink-only path.
- [x] 1.3 Preserve fail-closed behavior for an existing invalid managed path and failed automatic installation, and verify tests prove there is no overwrite, Git mutation, npm relink claim, or active-source change on failure.

## 2. Unify human source presentation

- [x] 2.1 Add a shared source-candidate presentation model for selector, kind/ref, active/ready/not-installed/unavailable state, home-relative display path, and bounded action hint; verify unit tests cover home-prefix boundaries, detached worktrees, missing remote, invalid candidates, and canonical JSON paths remaining unchanged.
- [x] 2.2 Render `chc source list` with the compact two-line hierarchy and a single actionable missing-remote message, and verify integration tests assert semantic labels, active markers, path abbreviation, quiet behavior, and no duplicate internal failure wording.
- [x] 2.3 Use the same presentation terminology in interactive `chc source use`, include a missing managed candidate as selectable, and verify injected-interaction tests distinguish ready worktrees, installable remote, and non-actionable invalid candidates.

## 3. Simplify commands and preserve contracts

- [x] 3.1 Remove the `source current` command registration/handler and the public `--bootstrap` argument, and verify source help, bare-group, dispatch, and zsh/PowerShell completion integration tests expose only `list`, `use`, and `register` and reject both retired forms before mutation.
- [x] 3.2 Keep `source list --json` candidate and top-level `active` fields canonical and keep structured switch/error results stable for automatic managed provisioning; verify source integration tests parse one JSON value and cover success, missing selector, invalid existing managed path, and provisioning failure.
- [x] 3.3 Update source-manager and command tests that referenced explicit bootstrap or current output, and verify the focused unit and integration suites pass without performing a real global npm installation.

## 4. Update documentation and packaged CLI

- [x] 4.1 Update the root README, CLI README, and docs-site CLI/reference pages to remove `current`/`--bootstrap`, explain automatic first-use remote installation, preserve update separation, and document invalid-path and worktree recovery; verify repository search finds no canonical guidance for the retired forms.
- [x] 4.2 Refresh the committed `apps/cli/dist/index.js` with the repository CLI bundle workflow and verify `pnpm check:cli-dist` passes and the generated bundle contains the new source command surface.

## 5. Verify the scoped change

- [x] 5.1 Run targeted Biome checks for affected CLI source files and `pnpm --filter @cthutool/cli typecheck`, and resolve all diagnostics without starting or restarting unrelated local services.
- [x] 5.2 Run the focused source manager, source command, completion, and global-bin test files, and verify managed provisioning is exercised only through fakes or isolated fixtures.
- [x] 5.3 Run `openspec validate apps-cli-streamline-source-selection --type change --strict` and `openspec validate apps-cli-source-switching --type spec --strict`, and verify both the delta and affected main capability remain valid.
- [x] 5.4 Run `git diff --check`, review the scoped diff, and verify generated OpenSpec adapter trees and `codex/plugins/cthu-codex` remain unchanged.
