# Codex Plugins Migration Design

## Context

The repository currently keeps a personal Codex plugin package under `packages/codex-plugins`. That package owns one plugin, `english-coach`, with a PowerShell hook script and a hook command that points to a Windows-specific absolute path.

The newer Codex config design establishes root-level `codex/` as the repository-owned location for shared Codex assets. Plugins maintained by this repository should therefore live under `codex/plugins`, not under a separate pnpm workspace package. This migration also renames the plugin from `english-coach` to `language-coach` and makes the hook entry point cross-platform.

## Goals

- Move the existing repository-owned Codex plugin into `codex/plugins/language-coach`.
- Rename the plugin identity from `english-coach` to `language-coach`.
- Remove `packages/codex-plugins` as a pnpm workspace package.
- Make `codex/plugins` the default plugin discovery root for `chc codex plugins`.
- Replace the PowerShell-only hook with a Node-based hook script that can run on Windows, macOS, and Linux.
- Avoid committing machine-specific absolute paths in plugin hook configuration.
- Keep the migration hard and explicit: no `english-coach` alias or compatibility shim.

## Non-Goals

- Do not keep `packages/codex-plugins` as a supported plugin source.
- Do not preserve `english-coach` as a selectable plugin name.
- Do not clean up already-installed local Codex marketplace entries or runtime caches for `english-coach`.
- Do not migrate unrelated packages or change pnpm workspace structure beyond removing the obsolete package.
- Do not implement official marketplace distribution for this plugin.

## Repository Layout

The migrated plugin layout should be:

```text
codex/
  plugins/
    language-coach/
      .codex-plugin/
        plugin.json
      hooks/
        hooks.json
      scripts/
        language-coach.mjs
```

The plugin directory is a normal repository directory. It should not contain its own `package.json`, should not be listed as a pnpm workspace package, and should not be treated as an npm package.

## Plugin Identity

The plugin manifest should use `language-coach` as its `name`. The display name can be `Language Coach`, and the description should describe the broader language coaching behavior while preserving the current English-check behavior as the first implementation.

Old command examples such as:

```powershell
chc codex plugins --plugin english-coach
```

should become:

```powershell
chc codex plugins --plugin language-coach
```

The old name should fail as an unknown selection because the repository no longer owns a plugin with that identity.

## CLI Behavior

`chc codex plugins` should discover plugins from `codex/plugins` by default. Explicit `--plugins-root` can remain available for custom roots, but the built-in default should no longer point at `packages/codex-plugins/plugins`.

Expected commands:

```powershell
chc codex plugins
chc codex plugins --plugin language-coach
chc codex plugins --plugin language-coach --sync-cache
chc codex plugins --plugin language-coach --bump-patch
```

Installing the plugin should write or update a personal marketplace entry named `language-coach` whose local source path points at `codex/plugins/language-coach`.

Synchronizing the plugin cache should write cache content under `language-coach/<version>`, not `english-coach/<version>`.

Bumping the plugin patch version should update `.codex-plugin/plugin.json`. Because the plugin is no longer an npm package, there is no plugin `package.json` to update.

## Cross-Platform Hook Entry

The existing `scripts/english-coach.ps1` behavior should move to `scripts/language-coach.mjs`.

The Node script should:

- Read hook JSON from stdin.
- Parse `user_prompt`, `prompt`, or `message`.
- Return `{}` when there is no meaningful prompt.
- Return `{}` when the prompt does not contain English prose.
- Return a compact JSON object with `systemMessage` when language coaching should be injected.
- Exit successfully even when input parsing fails, matching the current conservative hook behavior.

The hook command should not commit a Windows absolute path, `pwsh.exe`, or any path containing `packages/codex-plugins`.

Preferred source representation:

```json
{
  "type": "command",
  "command": "node \"<PLUGIN_ROOT>/scripts/language-coach.mjs\"",
  "timeout": 5,
  "statusMessage": "Preparing language coaching"
}
```

The CLI should normalize this command when installing or syncing the plugin cache by replacing `<PLUGIN_ROOT>` with the resolved plugin root. This keeps the repository source portable while still giving Codex a concrete runtime command.

## Deletion And Cleanup

The migration should delete:

- `packages/codex-plugins/README.md`
- `packages/codex-plugins/package.json`
- `packages/codex-plugins/plugins/english-coach/**`

The migration should update:

- `apps/cli/src/infra/codex-plugins-root.ts`
- CLI help text and README examples that mention `english-coach` or `packages/codex-plugins`
- Unit and integration tests that construct plugin roots or assert marketplace paths
- `pnpm-lock.yaml` to remove the `packages/codex-plugins` importer
- OpenSpec requirements that still name `english-coach` as the canonical plugin example

`pnpm-workspace.yaml` can continue to include `packages/*` because that pattern may be useful for other packages. It should not be changed solely for this migration.

## Error Handling

If users select `english-coach` after migration, the command should use the existing unknown-selection behavior. No alias or special message is needed.

If the Node hook receives invalid JSON, empty input, or unsupported hook payloads, it should output `{}` and exit zero. The hook should avoid blocking the user's prompt flow because language coaching is optional assistance, not a critical gate.

If hook command normalization cannot resolve a plugin root safely, install or cache sync should fail before writing broken runtime files.

## Testing

Add or update tests to cover:

- Plugin discovery finds `language-coach` under `codex/plugins`.
- Plugin discovery no longer depends on `packages/codex-plugins/plugins`.
- Installing `language-coach` writes a marketplace entry with the new name and new path.
- `--sync-cache` writes cache content under `language-coach/<version>`.
- `--bump-patch` updates `.codex-plugin/plugin.json` without requiring plugin `package.json`.
- Selecting `english-coach` fails as an unknown plugin.
- Hook command output does not contain `C:\Users`, `packages/codex-plugins`, or `pwsh.exe`.
- `scripts/language-coach.mjs` returns a `systemMessage` for English prose input.
- `scripts/language-coach.mjs` returns `{}` for empty, invalid, or non-English input.

## Migration Steps

1. Create `codex/plugins/language-coach` from the existing `english-coach` plugin content.
2. Rename manifest identity and display text to `language-coach` / `Language Coach`.
3. Port the PowerShell hook implementation to `scripts/language-coach.mjs`.
4. Replace hook command source with a portable `<PLUGIN_ROOT>` Node command.
5. Add CLI hook command normalization for install/cache sync runtime output.
6. Change the default plugin root to `repoRoot/codex/plugins`.
7. Update docs, OpenSpec examples, and tests from `english-coach` to `language-coach`.
8. Remove `packages/codex-plugins` and refresh lockfile state.
9. Run focused CLI tests and hook script tests.

## Open Questions

- Should `Language Coach` later grow beyond English checking, or should a future spec narrow the user-facing name if the behavior stays English-only?
- Should the CLI expose a small helper for validating plugin hook commands after normalization?
