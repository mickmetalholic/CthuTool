## ADDED Requirements

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

#### Scenario: Unsupported managed shell is rejected clearly
- **WHEN** a user runs `chc completion enable zsh`
- **THEN** the CLI exits with a non-zero status
- **AND** stderr explains that managed persistent completion currently supports PowerShell only

### Requirement: Completion profile management candidates
The internal completion protocol SHALL expose candidates for completion profile lifecycle commands.

#### Scenario: Completion lifecycle commands are suggested
- **WHEN** a shell adapter requests completion after `chc completion `
- **THEN** candidates include `enable`, `disable`, `status`, `powershell`, and `zsh`

#### Scenario: Managed shell candidates are suggested
- **WHEN** a shell adapter requests completion after `chc completion enable `
- **THEN** candidates include `powershell`
