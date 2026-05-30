## Why

The repository-owned Codex plugin still lives under `packages/codex-plugins` as a pnpm workspace package, while the Codex asset model now expects repo-managed plugins under root-level `codex/plugins`. The plugin also uses the old `english-coach` identity and a Windows-only PowerShell hook, which makes it harder to restore and run consistently across machines.

## What Changes

- Move the repository-owned plugin source from `packages/codex-plugins/plugins/english-coach` to `codex/plugins/language-coach`.
- Rename the plugin identity from `english-coach` to `language-coach`.
- Remove `packages/codex-plugins` as a pnpm workspace package and delete its package-level scripts.
- Change the default `chc codex plugins` discovery root to `codex/plugins`.
- Replace the PowerShell hook implementation with a Node-based `scripts/language-coach.mjs` hook.
- Normalize plugin hook commands during install or cache sync so source `hooks.json` can stay portable and avoid machine-specific absolute paths.
- **BREAKING**: `english-coach` is no longer a supported plugin selection and no alias is provided.
- **BREAKING**: the built-in plugin root no longer points at `packages/codex-plugins/plugins`.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-cli-codex-plugin-management`: Change default plugin discovery, canonical plugin identity, install/cache behavior, and hook portability requirements.
- `apps-cli-codex-config`: Update the `codex plugins` command group scenarios so the canonical repository-owned plugin is `language-coach` under `codex/plugins`.

## Impact

- `codex/plugins/language-coach` plugin source layout.
- Removal of `packages/codex-plugins`.
- `apps/cli/src/infra/codex-plugins-root.ts` default path.
- `apps/cli/src/domain/codex-plugin-manager.ts` install/cache hook command normalization.
- `apps/cli/src/command/codex-plugins.command.ts` and `apps/cli/src/command/codex.command.ts` help text and examples.
- CLI unit and integration tests for plugin discovery, install, cache sync, patch bumping, and unknown plugin selections.
- Documentation and OpenSpec examples that still mention `english-coach` or `packages/codex-plugins`.
- `pnpm-lock.yaml` workspace importer state.
