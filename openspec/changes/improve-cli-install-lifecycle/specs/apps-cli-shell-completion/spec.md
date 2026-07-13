## MODIFIED Requirements

### Requirement: Command and flag candidates
Completion SHALL derive command and flag candidates from the shared CLI command definitions.

#### Scenario: Root command candidates
- **WHEN** a shell adapter requests completion for the root command position
- **THEN** candidates include `codex`, `scripts`, `update`, and `completion`

#### Scenario: Codex subcommand candidates
- **WHEN** a shell adapter requests completion after `chc codex`
- **THEN** candidates include `status`, `export`, `apply`, and `install`

#### Scenario: Completion command candidates
- **WHEN** a shell adapter requests completion after `chc completion`
- **THEN** candidates include `powershell`, `zsh`, `enable`, `disable`, and `status`

#### Scenario: Managed completion shell candidates
- **WHEN** a shell adapter requests completion after `chc completion enable`
- **THEN** candidates include `powershell` and `zsh`

#### Scenario: Shared flag candidates
- **WHEN** a shell adapter requests flag completion for a command that accepts the shared CLI contract flags
- **THEN** candidates include `--json`, `--no-interactive`, and `--quiet`

#### Scenario: Command-specific flag candidates
- **WHEN** a shell adapter requests flag completion for `chc codex status --`
- **THEN** candidates include command-specific flags such as `--repo-root`, `--codex-home`, and `--plugins-root`

#### Scenario: Already used flags are not repeated
- **WHEN** a shell adapter requests flag completion after `chc codex status --json --`
- **THEN** `--json` is not returned again

### Requirement: PowerShell profile lifecycle commands
The CLI SHALL provide explicit commands for managing persistent PowerShell completion setup.

#### Scenario: Persistent PowerShell completion is enabled
- **WHEN** a user runs `chc completion enable powershell`
- **THEN** the CLI writes a managed completion block to the current user's PowerShell profile
- **AND** the managed block loads completion with `chc completion powershell | Out-String | Invoke-Expression`
- **AND** stdout reports that completion was enabled and includes the profile path

#### Scenario: Enable is idempotent
- **WHEN** a user runs `chc completion enable powershell` and the managed completion block is already present
- **THEN** the CLI does not duplicate the managed block
- **AND** stdout reports that completion was already enabled or refreshed

#### Scenario: Persistent PowerShell completion is disabled
- **WHEN** a user runs `chc completion disable powershell`
- **THEN** the CLI removes the managed completion block from the current user's PowerShell profile
- **AND** stdout reports that completion was disabled and includes the profile path

#### Scenario: Disable preserves user-authored profile content
- **WHEN** a PowerShell profile contains content outside the managed completion block
- **AND** a user runs `chc completion disable powershell`
- **THEN** the CLI leaves content outside the managed completion block unchanged

#### Scenario: PowerShell completion status is reported
- **WHEN** a user runs `chc completion status powershell`
- **THEN** the CLI reports whether the managed completion block is installed
- **AND** stdout includes the profile path checked

### Requirement: Completion profile management candidates
The internal completion protocol SHALL expose candidates for completion profile lifecycle commands.

#### Scenario: Completion lifecycle commands are suggested
- **WHEN** a shell adapter requests completion after `chc completion `
- **THEN** candidates include `enable`, `disable`, `status`, `powershell`, and `zsh`

#### Scenario: Managed shell candidates are suggested
- **WHEN** a shell adapter requests completion after `chc completion enable `
- **THEN** candidates include `powershell` and `zsh`

## ADDED Requirements

### Requirement: zsh profile lifecycle commands
The CLI SHALL provide explicit commands for managing persistent zsh completion setup.

#### Scenario: Persistent zsh completion is enabled
- **WHEN** a user runs `chc completion enable zsh`
- **THEN** the CLI writes a managed completion block to the user's zsh profile
- **AND** the managed block initializes the zsh completion system when needed
- **AND** the managed block loads completion with `source <(chc completion zsh)`
- **AND** stdout reports that completion was enabled and includes the profile path

#### Scenario: zsh enable is idempotent
- **WHEN** a user runs `chc completion enable zsh` and the managed completion block is already present
- **THEN** the CLI refreshes the block without duplicating it

#### Scenario: Persistent zsh completion is disabled
- **WHEN** a user runs `chc completion disable zsh`
- **THEN** the CLI removes the managed completion block from the user's zsh profile
- **AND** it preserves user-authored profile content outside the managed block

#### Scenario: zsh completion status is reported
- **WHEN** a user runs `chc completion status zsh`
- **THEN** the CLI reports whether the managed completion block is installed
- **AND** stdout includes the profile path checked

#### Scenario: Documented manual zsh setup is migrated
- **WHEN** the zsh profile contains the standalone documented line `source <(chc completion zsh)`
- **AND** the user enables managed zsh completion
- **THEN** the CLI replaces the standalone line with one managed completion block

#### Scenario: Unsupported managed shell is rejected clearly
- **WHEN** a user runs `chc completion enable fish`
- **THEN** the CLI exits with a non-zero status
- **AND** stderr explains that the managed completion shell is unsupported
