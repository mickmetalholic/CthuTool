## Purpose
Define apps/cli Codex personal plugin discovery, status reporting, installation, cache synchronization, and prompt behavior through the official `chc codex plugins` command surface.

## Requirements

### Requirement: Plugin Status JSON
The `chc codex plugins` command SHALL support JSON status output that lists discovered plugins without human prose in stdout.

#### Scenario: Status JSON
- **WHEN** the user runs `chc codex plugins --json`
- **THEN** stdout contains one parseable JSON object with `ok: true`, `command: "codex plugins"`, `plugins`, and `results`

#### Scenario: Plugin row fields
- **WHEN** plugin status is rendered as JSON
- **THEN** each plugin row includes at least `name`, `displayName`, `status`, and `targetPath`

#### Scenario: No plugin selection in JSON mode
- **WHEN** no plugin is selected and `--json` is set
- **THEN** the JSON response includes plugin status and an empty `results` array

### Requirement: Non-Interactive Plugin Status
The `chc codex plugins` command SHALL list plugin status and exit zero when no plugin is selected in non-interactive mode.

#### Scenario: Non-interactive status
- **WHEN** the user runs `chc codex plugins --no-interactive`
- **THEN** the command does not prompt, lists status, and exits zero if discovery succeeds

#### Scenario: Non-interactive JSON status
- **WHEN** the user runs `chc codex plugins --json --no-interactive`
- **THEN** the command does not prompt and stdout contains one status JSON object

### Requirement: Explicit Plugin Operations
The `chc codex plugins` command SHALL install or update plugins only when explicitly selected by `--plugin` or `--all`, or selected through the interactive prompt.

#### Scenario: Explicit plugin selection
- **WHEN** the user runs `chc codex plugins --plugin english-coach --json`
- **THEN** the command installs or updates `english-coach` and includes the operation result in JSON

#### Scenario: All plugin selection
- **WHEN** the user runs `chc codex plugins --all --no-interactive`
- **THEN** the command installs or updates all discovered plugins without prompting

#### Scenario: Unknown plugin selection
- **WHEN** the user requests a plugin name that is not discovered
- **THEN** the command fails with an `unknown_selection` command error and exits non-zero

### Requirement: Plugin Cache Operation Results
The `chc codex plugins` command SHALL include cache sync and version bump outcomes in command results when `--sync-cache` or `--bump-patch` is used.

#### Scenario: Sync cache result
- **WHEN** a selected plugin is installed with `--sync-cache --json`
- **THEN** the JSON result includes the plugin name and synced cache version

#### Scenario: Bump patch result
- **WHEN** a selected plugin is installed with `--bump-patch --json`
- **THEN** the JSON result includes the plugin name and bumped patch version

### Requirement: Interactive Plugin Prompt
The `chc codex plugins` command SHALL preserve the existing multiselect prompt when no plugin is selected and the shared context is interactive.

#### Scenario: Interactive plugin selection
- **WHEN** no plugin is selected and the context is interactive
- **THEN** the command shows the multiselect prompt

#### Scenario: Cancelled plugin selection
- **WHEN** the interactive plugin selection is cancelled
- **THEN** the command fails with a non-zero exit code and no install operation runs
