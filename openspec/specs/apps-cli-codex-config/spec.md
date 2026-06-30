# apps-cli-codex-config Specification

## Purpose
Define apps/cli behavior for reproducible Codex configuration maintenance, safe repository-managed Codex state, and machine-readable output.

## Requirements
### Requirement: Codex command group
The CLI SHALL expose a `codex` command group for Codex maintenance commands.

#### Scenario: Codex group is registered
- **WHEN** a user runs the CLI help for top-level commands
- **THEN** the command list includes `codex`
- **AND** the `codex` command lists `status`, `export`, `apply`, and `install` subcommands

#### Scenario: Plugin maintenance command is not exposed
- **WHEN** a user runs `chc codex plugins`
- **THEN** the CLI rejects the command as unknown
- **AND** users install repository plugin intent through `chc codex install`

#### Scenario: Diff command is not exposed
- **WHEN** a user runs `chc codex diff`
- **THEN** the CLI rejects the command as unknown
- **AND** users request detailed comparison output through `chc codex status`

#### Scenario: Doctor command is not exposed
- **WHEN** a user runs `chc codex doctor`
- **THEN** the CLI rejects the command as unknown
- **AND** users check repository safety through `chc codex status`

#### Scenario: Top-level help is shown when no command is provided
- **WHEN** a user runs `chc` without arguments
- **THEN** the CLI prints the top-level help with available commands
- **AND** it exits successfully
- **AND** it does not print a `No command specified` error
#### Scenario: Codex help is shown when no subcommand is provided
- **WHEN** a user runs `chc codex` without a nested command
- **THEN** the CLI prints help for the `codex` command group
- **AND** the help lists `status`, `export`, `apply`, and `install`
- **AND** it exits successfully
- **AND** it does not print a `No command specified` error

### Requirement: Read-only codex status
The CLI SHALL provide `chc codex status` to summarize differences between repository-managed Codex configuration under `repoRoot/codex` and the local Codex home without writing files.

#### Scenario: Codex help is shown when no subcommand is provided
- **WHEN** a user runs `chc codex` without a nested command
- **THEN** the CLI prints help for the `codex` command group
- **AND** the help lists `status`, `export`, `apply`, and `install`
- **AND** it exits successfully
- **AND** it does not print a `No command specified` error

#### Scenario: Prompt and rule state is summarized
- **WHEN** a user runs `chc codex status`
- **THEN** the command reports added, removed, modified, and unchanged file counts for managed `prompts` and `rules`
- **AND** no repository or local Codex files are written

#### Scenario: Local backup intent gaps are reported
- **WHEN** a user runs `chc codex status`
- **THEN** the command reports personal skills present locally but absent from `codex/skills.manifest.json`
- **AND** it reports personal marketplace plugins absent from `codex/plugins.manifest.json`
- **AND** it does not report plugin-provided skills as independent skill assets

#### Scenario: Unsafe repository runtime state is reported
- **WHEN** repository `codex` contains unsafe runtime files or directories
- **THEN** `chc codex status` reports each unsafe path as repository content that should not be tracked
- **AND** it exits non-zero
- **AND** it does not inspect or report repository `.codex` content

#### Scenario: Status does not mutate files
- **WHEN** a user runs `chc codex status`
- **THEN** the command reports local-versus-repository differences for managed prompts, rules, skills manifest intent, and plugin manifest intent
- **AND** no repository or local Codex files are written

#### Scenario: Human status output is structured and scannable
- **WHEN** a user runs `chc codex status` without `--json`
- **THEN** the command prints a visually structured review view with a clear title, compared roots, and grouped sections
- **AND** it summarizes `prompts` and `rules` with added, removed, modified, and unchanged counts
- **AND** it lists changed file paths grouped by state for each managed area
- **AND** it reports repository-owned skills and plugins that are not yet installed locally
- **AND** it reports repository plugin status for valid plugin directories under `codex/plugins`
- **AND** it reports local backup intent gaps, unsupported restore intent, and unsafe repository runtime state as separate sections when present
- **AND** it does not render plugin-provided skills as a separate user-visible section
- **AND** it uses color or other terminal styling only for human output

