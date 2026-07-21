# apps-cli-codex-config Specification

## Purpose
Define apps/cli behavior for reproducible Codex configuration maintenance, safe repository-managed Codex state, and machine-readable output.
## Requirements
### Requirement: Codex command group
The CLI SHALL expose a `codex` command group with only the public maintenance commands that own reproducible Codex assets.

#### Scenario: Codex group is registered
- **WHEN** a user runs the CLI help for top-level commands
- **THEN** the command list includes `codex`
- **AND** the `codex` command lists exactly `skills` and `install` as public subcommands

#### Scenario: Removed config sync commands are rejected
- **WHEN** a user runs `chc codex status`, `chc codex export`, or `chc codex apply`
- **THEN** the CLI rejects the command as unknown
- **AND** it does not read or write local prompts or rules

#### Scenario: Codex help is shown when no subcommand is provided
- **WHEN** a user runs `chc codex` without a nested command
- **THEN** the CLI prints help for the `codex` command group
- **AND** the help lists `skills` and `install`
- **AND** it exits successfully without prompting

### Requirement: Repository-managed Codex root
The CLI SHALL use `repoRoot/codex` only for the third-party skill manifest and repository-owned plugin sources managed by the remaining Codex commands.

#### Scenario: Skills uses repository manifest
- **WHEN** a user runs `chc codex skills`
- **THEN** the command resolves managed desired state from `repoRoot/codex/skills.manifest.json`
- **AND** it does not treat `repoRoot/.codex` as part of personal skill management

#### Scenario: Install uses repository plugins
- **WHEN** a user runs `chc codex install`
- **THEN** the command discovers repository-owned plugins from `repoRoot/codex/plugins`
- **AND** it leaves repository and local prompts, rules, and standalone skill directories unread and unwritten

#### Scenario: Project codex directory is ignored
- **WHEN** repository `.codex` contains project-local agent instructions, skills, or generated command adapters
- **THEN** `chc codex skills` and `chc codex install` leave that content unread and unwritten
