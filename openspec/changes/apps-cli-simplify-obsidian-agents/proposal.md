## Why

Obsidian agents setup asks users to name a profile even though the vault path already identifies it. Status exposes obsolete Git diagnostics and constant synchronization warnings while presenting useful local health information as an undifferentiated list.

## What Changes

- Identify machine-local configurations by canonical vault path; remove the profile ID prompt and **BREAKING** remove `--profile` in favor of `--vault`.
- Reuse an existing configuration when setup selects the same vault and keep different vaults independent. Status without `--vault` reports every configured vault, with no implicit default.
- **BREAKING** remove legacy Git-specific compatibility, `.git` inspection, and real `.agents` directory adoption/migration. A real directory occupying the link path becomes an actionable conflict; its contents are preserved.
- Remove constant consistency and synchronization warning output, including the corresponding JSON fields. Retain actionable local filesystem diagnostics.
- Redesign human status as a compact overview with visually separated vault sections, clear health badges, aligned details, and focused repair guidance. Respect terminal width, color preferences, quiet mode, and redirected output.
- **BREAKING** use one predictable multi-vault JSON status envelope for both one and many vaults.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-cli-obsidian-agents-link`: Path-based configuration identity and selection, conflict-only handling of real `.agents` directories, useful multi-vault status presentation, and removal of legacy/synchronization diagnostics.

## Impact

Affected areas are `apps/cli/src/command/obsidian.command.ts`, the Obsidian agents config/service modules, targeted CLI tests, and `apps/cli/README.md`. Existing ID-based callers and JSON consumers must adopt the new interface. Current version-2 link configurations can be converted locally using their stored paths; version-1 Git-era configuration support is removed with an actionable setup instruction. No synchronization service or new runtime dependency is introduced. The business plugin and generated OpenSpec adapters remain unchanged.
