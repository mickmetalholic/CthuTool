## MODIFIED Requirements

### Requirement: Repository plugin discovery root
The Codex plugin install command SHALL discover repository-owned plugins from `repoRoot/codex/plugins` by default.

#### Scenario: Default plugin root is codex plugins
- **WHEN** the user runs `chc codex install` without `--plugins-root`
- **THEN** the command discovers plugins under `repoRoot/codex/plugins`
- **AND** it does not use packages or personal plugin caches as repository source roots

#### Scenario: Explicit plugin root remains supported
- **WHEN** the user runs `chc codex install` with `--plugins-root <path>`
- **THEN** the command discovers repository-owned plugins from the explicit path

### Requirement: CthuCodex plugin source
The repository-owned personal Codex toolkit plugin SHALL be represented as a plain plugin directory named `cthu-codex`.

#### Scenario: CthuCodex plugin is discovered
- **WHEN** `codex/plugins/cthu-codex/.codex-plugin/plugin.json` declares `name` as `cthu-codex`
- **THEN** plugin discovery includes a plugin named `cthu-codex`
- **AND** the plugin target path points at `codex/plugins/cthu-codex`

#### Scenario: Disabled plugin is not installed
- **WHEN** the repository plugin manifest disables `cthu-codex`
- **THEN** `chc codex install` does not install, enable, or sync that plugin

### Requirement: Repository plugin asset boundaries
Repository-owned plugins SHALL flow only from repository plugin sources to local Codex plugin registration and cache state during `chc codex install`.

#### Scenario: Install does not manage standalone skills
- **WHEN** the user runs `chc codex install`
- **THEN** the command does not install, compare, or remove standalone local or repository skill directories
- **AND** third-party skill lifecycle remains owned by `chc codex skills`

#### Scenario: Install does not restore config files
- **WHEN** the user runs `chc codex install`
- **THEN** the command does not mirror prompts or rules
- **AND** it does not overwrite unmanaged local Codex configuration

#### Scenario: Skills does not manage plugins
- **WHEN** the user runs `chc codex skills`
- **THEN** the command does not register repository plugins, enable plugin config entries, or synchronize plugin caches

### Requirement: Repository plugin MCP metadata preservation
The `chc codex install` flow SHALL preserve bundled MCP server metadata when installing and synchronizing repository-owned Codex plugins.

#### Scenario: Installed plugin keeps MCP server declaration
- **WHEN** an enabled repository plugin declares a bundled MCP server in its plugin manifest
- **AND** the user runs `chc codex install`
- **THEN** the installed local plugin entry preserves the MCP server declaration
- **AND** existing hook metadata remains preserved

#### Scenario: Plugin cache keeps MCP server declaration
- **WHEN** an enabled repository plugin with bundled MCP server metadata is synchronized to the Codex plugin cache
- **THEN** the versioned cache copy preserves the MCP server declaration
- **AND** hook command normalization does not remove or rewrite unrelated MCP metadata

## REMOVED Requirements

### Requirement: Repository plugin status reporting
**Reason**: `chc codex status` is removed and the remaining `skills` command is intentionally isolated from repository plugin state.
**Migration**: Run `chc codex install` to reconcile enabled repository plugins; inspect its human or JSON result for the completed install operation.
