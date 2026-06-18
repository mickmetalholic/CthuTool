## MODIFIED Requirements

### Requirement: Command and flag candidates
Completion SHALL derive command and flag candidates from the shared CLI command definitions.

#### Scenario: Root command candidates
- **WHEN** a shell adapter requests completion for the root command position
- **THEN** candidates include `codex`, `scripts`, `self-update`, and `completion`

#### Scenario: Codex subcommand candidates
- **WHEN** a shell adapter requests completion after `chc codex`
- **THEN** candidates include `status`, `export`, `apply`, and `install`

#### Scenario: Completion command candidates
- **WHEN** a shell adapter requests completion after `chc completion`
- **THEN** candidates include `powershell`, `zsh`, `enable`, `disable`, and `status`

#### Scenario: Managed completion shell candidates
- **WHEN** a shell adapter requests completion after `chc completion enable`
- **THEN** candidates include `powershell`

#### Scenario: Shared flag candidates
- **WHEN** a shell adapter requests flag completion for a command that accepts the shared CLI contract flags
- **THEN** candidates include `--json`, `--no-interactive`, and `--quiet`

#### Scenario: Command-specific flag candidates
- **WHEN** a shell adapter requests flag completion for `chc codex status --`
- **THEN** candidates include command-specific flags such as `--repo-root`, `--codex-home`, and `--plugins-root`

#### Scenario: Already used flags are not repeated
- **WHEN** a shell adapter requests flag completion after `chc codex status --json --`
- **THEN** `--json` is not returned again
