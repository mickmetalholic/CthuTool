## MODIFIED Requirements

### Requirement: Completion command group
The CLI SHALL expose `completion` as a real command group whose public child commands generate shell adapters or manage persistent completion setup.

#### Scenario: Bare completion group help
- **WHEN** a user runs `chc completion` or `chc completion --help`
- **THEN** stdout presents public operations for `powershell`, `zsh`, `enable`, `disable`, and `status`
- **AND** the bare command exits successfully without modifying a shell profile

#### Scenario: PowerShell completion script
- **WHEN** a user runs `chc completion powershell`
- **THEN** stdout contains a PowerShell registration script
- **AND** the script registers completion for the `chc` command
- **AND** the script calls `chc __complete` to retrieve candidates

#### Scenario: zsh completion script
- **WHEN** a user runs `chc completion zsh`
- **THEN** stdout contains a zsh completion function
- **AND** the script registers completion for the `chc` command
- **AND** the script calls `chc __complete` to retrieve candidates

#### Scenario: Unsupported shell
- **WHEN** a user runs `chc completion fish`
- **THEN** the command fails with a clear unsupported shell error
- **AND** it exits non-zero

#### Scenario: Completion lifecycle child dispatch
- **WHEN** a user runs `chc completion enable <shell>`, `chc completion disable <shell>`, or `chc completion status <shell>`
- **THEN** Citty dispatches through the corresponding registered child command
- **AND** the child command validates the shell without parent-level `rawArgs` action parsing

### Requirement: Command and flag candidates
Completion SHALL derive public static command, nested operation, and flag candidates from the shared CLI registrations and Citty command definitions, while dynamic values use their registered discovery providers.

#### Scenario: Root command candidates
- **WHEN** a shell adapter requests completion for the root command position
- **THEN** candidates include `codex`, `scripts`, `update`, and `completion`

#### Scenario: Codex subcommand candidates
- **WHEN** a shell adapter requests completion after `chc codex`
- **THEN** candidates include `status`, `export`, `apply`, and `install`

#### Scenario: Completion command candidates
- **WHEN** a shell adapter requests completion after `chc completion`
- **THEN** candidates include `powershell`, `zsh`, `enable`, `disable`, and `status`
- **AND** those candidates derive from the registered public completion child commands rather than an independently maintained action list

#### Scenario: Managed completion shell candidates
- **WHEN** a shell adapter requests completion after `chc completion enable`
- **THEN** candidates include `powershell` and `zsh`
- **AND** candidates derive from the same supported-shell definition used for command validation

#### Scenario: Shared flag candidates
- **WHEN** a shell adapter requests flag completion for a command that accepts the shared CLI contract flags
- **THEN** candidates include `--json`, `--no-interactive`, and `--quiet`

#### Scenario: Command-specific flag candidates
- **WHEN** a shell adapter requests flag completion for `chc codex status --`
- **THEN** candidates include command-specific flags such as `--repo-root`, `--codex-home`, and `--plugins-root`

#### Scenario: Already used flags are not repeated
- **WHEN** a shell adapter requests flag completion after `chc codex status --json --`
- **THEN** `--json` is not returned again
