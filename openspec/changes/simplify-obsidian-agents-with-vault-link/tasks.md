## 1. Remove the superseded synchronization boundary

- [x] 1.1 Remove the Obsidian agents `sync` subcommand, Git remote/branch options, refresh behavior, and Git-specific status fields from the CLI command surface.
- [x] 1.2 Remove the Obsidian agents Git and lock modules and replace their call sites without changing unrelated CLI error handling.
- [x] 1.3 Remove the unmerged CthuCodex Obsidian sync adapter and only its Hook registrations, verifying that the language-coach and all unrelated Hooks remain intact.
- [x] 1.4 Remove or rewrite Git- and Hook-specific tests so no test continues to require fetch, commit, push, sync phases, or a private remote.

## 2. Implement the vault topology model

- [x] 2.1 Revise the local Obsidian agents profile schema to persist `vaultPath` and visible `sourcePath`, derive `<vault>/.agents`, migrate legacy profile data safely, and keep atomic writes.
- [x] 2.2 Implement canonical path validation that requires a visible source inside the configured vault and rejects hidden, external, recursive, or compatibility-path targets.
- [x] 2.3 Implement read-only filesystem classification for absent paths, real directories, correct links, incorrect links, broken links, and unsupported filesystem objects.
- [x] 2.4 Implement the platform link adapter with Windows directory junction creation, Unix directory symlink creation, canonical target verification, and no copy fallback.
- [x] 2.5 Implement preflighted topology transitions for new setup, existing-source linking, real `.agents` adoption, correct-link reuse, and explicitly confirmed incorrect-link repair.
- [x] 2.6 Stop safely when both real directories contain data or any transition is ambiguous, preserving and reporting all surviving paths after failures.

## 3. Rework setup and status commands

- [x] 3.1 Update interactive setup to default the source to `<vault>/Agent`, display the vault-local topology and scope, preview exact filesystem mutations, and require confirmation.
- [x] 3.2 Update non-interactive and JSON setup behavior to require explicit missing decisions and return stable topology or validation results without prompting.
- [x] 3.3 Replace Git-oriented status with local-only human and JSON output for configuration, vault, source, compatibility link, resolved target, `skills/`, `state/`, legacy metadata, and overall health.
- [x] 3.4 Ensure status never creates or repairs paths, invokes Obsidian, performs Git operations, or makes network requests.
- [x] 3.5 Update CLI help, command discovery, shell completion expectations, and README examples to expose only `setup` and `status` and to describe eventual consistency accurately.

## 4. Verify migration and cross-platform behavior

- [x] 4.1 Add unit tests for profile migration, path containment, hidden-source rejection, topology classification, and canonical link-target comparison.
- [x] 4.2 Add integration tests for fresh setup, idempotent setup, existing `Agent` linking, real `.agents` adoption including hidden metadata, wrong-link repair, broken-link reporting, and ambiguous dual-directory refusal.
- [x] 4.3 Add platform-focused tests or adapters covering Windows junction behavior and Unix directory symlink behavior without requiring privileged global filesystem changes.
- [x] 4.4 Verify human and JSON status output for healthy, missing, broken, mismatched, and legacy-Git topologies, including proof that status is non-mutating.
- [x] 4.5 Run affected CLI unit and integration suites, type checking, linting, and the repository build that regenerates the committed CLI distribution artifact.

## 5. Validate change boundaries

- [x] 5.1 Run strict OpenSpec validation for `simplify-obsidian-agents-with-vault-link` and confirm all tasks and scenarios remain represented.
- [x] 5.2 Confirm the predecessor OpenSpec change remains untouched as historical context and no neighboring OpenSpec change is archived, synced, or committed.
- [x] 5.3 Confirm generated `.claude/`, `.codex/`, and `.cursor/` adapter instructions remain unchanged and review the final diff for removal of all Obsidian Git/Hook behavior only.
