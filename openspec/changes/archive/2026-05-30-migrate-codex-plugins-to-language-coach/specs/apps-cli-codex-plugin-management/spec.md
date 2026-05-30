## ADDED Requirements

### Requirement: Repository plugin discovery root
The `chc codex plugins` command SHALL discover repository-owned plugins from `repoRoot/codex/plugins` by default.

#### Scenario: Default plugin root is codex plugins
- **WHEN** the user runs `chc codex plugins` without `--plugins-root`
- **THEN** the command discovers plugins under `repoRoot/codex/plugins`
- **AND** it does not use `packages/codex-plugins/plugins` as the built-in default root

#### Scenario: Explicit plugin root remains supported
- **WHEN** the user runs `chc codex plugins --plugins-root <path>`
- **THEN** the command discovers plugins from the explicit path

### Requirement: Language coach plugin source
The repository-owned language coaching plugin SHALL be represented as a plain plugin directory named `language-coach`.

#### Scenario: Language coach plugin is discovered
- **WHEN** `codex/plugins/language-coach/.codex-plugin/plugin.json` declares `name` as `language-coach`
- **THEN** plugin discovery includes a plugin named `language-coach`
- **AND** the plugin target path points at `codex/plugins/language-coach`

#### Scenario: Old English coach name is unsupported
- **WHEN** the user selects `english-coach`
- **THEN** the command fails with an `unknown_selection` command error
- **AND** no install or cache sync operation runs for `english-coach`

### Requirement: Portable plugin hook commands
The plugin manager SHALL support portable hook command templates in repository plugin sources and write concrete runtime commands during install or cache sync.

#### Scenario: Plugin root placeholder is normalized
- **WHEN** a repository plugin hook command contains `<PLUGIN_ROOT>`
- **THEN** install or cache sync replaces the placeholder with the resolved plugin root before writing runtime hook files

#### Scenario: Runtime hook command is cross-platform
- **WHEN** the `language-coach` plugin is installed or synced to cache
- **THEN** the runtime hook command invokes `node` with `scripts/language-coach.mjs`
- **AND** the runtime hook command does not contain `pwsh.exe`, `packages/codex-plugins`, or `C:\\Users`

#### Scenario: Broken hook template fails before writing runtime files
- **WHEN** hook command normalization cannot safely resolve the plugin root
- **THEN** the install or cache sync operation fails before writing broken runtime hook files

### Requirement: Node language coach hook
The `language-coach` hook SHALL run as a Node script and preserve the current conservative prompt behavior.

#### Scenario: English prose injects language coaching
- **WHEN** the Node hook receives hook input whose `user_prompt`, `prompt`, or `message` contains English prose
- **THEN** it writes one compact JSON object containing `systemMessage`
- **AND** it exits successfully

#### Scenario: Empty or non-English input is ignored
- **WHEN** the Node hook receives empty input, invalid JSON, or input without English prose
- **THEN** it writes `{}`
- **AND** it exits successfully

## MODIFIED Requirements

### Requirement: Explicit Plugin Operations
The `chc codex plugins` command SHALL install or update plugins only when explicitly selected by `--plugin` or `--all`, or selected through the interactive prompt.

#### Scenario: Explicit plugin selection
- **WHEN** the user runs `chc codex plugins --plugin language-coach --json`
- **THEN** the command installs or updates `language-coach` and includes the operation result in JSON

#### Scenario: All plugin selection
- **WHEN** the user runs `chc codex plugins --all --no-interactive`
- **THEN** the command installs or updates all discovered plugins without prompting

#### Scenario: Unknown plugin selection
- **WHEN** the user requests a plugin name that is not discovered
- **THEN** the command fails with an `unknown_selection` command error and exits non-zero

### Requirement: Plugin Cache Operation Results
The `chc codex plugins` command SHALL include cache sync and version bump outcomes in command results when `--sync-cache` or `--bump-patch` is used.

#### Scenario: Sync cache result
- **WHEN** `language-coach` is installed with `--sync-cache --json`
- **THEN** the JSON result includes the plugin name and synced cache version
- **AND** the synced cache path is under `language-coach/<version>`

#### Scenario: Bump patch result
- **WHEN** `language-coach` is installed with `--bump-patch --json`
- **THEN** the JSON result includes the plugin name and bumped patch version
- **AND** the patch version is updated in `.codex-plugin/plugin.json`
- **AND** no plugin-level `package.json` is required
