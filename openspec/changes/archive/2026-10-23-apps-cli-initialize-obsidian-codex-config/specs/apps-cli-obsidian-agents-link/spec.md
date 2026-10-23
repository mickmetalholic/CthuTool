## ADDED Requirements

### Requirement: Vault-local Codex hook defaults
Obsidian agents setup SHALL create a missing `<vault>/.codex/config.toml`
with `[features].hooks = false` so language practice Skills control feedback
without automatic hook interference. This default SHALL remain machine-local
and SHALL not disable Codex Skills, MCP servers, or hooks in other projects.

#### Scenario: Missing Codex configuration is initialized
- **WHEN** setup runs for a vault without `.codex/config.toml`
- **THEN** its preview includes local config creation with hooks disabled
- **AND** it requires confirmation, including when the skill links are already correct
- **AND** applying setup creates a regular file with `[features].hooks = false`
- **AND** the setup result reports the file path and that it was created

#### Scenario: Existing Codex configuration is preserved
- **WHEN** the vault already contains a regular `.codex/config.toml`
- **THEN** setup preserves its contents byte for byte, including explicit hook settings
- **AND** the setup result reports that the existing file was preserved
- **AND** repeating a complete setup requires no additional mutation confirmation

#### Scenario: Occupied or changed config paths prevent unintended writes
- **WHEN** `.codex` is a file or link, an occupied `config.toml` is not a regular file, or an inspected config path kind or link target changes between preview and application
- **THEN** setup stops before changing the vault
- **AND** it preserves existing config contents and link targets

#### Scenario: Status inspects local configuration without changing it
- **WHEN** status inspects a configured vault
- **THEN** it includes `codexConfigPath` and `paths.codexConfigExists`
- **AND** a missing or non-regular config path is reported as needing attention with setup guidance
- **AND** it does not create the missing config or traverse a redirected `.codex` directory
- **AND** an existing regular config is considered present without asserting that hooks are disabled
