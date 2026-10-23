## Why

The global language-coaching hook can interrupt Obsidian language practice Skills
by rewriting answers before the Skill's feedback stage. Obsidian Sync excludes
the vault's hidden `.codex` directory, so each machine needs a local hook default
that the existing agents setup command can initialize.

## What Changes

- Create a missing `<vault>/.codex/config.toml` with `[features].hooks = false`
  during `chc obsidian agents setup`, alongside the existing skill links.
- Preview config creation and require the existing setup confirmation even when
  the links are already correct; preserve existing config files byte for byte.
- Reject occupied or redirected config paths before applying setup and detect
  inspected path changes between preview and application.
- Include local config presence in setup output and read-only status health.
- Document per-machine initialization and the vault-root working directory scope.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-cli-obsidian-agents-link`: Initialize and inspect vault-local Codex hook
  defaults as part of the existing agents setup workflow.

## Impact

- CLI domain setup planning, application, topology inspection, and status output.
- Obsidian integration tests, CLI documentation, and the committed CLI bundle.
- Additive setup JSON `codexConfig` and status JSON `codexConfigPath` /
  `paths.codexConfigExists` fields; existing vaults without a config need setup
  once more to become healthy.
- No new dependencies, plugin changes, synchronization service, or global Codex
  configuration changes. Existing explicit hook settings remain authoritative.

This change records the implementation already completed and verified for this
request; it does not introduce additional implementation scope.
