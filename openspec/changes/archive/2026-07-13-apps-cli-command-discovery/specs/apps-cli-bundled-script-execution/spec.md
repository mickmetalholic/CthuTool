## ADDED Requirements

### Requirement: Bundled Script Catalog Discovery
The `scripts` command group SHALL expose the discovered bundled-script catalog through group help and an explicit `list` operation using the same catalog used for completion, selection, and execution.

#### Scenario: Bare scripts group help
- **WHEN** a user runs `chc scripts` or `chc scripts --help`
- **THEN** stdout presents the public `list` and `run` operations
- **AND** includes an `AVAILABLE SCRIPTS` section with discovered script ids, titles, and descriptions
- **AND** exits successfully without running a bundled script

#### Scenario: Human script listing
- **WHEN** a user runs `chc scripts list`
- **THEN** stdout lists discovered script ids, titles, and descriptions
- **AND** the listed entries come from the same catalog used by script execution

#### Scenario: JSON script listing
- **WHEN** a user runs `chc scripts list --json`
- **THEN** stdout contains exactly one success JSON value with `command: "scripts list"` and bounded script metadata
- **AND** no human catalog text is written to stdout

#### Scenario: Reserved script operation ids
- **WHEN** a bundled script manifest declares `list` or `run` as its script id
- **THEN** discovery rejects or clearly warns about the reserved id
- **AND** static group operations remain unambiguous

## MODIFIED Requirements

### Requirement: Script Selection
The `scripts` command group SHALL resolve the target bundled script through the canonical `run` operation or the existing positional and `--script` compatibility forms.

#### Scenario: Canonical run command
- **WHEN** the user runs `chc scripts run convert-to-cbz`
- **THEN** the `scripts` command selects the bundled script with id `convert-to-cbz`

#### Scenario: Positional script id
- **WHEN** the user runs `chc scripts convert-to-cbz`
- **THEN** the `scripts` command selects the bundled script with id `convert-to-cbz`
- **AND** the compatibility form routes to the same runner used by `chc scripts run convert-to-cbz`

#### Scenario: Script flag
- **WHEN** the user runs `chc scripts --script convert-to-cbz`
- **THEN** the `scripts` command selects the bundled script with id `convert-to-cbz`
- **AND** the compatibility form routes to the same runner used by the canonical `run` operation

#### Scenario: Unknown script id
- **WHEN** the requested script id does not match a discovered script
- **THEN** the command fails with an `unknown_selection` command error

### Requirement: Interactive Script Prompt
The canonical `scripts run` operation SHALL prompt for script selection only when no script id is provided and the shared context is interactive.

#### Scenario: Interactive selection
- **WHEN** a user runs `chc scripts run` without a script id and the context is interactive
- **THEN** the command shows the existing script selection prompt using the shared discovered catalog

#### Scenario: Non-interactive missing script id
- **WHEN** a user runs `chc scripts run` without a script id and the context is non-interactive
- **THEN** the command fails without prompting and sets a non-zero exit code