#### Scenario: Repository plugin directory status is reported
- **WHEN** repository `codex/plugins` contains a valid plugin directory
- **THEN** `chc codex status` reports that plugin in a repository plugin status section
- **AND** it reports `not applied` when the local marketplace does not point at that repository plugin path
- **AND** it reports `applied` when the local marketplace points at that repository plugin path
- **AND** it reports `disabled` when the repository manifest entry is disabled

#### Scenario: Repository-owned skill and plugin install gaps are reported
- **WHEN** `codex/skills.manifest.json` contains an enabled `source: "repo"` skill entry whose path is under `codex/skills`
- **AND** the corresponding local Codex skill target is absent
- **THEN** `chc codex status` reports that skill as a repository-owned skill not yet installed locally
- **WHEN** `codex/plugins.manifest.json` contains an enabled `source: "repo"` plugin entry whose path is under `codex/plugins`
- **AND** the local personal marketplace does not register that plugin to the expected repository plugin path
- **THEN** `chc codex status` reports that plugin as a repository-owned plugin not yet installed locally
- **AND** disabled manifest entries are not reported as missing local installs

#### Scenario: Repository directories are install gaps before manifest generation
- **WHEN** repository `codex/skills` contains a skill directory that has no manifest entry
- **AND** the corresponding local Codex skill target is absent
- **THEN** `chc codex status` reports that skill as a repository-owned skill not yet installed locally
- **WHEN** repository `codex/plugins` contains a valid plugin directory that has no manifest entry
- **AND** the local personal marketplace does not register that plugin to the expected repository plugin path
- **THEN** `chc codex status` reports that plugin as a repository-owned plugin not yet installed locally

#### Scenario: Machine-readable status output remains stable
- **WHEN** a user runs `chc codex status --json`
- **THEN** the command prints the comparison shape used by automation, including repository-owned skill install gap fields, plugin install gap fields, and repository plugin status fields when present
- **AND** the JSON output contains no ANSI styling, decorative borders, or human-only summary text
- **AND** the JSON output does not expose plugin-provided skill names or a plugin-provided skill section

#### Scenario: Status output is bounded
- **WHEN** a managed area contains many changed paths
- **THEN** human status output lists a deterministic limited set of paths per state
- **AND** it reports how many additional paths were omitted

### Requirement: Safe codex export
The CLI SHALL provide `chc codex export` to back up only safe local Codex configuration into `repoRoot/codex`.

#### Scenario: Prompts and rules are exported
- **WHEN** a user runs `chc codex export`
- **THEN** local `.codex/prompts` is mirrored to repository `codex/prompts`
- **AND** local `.codex/rules` is mirrored to repository `codex/rules`

#### Scenario: Generated prompt adapters are not exported
- **GIVEN** local `.codex/prompts` contains generated command adapter files matching `opsx-*.md`
- **WHEN** a user runs `chc codex export`
- **THEN** those generated prompt adapters are not copied to repository `codex/prompts`
- **AND** `chc codex status` does not report those generated prompt adapters as prompt differences

#### Scenario: Repository-owned assets are not reverse-synced
- **WHEN** a user runs `chc codex export`
- **THEN** the command does not copy local skill or plugin files into repository `codex/skills` or `codex/plugins`
- **AND** it does not infer repository ownership from local installed skills, local installed plugins, or plugin caches

#### Scenario: Local install intent is backed up
- **WHEN** a user runs `chc codex export`
- **THEN** locally installed user skills under local `.codex/skills` that contain `SKILL.md` are recorded as external manifest entries without copying their files
- **AND** locally registered personal marketplace plugins are recorded as marketplace manifest entries without copying their files
- **AND** plugin-provided skills are not added to `codex/skills.manifest.json`

