## Context

The CLI currently discovers repository-maintained Codex plugins from `packages/codex-plugins/plugins`. The only current plugin is `english-coach`, which is packaged as part of a pnpm workspace package and uses a PowerShell hook command with a Windows-specific absolute path.

The repository is moving Codex-maintained assets under root-level `codex/`. For plugins, that means the repository source of truth should be `codex/plugins`, with each plugin as a plain directory rather than a workspace package. The existing plugin should also become cross-platform because repo-managed restore and install workflows should work on Windows, macOS, and Linux.

## Goals / Non-Goals

**Goals:**

- Move the current repository-owned plugin to `codex/plugins/language-coach`.
- Rename the plugin identity from `english-coach` to `language-coach`.
- Remove `packages/codex-plugins` as a workspace package.
- Make `codex/plugins` the default discovery root for `chc codex plugins`.
- Replace the PowerShell hook with a Node `.mjs` hook.
- Normalize portable hook commands when installing or syncing plugin runtime files.
- Treat `english-coach` as an unknown selection after migration.

**Non-Goals:**

- Do not keep a compatibility alias for `english-coach`.
- Do not clean up previously installed local marketplace entries or caches.
- Do not publish this plugin through an external marketplace.
- Do not remove the generic `--plugins-root` option for custom plugin roots.
- Do not remove `packages/*` from `pnpm-workspace.yaml` only because this package is removed.

## Decisions

### Use `codex/plugins/language-coach` as the only source

The migrated plugin will live at `codex/plugins/language-coach`, and its manifest name will be `language-coach`. The old `packages/codex-plugins/plugins/english-coach` source will be deleted.

Alternative considered: keep `english-coach` as an alias or keep both locations for one release. This was rejected because the migration is local to a small plugin and the user explicitly wants a hard rename without compatibility.

### Make plugins plain directories

The plugin directory will not include a plugin-level `package.json`, and `packages/codex-plugins/package.json` will be removed. Version bump behavior should use `.codex-plugin/plugin.json` as the source of truth.

Alternative considered: keep a plugin package for scripts and validation. This was rejected because plugin ownership should be represented by `codex/plugins`, not by package management.

### Use Node for the hook entry point

The PowerShell hook will be ported to `scripts/language-coach.mjs`. The Node hook will read stdin, parse hook JSON, detect English prose, and output either `{}` or a compact JSON object with `systemMessage`.

Alternative considered: keep the PowerShell script and add shell-specific variants. This was rejected because maintaining multiple hook implementations would add drift, while Node is already part of the repository toolchain.

### Normalize hook commands at runtime

Source `hooks/hooks.json` should remain portable by using a placeholder such as `<PLUGIN_ROOT>`. During install or cache sync, the CLI should replace the placeholder with the resolved plugin root before writing runtime hook files or cache content.

Alternative considered: commit relative hook commands directly. This was rejected because Codex executes hooks from runtime locations where relative path resolution may not match the source plugin root.

## Risks / Trade-offs

- Existing local `english-coach` marketplace entries remain installed until manually removed -> The new plugin installs as `language-coach`, and this change does not promise local cleanup.
- Hook command normalization touches plugin cache sync behavior -> Add tests that assert cache hook commands contain the resolved plugin root and do not contain `pwsh.exe`, `packages/codex-plugins`, or machine-specific source placeholders.
- Node may not be available in every Codex runtime environment -> This repository already requires Node for CLI development, and the hook is repo-managed rather than externally distributed.
- Removing the package importer changes lockfile state -> Refresh lockfile after deleting `packages/codex-plugins/package.json`.

## Migration Plan

1. Create `codex/plugins/language-coach` from the current plugin content.
2. Rename manifest identity, display text, descriptions, scripts, and tests to `language-coach`.
3. Port `scripts/english-coach.ps1` to `scripts/language-coach.mjs`.
4. Change source `hooks/hooks.json` to use a portable Node command with `<PLUGIN_ROOT>`.
5. Add hook command normalization before marketplace install or plugin cache sync writes runtime files.
6. Change the default plugin root to `repoRoot/codex/plugins`.
7. Delete `packages/codex-plugins` and refresh lockfile state.
8. Update CLI docs, help text, OpenSpec examples, and tests.

Rollback is possible by restoring `packages/codex-plugins`, reverting the default plugin root, and reinstalling the old `english-coach` marketplace entry. Local runtime cache cleanup is outside this change.

## Open Questions

- Should `Language Coach` expand beyond English checking in a future change, or should the display name stay broader while the first implementation remains English-focused?
- Should a future command validate plugin hook portability without installing the plugin?
