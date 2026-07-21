## MODIFIED Requirements

### Requirement: Command and flag candidates
Completion SHALL derive public static command, nested operation, and flag candidates from the shared CLI registrations and Citty command definitions, while dynamic values use their registered discovery providers.

#### Scenario: Root command candidates
- **WHEN** a shell adapter requests completion for the root command position
- **THEN** candidates include `codex`, `scripts`, `update`, and `completion`

#### Scenario: Codex subcommand candidates
- **WHEN** a shell adapter requests completion after `chc codex`
- **THEN** candidates include exactly `skills` and `install`
- **AND** candidates do not include `status`, `export`, or `apply`

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

#### Scenario: Skills flag candidates
- **WHEN** a shell adapter requests flag completion for `chc codex skills --`
- **THEN** candidates include the supported repository-root and read-only output flags
- **AND** completion does not invent mutation actions that are available only through the interactive selector

#### Scenario: Install flag candidates
- **WHEN** a shell adapter requests flag completion for `chc codex install --`
- **THEN** candidates include command-specific flags such as `--repo-root`, `--codex-home`, and `--plugins-root`

#### Scenario: Already used flags are not repeated
- **WHEN** a shell adapter requests flag completion after `chc codex skills --json --`
- **THEN** `--json` is not returned again

### Requirement: PowerShell word boundary preservation
The PowerShell completion adapter SHALL preserve command-position boundaries when completing command candidates.

#### Scenario: Partial root command advances to next word
- **WHEN** PowerShell completion is requested for `chc code`
- **THEN** the candidate for `codex` completes the active word as `codex ` with a trailing space
- **AND** a subsequent completion request is positioned after `codex` rather than replacing `codex`

#### Scenario: Completed parent command does not get replaced by child command
- **WHEN** PowerShell completion is requested for `chc codex`
- **THEN** the candidate for `codex` completes the active word as `codex ` with a trailing space
- **AND** it does not replace `codex` with `skills` or `install`

#### Scenario: Nested subcommands are offered after parent command boundary
- **WHEN** PowerShell completion is requested for `chc codex `
- **THEN** candidates include `skills` and `install`
- **AND** those candidates are inserted after `codex` rather than replacing `codex`