#### Scenario: System and plugin-provided skills are not exported
- **WHEN** local system skills, runtime marker directories, or plugin-provided skills exist
- **THEN** `chc codex export` does not add them to `codex/skills.manifest.json`
- **AND** it does not copy them into the repository

#### Scenario: Unsafe runtime state is not exported
- **WHEN** a user runs `chc codex export`
- **THEN** the command does not copy auth files, capability session files, sqlite databases, caches, logs, temporary directories, sessions, archived sessions, memories, config files, or plugin cache directories into the repository

### Requirement: Safe codex apply
The CLI SHALL provide `chc codex apply` to restore repository Codex configuration from `repoRoot/codex` to the local machine without overwriting unmanaged runtime state.

#### Scenario: Prompts and rules are applied
- **WHEN** a user runs `chc codex apply`
- **THEN** repository `codex/prompts` is mirrored to local `.codex/prompts`
- **AND** repository `codex/rules` is mirrored to local `.codex/rules`

#### Scenario: Overwriting local prompts or rules requires confirmation
- **WHEN** a user runs `chc codex apply` and repository config would overwrite or delete existing local managed prompt or rule files
- **THEN** the command asks for confirmation before applying in interactive human mode
- **AND** JSON, non-interactive, or non-TTY mode fails before writing unless `--yes` is supplied

#### Scenario: Generated prompt adapters are preserved during apply
- **GIVEN** local `.codex/prompts` contains generated command adapter files matching `opsx-*.md`
- **WHEN** a user runs `chc codex apply`
- **THEN** those generated prompt adapters remain in local `.codex/prompts`
- **AND** they are not required to exist in repository `codex/prompts`

#### Scenario: Repository-owned assets are not applied
- **WHEN** a user runs `chc codex apply` with repository-owned skills or plugins under `codex/skills` or `codex/plugins`
- **THEN** the command does not install those repository-owned skills or plugins
- **AND** it does not synchronize repository-owned plugin cache entries

#### Scenario: Official external skill intent is applied when a source exists
- **WHEN** a user runs `chc codex apply` with an enabled `source: "external"` skill entry whose path is `skill:<name>`
- **AND** Codex's local official skill import cache contains that skill, or the skill can be fetched from the official curated or experimental skill repository
- **THEN** the command installs the skill locally

#### Scenario: Unsupported or unavailable external intent is reported
- **WHEN** a user runs `chc codex apply` with manifest entries whose source is unsupported or unavailable to the current implementation
- **THEN** the command reports those entries as unsupported and prints a manual install hint in human output
- **AND** it does not copy bundled, system, plugin-provided, or runtime-provided assets to satisfy them

#### Scenario: Unmanaged runtime state is preserved
- **WHEN** a user runs `chc codex apply`
- **THEN** the command does not write auth files, capability session files, sqlite databases, caches, logs, temporary directories, sessions, archived sessions, memories, plugin cache directories, unmanaged personal skills, or unmanaged `config.toml` content

### Requirement: Repository-owned codex install
The CLI SHALL provide `chc codex install` to install repository-owned Codex skills and plugins from `repoRoot/codex` to the local machine without applying prompts or rules.

#### Scenario: Repository plugin intent is installed
- **WHEN** a user runs `chc codex install` with a valid `codex/plugins.manifest.json`
- **THEN** the command installs or registers enabled plugins with `source` set to `repo` from paths under `codex/plugins`
- **AND** it synchronizes each installed repository plugin into the local Codex personal plugin cache
- **AND** it enables each installed repository plugin in local Codex config
- **AND** synchronized hook commands do not expose repository placeholders such as `<PLUGIN_ROOT>`
- **AND** no local plugin files are copied back into repository `codex/plugins`

#### Scenario: Repository skill intent is installed
- **WHEN** a user runs `chc codex install` with a valid `codex/skills.manifest.json`
- **THEN** the command installs enabled skills with `source` set to `repo` from paths under `codex/skills`
- **AND** no local skill files are copied back into repository `codex/skills`

