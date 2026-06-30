# apps-cli-codex-plugin-management Specification

## Purpose
Define apps/cli repository-owned Codex plugin discovery, status reporting, local installation, cache synchronization, and CthuCodex language-coach hook behavior through the current `chc codex status` and `chc codex install` command surface.

## Requirements
### Requirement: Repository plugin status reporting
The `chc codex status` command SHALL report repository-owned Codex plugin state without exposing a separate `chc codex plugins` command.

#### Scenario: Status JSON includes repository plugin state
- **WHEN** the user runs `chc codex status --json`
- **THEN** stdout contains one parseable JSON object with `ok`, `command: "codex status"`, and `comparison`
- **AND** `comparison.repoPlugins` includes discovered repository plugin rows

#### Scenario: Human status includes repository plugin state
- **WHEN** the user runs `chc codex status`
- **THEN** human stdout includes a `Repository plugins` section when repository plugins are discovered
- **AND** each listed plugin is marked `applied`, `not_applied`, or `disabled`

#### Scenario: Plugin-only command is not exposed
- **WHEN** the user runs `chc codex plugins`
- **THEN** the command fails as an unknown command

### Requirement: Repository plugin discovery root
Codex config commands SHALL discover repository-owned plugins from `repoRoot/codex/plugins` by default.

#### Scenario: Default plugin root is codex plugins
- **WHEN** the user runs a `chc codex` config command without `--plugins-root`
- **THEN** the command discovers plugins under `repoRoot/codex/plugins`
- **AND** it does not use `packages/codex-plugins/plugins` as the built-in default root

#### Scenario: Explicit plugin root remains supported
- **WHEN** the user runs a `chc codex` config command with `--plugins-root <path>`
- **THEN** the command discovers repository-owned plugins from the explicit path

### Requirement: CthuCodex plugin source
The repository-owned personal Codex toolkit plugin SHALL be represented as a plain plugin directory named `cthu-codex`.

#### Scenario: CthuCodex plugin is discovered
- **WHEN** `codex/plugins/cthu-codex/.codex-plugin/plugin.json` declares `name` as `cthu-codex`
- **THEN** plugin discovery includes a plugin named `cthu-codex`
- **AND** the plugin target path points at `codex/plugins/cthu-codex`

#### Scenario: Disabled plugin is reported but not installed
- **WHEN** the repository plugin manifest disables `cthu-codex`
- **THEN** `chc codex status` reports the plugin as `disabled`
- **AND** `chc codex install` does not install or sync that plugin

### Requirement: Portable plugin hook commands
The plugin manager SHALL support portable hook command templates in repository plugin sources and write concrete runtime commands during install or cache sync.

#### Scenario: Plugin root placeholder is normalized
- **WHEN** a repository plugin hook command contains `<PLUGIN_ROOT>`
- **THEN** install or cache sync replaces the placeholder with the resolved plugin root before writing runtime hook files

#### Scenario: Runtime hook command is cross-platform
- **WHEN** the `cthu-codex` plugin is installed or synced to cache
- **THEN** the runtime hook command invokes `node` with `scripts/language-coach.mjs`
- **AND** the runtime hook command does not contain `pwsh.exe`, `packages/codex-plugins`, or `C:\\Users`

#### Scenario: Broken hook template fails before writing runtime files
- **WHEN** hook command normalization cannot safely resolve the plugin root
- **THEN** the install or cache sync operation fails before writing broken runtime hook files

### Requirement: Node language coach hook
The CthuCodex language-coach hook SHALL run as a Node script and preserve the current conservative prompt behavior.

#### Scenario: English prose injects language coaching
- **WHEN** the Node hook receives hook input whose `user_prompt`, `prompt`, or `message` contains English prose
- **THEN** it writes one compact JSON object containing `systemMessage`
- **AND** it exits successfully

#### Scenario: Empty or non-English input is ignored
- **WHEN** the Node hook receives empty input, invalid JSON, or input without English prose
- **THEN** it writes `{}`
- **AND** it exits successfully

### Requirement: Repository plugin install
The `chc codex install` command SHALL install enabled repository-owned plugins and synchronize their Codex plugin cache entries.

#### Scenario: Install enabled repository plugins
- **WHEN** the user runs `chc codex install --json`
- **THEN** stdout contains one parseable JSON object with `ok: true`, `command: "codex install"`, and `result`
- **AND** `result.installedPlugins` includes enabled repository plugins that were installed locally

#### Scenario: Sync plugin cache during install
- **WHEN** an enabled repository plugin is installed by `chc codex install`
- **THEN** the command also synchronizes the plugin cache
- **AND** `result.syncedPluginCaches` includes the synchronized plugin name and version

#### Scenario: Unknown selection flags are not part of install
- **WHEN** the user needs to install repository-owned plugins
- **THEN** the supported command is `chc codex install`
- **AND** plugin selection flags such as `--plugin`, `--all`, `--sync-cache`, and `--bump-patch` are not required command-line options

### Requirement: Repository plugin asset boundaries
Repository-owned plugins SHALL flow from repository sources to local Codex state during install, while export and apply preserve their ownership boundaries.

#### Scenario: Export records plugin intent without copying plugin files
- **WHEN** the user runs `chc codex export`
- **THEN** repository-owned plugin directories under `codex/plugins` are not overwritten by local plugin cache contents
- **AND** generated manifests may record plugin intent separately from plugin source files

#### Scenario: Apply does not install repository plugins
- **WHEN** the user runs `chc codex apply`
- **THEN** prompts and rules are restored locally
- **AND** repository-owned plugin installation is left to `chc codex install`

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

#### Scenario: Status reports plugin without requiring MCP startup
- **WHEN** the user runs `chc codex status`
- **THEN** repository plugin status is computed from manifest and marketplace state
- **AND** the command does not attempt to start bundled MCP servers
