## ADDED Requirements

### Requirement: Codex command group
The CLI SHALL expose a `codex` command group for Codex maintenance commands.

#### Scenario: Codex group is registered
- **WHEN** a user runs the CLI help for top-level commands
- **THEN** the command list includes `codex`
- **AND** the `codex` command lists `status`, `diff`, `export`, `apply`, `doctor`, and `plugins` subcommands

### Requirement: Plugin workflow under codex group
The CLI SHALL expose the existing Codex plugin workflow as `chc codex plugins`.

#### Scenario: Plugin status is listed
- **WHEN** a user runs `chc codex plugins` without selecting plugins in non-interactive mode
- **THEN** the command lists discovered Codex plugin install status
- **AND** it exits successfully without installing plugins

#### Scenario: Selected plugin is installed
- **WHEN** a user runs `chc codex plugins --plugin english-coach`
- **THEN** the command installs or updates the matching personal marketplace entry using the same target path semantics as the previous plugin command

#### Scenario: Selected plugin cache is synchronized
- **WHEN** a user runs `chc codex plugins --plugin english-coach --sync-cache`
- **THEN** the command refreshes only the selected plugin in the personal Codex plugin cache

#### Scenario: Patch version is bumped before cache sync
- **WHEN** a user runs `chc codex plugins --plugin english-coach --bump-patch`
- **THEN** the command increments the selected plugin patch version before refreshing its personal Codex plugin cache

### Requirement: Read-only codex status
The CLI SHALL provide `chc codex status` to summarize differences between repository-managed Codex configuration and the local Codex home without writing files.

#### Scenario: Prompt and rule state is summarized
- **WHEN** a user runs `chc codex status`
- **THEN** the command reports added, removed, modified, and unchanged file counts for managed `prompts` and `rules`
- **AND** no repository or local Codex files are written

#### Scenario: Unmanaged intent is reported
- **WHEN** a user runs `chc codex status`
- **THEN** the command reports manual skills present locally but absent from `skills.manifest.json`
- **AND** it reports personal marketplace plugins absent from `plugins.manifest.json`

#### Scenario: Config toml is read-only
- **WHEN** local or repository `config.toml` is present
- **THEN** the command reports `config.toml` as read-only and unmanaged in version 1

### Requirement: Read-only codex diff
The CLI SHALL provide `chc codex diff` to show a diff-oriented view of repository-managed Codex configuration differences without writing files.

#### Scenario: Diff command does not mutate files
- **WHEN** a user runs `chc codex diff`
- **THEN** the command reports local-versus-repository differences for managed prompts, rules, skills manifest intent, and plugin manifest intent
- **AND** no repository or local Codex files are written

### Requirement: Safe codex export
The CLI SHALL provide `chc codex export` to export only safe local Codex configuration into the repository.

#### Scenario: Prompts and rules are exported
- **WHEN** a user runs `chc codex export`
- **THEN** local `.codex/prompts` is mirrored to repository `.codex/prompts`
- **AND** local `.codex/rules` is mirrored to repository `.codex/rules`

#### Scenario: Manifests are generated
- **WHEN** a user runs `chc codex export`
- **THEN** repository `.codex/skills.manifest.json` is generated or updated with versioned manual skill intent
- **AND** repository `.codex/plugins.manifest.json` is generated or updated with versioned personal plugin intent

#### Scenario: Unsafe runtime state is not exported
- **WHEN** a user runs `chc codex export`
- **THEN** the command does not copy auth files, capability session files, sqlite databases, caches, logs, temporary directories, sessions, archived sessions, memories, or plugin cache directories into the repository

### Requirement: Safe codex apply
The CLI SHALL provide `chc codex apply` to apply repository-managed Codex configuration to the local machine without overwriting unmanaged runtime state.

#### Scenario: Prompts and rules are applied
- **WHEN** a user runs `chc codex apply`
- **THEN** repository `.codex/prompts` is mirrored to local `.codex/prompts`
- **AND** repository `.codex/rules` is mirrored to local `.codex/rules`

#### Scenario: Plugin intent is applied
- **WHEN** a user runs `chc codex apply` with a valid `plugins.manifest.json`
- **THEN** the command installs or updates personal plugin marketplace entries for manifest plugins with `enabled` set to true

#### Scenario: Skill intent is handled conservatively
- **WHEN** a user runs `chc codex apply` with a valid `skills.manifest.json`
- **THEN** the command installs repository-local manual skills only when the source type is supported
- **AND** it reports unsupported skill sources without copying bundled, system, or runtime-provided skills

#### Scenario: Unmanaged runtime state is preserved
- **WHEN** a user runs `chc codex apply`
- **THEN** the command does not write auth files, capability session files, sqlite databases, caches, logs, temporary directories, sessions, archived sessions, memories, plugin cache directories, or unmanaged `config.toml` content

### Requirement: Codex repository doctor
The CLI SHALL provide `chc codex doctor` to fail when unsafe Codex runtime state is present under repository `.codex`.

#### Scenario: Safe repository config passes doctor
- **WHEN** repository `.codex` contains only `prompts`, `rules`, `skills.manifest.json`, `plugins.manifest.json`, and `README.md`
- **THEN** `chc codex doctor` exits successfully

#### Scenario: Unsafe files fail doctor
- **WHEN** repository `.codex` contains `auth.json`, `cap_sid`, `*.sqlite`, `*.sqlite-shm`, or `*.sqlite-wal`
- **THEN** `chc codex doctor` exits non-zero and reports each unsafe path

#### Scenario: Unsafe directories fail doctor
- **WHEN** repository `.codex` contains `cache`, `plugins/cache`, `logs`, `log`, `tmp`, `.tmp`, `sessions`, or `archived_sessions`
- **THEN** `chc codex doctor` exits non-zero and reports each unsafe path

### Requirement: Versioned manifests
The CLI SHALL read and write Codex config manifests with explicit schema versions.

#### Scenario: Skills manifest shape is versioned
- **WHEN** `skills.manifest.json` is generated
- **THEN** it contains `version` set to `1`
- **AND** each skill entry contains a skill `name`, `source`, and `path`

#### Scenario: Plugins manifest shape is versioned
- **WHEN** `plugins.manifest.json` is generated
- **THEN** it contains `version` set to `1`
- **AND** each plugin entry contains a plugin `name`, `source`, `path`, and `enabled` flag

### Requirement: Safe path boundaries
The CLI SHALL resolve repository and local Codex paths to absolute paths and refuse writes outside the intended roots.

#### Scenario: Repository write outside root is refused
- **WHEN** an export operation resolves a target outside repository `.codex`
- **THEN** the operation fails without writing the target

#### Scenario: Local Codex write outside root is refused
- **WHEN** an apply operation resolves a target outside the local Codex home
- **THEN** the operation fails without writing the target

### Requirement: Machine-readable output support
The Codex config commands SHALL honor the existing CLI JSON output contract.

#### Scenario: JSON status output is valid
- **WHEN** a user runs `chc codex status --json`
- **THEN** the command writes one machine-readable JSON value to stdout
- **AND** the JSON identifies the command and includes comparison results

#### Scenario: JSON doctor failure is valid
- **WHEN** a user runs `chc codex doctor --json` and unsafe repository content exists
- **THEN** the command writes one machine-readable JSON value describing the failure
- **AND** it exits non-zero
