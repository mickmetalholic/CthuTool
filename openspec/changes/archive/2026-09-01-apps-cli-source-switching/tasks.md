## 1. Establish the source contract and models

- [x] 1.1 Add source kind, candidate, selector, registry, switch result, stable error, and JSON output types while preserving `mode: local | remote` compatibility.
- [x] 1.2 Define canonical path and Git identity rules for managed, main, and linked-worktree sources on macOS, Linux, and Windows.
- [x] 1.3 Add focused tests for main/worktree/managed classification, detached worktrees, duplicate branch names, path canonicalization, and additive status fields.

## 2. Implement source discovery and registry

- [x] 2.1 Add read-only Git process helpers for repository root/common-dir resolution and `git worktree list --porcelain` parsing, including locked, prunable, branch, detached, and commit metadata.
- [x] 2.2 Add a user-scoped, versioned preferred-development-repository registry with atomic writes, canonical path validation, stale-anchor reporting, and no persisted worktree snapshot.
- [x] 2.3 Build one discovery provider used by list, current, interactive selection, completion, and selector resolution; ensure list and completion do not write registry state.
- [x] 2.4 Test discovery from active main, active linked worktree, managed source with valid registry, managed source with stale registry, and explicit current-directory/path selection.

## 3. Implement safe source switching

- [x] 3.1 Add target validation for the CthuTool root package, expected Git identity, canonical source path, and committed `apps/cli/dist/index.js` bundle before any global mutation.
- [x] 3.2 Add the user-level bounded source-switch lock and test concurrent acquisition, timeout, release, and stale-lock safety without deleting unrelated locks.
- [x] 3.3 Add local/main/worktree relinking through `npm install -g --ignore-scripts <target>`, permit dirty development worktrees, and prove no Git-mutating or network command runs.
- [x] 3.4 Add already-active no-op detection and post-install verification that the global `cthutool` package resolves to the selected canonical source.
- [x] 3.5 Add managed-source selection that locally relinks an existing valid checkout, blocks a missing checkout by default, and reuses managed update safety only for explicit `--bootstrap`.
- [x] 3.6 Add failure tests for wrong repository, missing bundle, unavailable target, busy lock, npm failure, postcondition mismatch, missing managed source, and managed bootstrap safety.

## 4. Add CLI commands and output

- [x] 4.1 Implement the public `chc source` command group with `list`, `current`, `use`, and `register`, shared CLI contract flags, help behavior, and command diagnostics.
- [x] 4.2 Add the interactive `use` selector and ensure non-interactive, JSON, and `--no-interactive` invocations require an explicit selector without prompting.
- [x] 4.3 Add human, quiet, and single-value JSON renderers for candidates, active status, switch success, unavailable sources, stable failures, and worktree deletion warnings.
- [x] 4.4 Register source operations in root command discovery and add invariant/integration tests proving help, dispatch, bare behavior, compatibility commands, and JSON lifecycle behavior remain consistent.

## 5. Integrate status, completion, and documentation

- [x] 5.1 Extend `chc status` with additive `sourceKind` and worktree metadata while preserving existing mode, install-dir, repo, ref, commit, and bundle fields.
- [x] 5.2 Extend dynamic completion with source operations and selectors through the shared discovery provider; ensure completion failures remain quiet and non-interactive in zsh and PowerShell adapters.
- [x] 5.3 Update the root README, CLI README, and docs-site CLI/reference pages with source listing/switching, explicit managed bootstrap, bundle refresh, active-worktree deletion warning, and Bash/PowerShell recovery commands.
- [x] 5.4 Update installer/update guidance to distinguish install, update, and source-switch semantics without changing default managed or local installer behavior.

## 6. Verify and package the change

- [x] 6.1 Run `openspec validate apps-cli-source-switching --type change` and resolve all proposal/design/spec/task validation errors without touching neighboring changes.
- [x] 6.2 Run targeted Biome lint, CLI TypeScript type checking, source manager/command/completion/status unit tests, and relevant global-bin/installer integration and contract tests.
- [x] 6.3 Refresh and verify the committed `apps/cli/dist/index.js` bundle using the repository CLI bundle workflow; confirm installers still require only Git, Node 24, and npm.
- [x] 6.4 Run `git diff --check`, review the final scoped diff, confirm generated OpenSpec adapter trees remain unchanged, and confirm `codex/plugins/cthu-codex` is unchanged.

## Implementation handoff

- Implemented source discovery, registration, switching, stable errors, status metadata, completion, docs, and the refreshed committed CLI bundle.
- Targeted source tests, command/completion/status tests, installer contract tests, Biome, CLI type checking, bundle verification, and OpenSpec validation pass.
- The full CLI unit and integration runs each retain one unrelated pre-existing macOS path-canonicalization failure in the Obsidian agents tests (`/var/...` expected versus `/private/var/...` actual).
- Generated OpenSpec adapter trees and `codex/plugins/cthu-codex` remain unchanged.