#### Scenario: Repository directories are installed before manifest generation
- **WHEN** a user runs `chc codex install`
- **AND** repository `codex/skills` contains a skill directory that has no manifest entry
- **THEN** the command installs that skill as enabled repository intent
- **WHEN** repository `codex/plugins` contains a valid plugin directory that has no manifest entry
- **THEN** the command installs or registers that plugin as enabled repository intent

#### Scenario: Config restore is not performed during install
- **WHEN** a user runs `chc codex install`
- **THEN** repository `codex/prompts` and `codex/rules` are not mirrored to local `.codex/prompts` or `.codex/rules`

### Requirement: Versioned manifests
The CLI SHALL read and write Codex config manifests with explicit schema versions and source ownership.

#### Scenario: Skills manifest shape is versioned
- **WHEN** `codex/skills.manifest.json` is generated
- **THEN** it contains `version` set to `1`
- **AND** generated entries describe local backup skill intent with a skill `name`, `source` set to `external`, `path` in `skill:<name>` form, and `enabled` flag
- **AND** repository-owned skill files under `codex/skills` are not generated into the manifest unless an existing disabled repository entry is being preserved

#### Scenario: Plugins manifest shape is versioned
- **WHEN** `codex/plugins.manifest.json` is generated
- **THEN** it contains `version` set to `1`
- **AND** generated entries describe local backup plugin intent with a plugin `name`, `source` set to `marketplace`, `path` in `marketplace:<name>` form, and `enabled` flag
- **AND** repository-owned plugin files under `codex/plugins` are not generated into the manifest unless an existing disabled repository entry is being preserved

#### Scenario: Existing manifest ownership is preserved
- **WHEN** an existing manifest contains non-repository source entries
- **THEN** export preserves or refreshes local backup intent without converting local files into repository-owned assets
- **AND** repository-owned entries continue to represent repository sources only

### Requirement: Safe path boundaries
The CLI SHALL resolve repository and local Codex paths to absolute paths and refuse writes outside the intended roots.

#### Scenario: Repository write outside root is refused
- **WHEN** an export operation resolves a target outside repository `codex`
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

#### Scenario: JSON unsafe repository state is valid
- **WHEN** a user runs `chc codex status --json` and unsafe repository content exists
- **THEN** the command writes one machine-readable JSON value describing the unsafe paths
- **AND** it exits non-zero

### Requirement: Repository-managed Codex root
The CLI SHALL use `repoRoot/codex` as the repository-managed root for Codex config sync commands.

#### Scenario: Managed root is codex directory
- **WHEN** a user runs `chc codex status`, `export`, `apply`, or `install`
- **THEN** the command treats `repoRoot/codex` as the repository-managed Codex root
- **AND** it does not treat `repoRoot/.codex` as part of the config sync feature

#### Scenario: Project codex directory is ignored
- **WHEN** repository `.codex` contains project-local agent instructions, skills, or command adapters
- **THEN** `chc codex status`, `export`, `apply`, and `install` leave that content unread and unwritten for config sync purposes

#### Scenario: Plugin maintenance command is not exposed
- **WHEN** a user runs `chc codex plugins`
- **THEN** the CLI rejects the command as unknown
- **AND** users install repository plugin intent through `chc codex install`

#### Scenario: Diff command is not exposed
- **WHEN** a user runs `chc codex diff`
- **THEN** the CLI rejects the command as unknown
- **AND** users request detailed comparison output through `chc codex status`

#### Scenario: Doctor command is not exposed
- **WHEN** a user runs `chc codex doctor`
- **THEN** the CLI rejects the command as unknown
- **AND** users check repository safety through `chc codex status`

#### Scenario: Top-level help is shown when no command is provided
- **WHEN** a user runs `chc` without arguments
- **THEN** the CLI prints the top-level help with available commands
- **AND** it exits successfully
- **AND** it does not print a `No command specified` error
