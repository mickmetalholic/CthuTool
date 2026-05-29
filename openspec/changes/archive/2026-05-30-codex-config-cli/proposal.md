## Why

Codex maintenance is currently split between a narrow `codex-plugins` command and manual handling of local `.codex` files, which makes intentional configuration harder to review, restore, and version. A broader `codex` command group gives the repository a safe source of truth for low-risk Codex configuration while keeping runtime state in the local Codex home.

## What Changes

- Add a `chc codex` command group for Codex-related maintenance.
- Move the existing plugin workflow under `chc codex plugins` while preserving plugin discovery, installation, cache refresh, and patch bump behavior.
- Add `codex status` and `codex diff` commands to compare repository-managed Codex configuration with the local Codex home without writing files.
- Add `codex export` to mirror safe local prompts/rules into repository `.codex/` and generate reproducibility manifests.
- Add `codex apply` to apply repository-managed prompts/rules and plugin/skill intent to the local Codex home without overwriting unmanaged runtime state.
- Add `codex doctor` to detect unsafe files and directories under repository `.codex/`.
- Treat `config.toml`, memories, auth, databases, logs, sessions, caches, and temporary runtime files as out of scope for versioned config management.

## Capabilities

### New Capabilities

- `codex-config-cli`: Manage safe, reproducible Codex configuration and personal plugin intent through the CLI.

### Modified Capabilities

- None.

## Impact

- Affects `apps/cli/src/index.ts` command registration and CLI help surface.
- Affects or adds command modules under `apps/cli/src/command/`.
- Reuses existing `apps/cli/src/domain/codex-plugin-manager.ts` behavior for plugin operations.
- Adds Codex config comparison, export, apply, manifest generation, and repository safety inspection domain logic.
- Adds path-resolution infrastructure for repository `.codex`, local Codex home, plugin sources, and personal marketplace files.
- Adds unit and integration tests for command behavior, safe write boundaries, manifest output, and unsafe repository content detection.
