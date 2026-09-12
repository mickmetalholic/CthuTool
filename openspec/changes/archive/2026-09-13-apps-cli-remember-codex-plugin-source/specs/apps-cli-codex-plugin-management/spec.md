## ADDED Requirements

### Requirement: Remembered plugin repository source

The `chc codex install` command SHALL select a valid repository plugin source and remember a user-selected default across working directories.

#### Scenario: First interactive use

- **WHEN** no saved source or explicit repository root exists and the current directory is not inside a CthuTool workspace
- **THEN** interactive install prompts for a repository path
- **AND** a valid selected path is saved after successful installation

#### Scenario: Reuse and change default

- **WHEN** a valid source has been saved
- **THEN** subsequent install commands use it regardless of the current directory
- **AND** `--change-source` can replace it interactively or with `--repo-root <path>`

#### Scenario: One-run override

- **WHEN** the user supplies `--repo-root <path>` without `--change-source`
- **THEN** the command uses that path for this run without replacing the saved default

#### Scenario: Missing or stale source without prompts

- **WHEN** no valid source is available in JSON or non-interactive mode
- **THEN** install fails before plugin registration or cache mutation
- **AND** the error explains how to select or change the source

### Requirement: Informative plugin installation output

The install command SHALL identify the selected source and the result of repository plugin discovery and installation.

#### Scenario: Plugins installed

- **WHEN** enabled repository plugins are installed
- **THEN** human output names the repository source and how it was selected
- **AND** it lists each installed or updated plugin and its synchronized cache version
- **AND** JSON output includes the resolved source path and source provenance

#### Scenario: No enabled plugins

- **WHEN** a valid repository source has no enabled plugins
- **THEN** human output says no enabled repository plugins were found at that source
- **AND** it does not imply an inspection of already installed plugins
