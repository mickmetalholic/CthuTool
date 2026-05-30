## Context

The CLI currently registers `codex-plugins` as a top-level citty command alongside `scripts`. That command discovers plugin packages under `packages/codex-plugins/plugins`, compares them with the personal marketplace file, installs selected marketplace entries, and optionally refreshes the personal Codex plugin cache.

Codex configuration is broader than plugins, but the local Codex home also contains runtime state that must not become repository-managed source. The repository should hold only reproducible, reviewable configuration such as prompts, rules, and explicit plugin or manual skill intent. Local auth, databases, logs, sessions, caches, memories, and volatile config state must remain outside this workflow.

## Goals / Non-Goals

**Goals:**

- Add a `codex` command group with `status`, `diff`, `export`, `apply`, `doctor`, and `plugins` subcommands.
- Preserve existing plugin install, cache refresh, and patch bump behavior under `codex plugins`.
- Manage only repository-friendly Codex assets: `.codex/prompts`, `.codex/rules`, `.codex/skills.manifest.json`, `.codex/plugins.manifest.json`, and `.codex/README.md`.
- Keep comparison and planning logic separate from command prompting and output formatting.
- Refuse writes outside the resolved repository `.codex` tree or local Codex home targets.

**Non-Goals:**

- Do not mirror the whole local `.codex` home.
- Do not manage auth, capability session files, sqlite databases, caches, logs, temporary files, sessions, archived sessions, or memories.
- Do not merge or patch `config.toml` in version 1.
- Do not add a GUI, watcher, daemon, or FreeFileSync replacement.
- Do not copy bundled/system skills or runtime-provided skills into the repository.

## Decisions

1. Introduce `apps/cli/src/command/codex.command.ts` as the public command group.
   - Rationale: citty already models top-level subcommands, and a grouped command keeps future Codex maintenance under one CLI surface.
   - Alternative considered: keep adding top-level commands. This would preserve the current shape but scatter related maintenance commands.

2. Reuse the current plugin command behavior as the `plugins` subcommand.
   - Rationale: `codex-plugin-manager` already owns plugin discovery, marketplace writes, and cache sync. Moving the command boundary should not rewrite that domain logic.
   - Alternative considered: duplicate plugin handling inside a new manager. That would increase drift risk and make compatibility harder to test.

3. Add `codex-config-manager` for comparison, export, apply, manifest generation, and doctor checks.
   - Rationale: these operations share file tree traversal, safe path checks, and manifest rules. Keeping them in one domain module makes unit tests direct and keeps command modules thin.
   - Alternative considered: implement each subcommand independently. That would be simple initially but would duplicate safety boundaries.

4. Add `codex-config-paths` for all repository, home, local Codex, marketplace, and plugin source path resolution.
   - Rationale: write boundaries are the core safety requirement. Centralized absolute path resolution lets domain functions assert that each write target is inside the intended root.
   - Alternative considered: resolve paths inline in each command. That would make tests and audits harder.

5. Mirror only `prompts/` and `rules/` directories for export/apply in version 1.
   - Rationale: these are plain configuration files and are low-risk to diff and restore. Skills and plugins need manifests because their source and runtime locations differ.
   - Alternative considered: mirror all `.codex` children with denylist filtering. That is more dangerous because new Codex runtime files could be copied accidentally.

6. Treat `status` and `diff` as read-only comparisons with similar version 1 output.
   - Rationale: the first implementation needs a reliable decision point before writes. Detailed line diffs can be added later without changing the command contract.
   - Alternative considered: implement full file diffs immediately. That adds effort without being required for safe export/apply decisions.

7. Keep `config.toml` read-only and report it as unmanaged when present.
   - Rationale: it can mix stable preferences with trusted project paths, hook hashes, marketplace timestamps, and app state.
   - Alternative considered: patch selected keys. This should wait until prompts, rules, manifests, and plugins are stable.

8. Remove the top-level `codex-plugins` command instead of keeping a compatibility alias.
   - Rationale: this CLI is still local enough that keeping the command surface clean is worth more than carrying a short-lived alias.
   - Alternative considered: keep a deprecated compatibility alias for one release. This reduces disruption but leaves two ways to do the same maintenance task.

## Risks / Trade-offs

- [Risk] `export` could accidentally copy unsafe files if the managed set expands implicitly. -> Mitigation: implement export as an allowlist for `prompts`, `rules`, and manifest files only.
- [Risk] `apply` could overwrite local user changes unexpectedly. -> Mitigation: provide `status` and `diff`, keep write scope narrow, and test mirror semantics with fixtures.
- [Risk] Plugin cache refresh currently writes runtime cache state. -> Mitigation: keep cache refresh behind explicit `--sync-cache` or `--bump-patch` options on `codex plugins`.
- [Risk] Manual skill installation sources need more design. -> Mitigation: version 1 may report manifest entries that cannot be installed safely yet, while still generating the manifest.
- [Risk] Path handling differs across Windows and POSIX. -> Mitigation: use `node:path` resolution helpers and unit-test outside-root write refusals.

## Migration Plan

1. Register the new `codex` command group in `apps/cli/src/index.ts`.
2. Move or wrap the existing `codex-plugins` command as `codex plugins`.
3. Add `codex-config-paths` and `codex-config-manager` with unit tests before wiring commands.
4. Add command modules for `status`, `diff`, `export`, `apply`, and `doctor`.
5. Update CLI and plugin package documentation from `codex-plugins` examples to `codex plugins`.
6. Remove the old top-level `codex-plugins` command registration after `codex plugins` is covered by tests.
7. Roll back by temporarily restoring the old `codex-plugins` command registration if the grouped command causes issues.

## Open Questions

- Should manual skill manifest entries support only repository-local paths in version 1, or should GitHub sources be modeled immediately?
- Should `codex diff` include unified file diffs in version 1 or only a diff-oriented summary?
- Should memories eventually get a separate backup command outside config management?
