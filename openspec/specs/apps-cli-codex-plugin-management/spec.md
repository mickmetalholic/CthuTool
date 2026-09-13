# apps-cli-codex-plugin-management Specification

## Purpose
Define apps/cli repository-owned Codex plugin discovery, status reporting, local installation, cache synchronization, and CthuCodex language-coach hook behavior through the current `chc codex status` and `chc codex install` command surface.

## Requirements

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

### Requirement: Remembered plugin repository source

The `chc codex install` command SHALL select a valid repository plugin source and remember a user-selected default across working directories.

#### Scenario: First interactive use

- **WHEN** no saved source or explicit repository root exists and the current directory is not inside a CthuTool workspace
- **THEN** interactive install prompts for a repository path
- **AND** a valid selected path is saved after successful installation

#### Scenario: Reuse and change default

- **WHEN** a valid source has been saved
- **THEN** subsequent install commands use it regardless of the current directory
- **AND** `--change-source` can replace it interactively or with `--repo-root <path>`

#### Scenario: One-run override

- **WHEN** the user supplies `--repo-root <path>` without `--change-source`
- **THEN** the command uses that path for this run without replacing the saved default

#### Scenario: Missing or stale source without prompts

- **WHEN** no valid source is available in JSON or non-interactive mode
- **THEN** install fails before plugin registration or cache mutation
- **AND** the error explains how to select or change the source

### Requirement: Informative plugin installation output

The install command SHALL identify the selected source and the result of repository plugin discovery and installation.

#### Scenario: Plugins installed

- **WHEN** enabled repository plugins are installed
- **THEN** human output names the repository source and how it was selected
- **AND** it lists each installed or updated plugin and its synchronized cache version
- **AND** JSON output includes the resolved source path and source provenance

#### Scenario: No enabled plugins

- **WHEN** a valid repository source has no enabled plugins
- **THEN** human output says no enabled repository plugins were found at that source
- **AND** it does not imply an inspection of already installed plugins

### Requirement: Actionable plugin cache lock error

The `chc codex install` command SHALL distinguish a busy Codex plugin cache from other installation failures and explain how to finish installation safely.

#### Scenario: Cache directory is locked

- **WHEN** plugin cache synchronization fails with filesystem error `EBUSY`
- **THEN** the command identifies the busy cache path
- **AND** human output instructs the user to exit Codex completely and rerun `chc codex install`
- **AND** `--json` output contains a structured `codex_plugin_cache_busy` error

#### Scenario: Unrelated filesystem error

- **WHEN** plugin cache synchronization fails for a reason other than `EBUSY`
- **THEN** the command does not mislabel the failure as a Codex cache lock
