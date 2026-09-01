## 1. Local configuration foundation

- [x] 1.1 Define the versioned Obsidian agents profile schema and platform-aware `chc` data-root resolver, including the Windows `%APPDATA%\\CthuTool\\chc` default.
- [x] 1.2 Implement atomic local configuration loading, validation, saving, default-profile selection, and profile lookup without writing configuration into `.agents`.
- [x] 1.3 Implement interactive first-time setup with vault-path, agents-path, Git-remote, and initial-mutation preview/confirmation prompts.
- [x] 1.4 Implement interactive editing of an existing profile plus explicit non-interactive/JSON setup inputs and validation errors.

## 2. Git-backed agents synchronization

- [x] 2.1 Add a Git process boundary for `.agents` operations that uses argument arrays, captures redacted diagnostics, and distinguishes worktree, authentication, network, and non-fast-forward failures.
- [x] 2.2 Implement safe repository bootstrap for existing local files, empty/absent agents directories, configured remotes, and initial commit/push confirmation without force-push or destructive reset behavior.
- [x] 2.3 Implement per-profile synchronization locking with bounded waiting and stale-lock diagnostics in the local `chc` data root.
- [x] 2.4 Implement `before` synchronization with local recovery handling, fetch, fast-forward-only update, and conflict/divergence blocking.
- [x] 2.5 Implement `after` synchronization with `.agents`-scoped change detection, one commit for Skills/state changes, push, and recoverable local commits when push fails.

## 3. CLI commands and status model

- [x] 3.1 Register the `chc obsidian agents` command group and `setup`, `status`, and `sync --phase before|after` subcommands using the existing CLI command and observation patterns.
- [x] 3.2 Implement human-readable setup and status output plus the existing JSON envelope with stable configuration, path, Git, worktree, sync, and Hook-readiness fields.
- [x] 3.3 Implement read-only status checks and explicit `--refresh` remote metadata fetching without commit, push, pull, or worktree mutation.
- [x] 3.4 Add actionable exit/error mapping for unconfigured profiles, invalid paths, busy locks, authentication failures, divergent histories, and incomplete synchronization.
- [x] 3.5 Document the setup/status workflow and recovery guidance in the CLI documentation without changing unrelated command behavior.

## 4. CthuCodex Hook integration

- [x] 4.1 Add a portable Obsidian agents Hook adapter under the CthuCodex plugin that consumes Hook JSON, resolves the local profile, and delegates before/after phases to `chc`.
- [x] 4.2 Extend the repository-owned `hooks/hooks.json` with the pre-Skill prompt Hook and end-of-turn Hook while preserving the existing language-coach Hook and `<PLUGIN_ROOT>` portability.
- [x] 4.3 Implement explicit managed-Skill detection, missing-setup blocking guidance, clean-worktree no-op behavior, and structured Hook failure responses without hardcoded vault paths.
- [x] 4.4 Verify `chc codex install` materializes the new Hook in local plugin configuration/cache and does not overwrite unrelated Hook or MCP metadata.

## 5. Verification

- [x] 5.1 Add unit tests for platform path resolution, profile validation, atomic persistence, default-profile selection, and credential/path exclusion.
- [x] 5.2 Add Git integration tests using temporary repositories for bootstrap, clone, clean fast-forward, state-file commit, push failure recovery, divergence, conflicts, and lock contention.
- [x] 5.3 Add CLI integration tests for interactive setup boundaries, reconfiguration, non-interactive setup, status text/JSON, refresh behavior, and error contracts.
- [x] 5.4 Extend Hook and plugin-install contract tests for prompt/stop phases, malformed input, missing setup, `<PLUGIN_ROOT>` normalization, and preservation of the language-coach Hook.
- [x] 5.5 Run `openspec validate add-obsidian-agents-auto-sync --type change --strict --no-interactive` and the affected CLI/plugin typecheck, lint, and test commands; confirm unrelated OpenSpec changes and generated agent adapter files remain untouched. The targeted checks pass; the full Windows suite still has pre-existing path-separator and fake-`npm` baseline failures outside this change.
