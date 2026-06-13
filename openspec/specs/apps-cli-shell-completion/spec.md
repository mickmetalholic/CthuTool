## Purpose
Define PowerShell and zsh shell completion behavior for the `chc` CLI.

## Requirements

### Requirement: Completion command group
The CLI SHALL expose a `completion` command group for shell completion setup scripts.

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

### Requirement: Internal completion protocol
The CLI SHALL expose an internal `__complete` command that returns completion candidates for shell adapters.

#### Scenario: Candidates are line oriented
- **WHEN** a shell adapter calls `chc __complete` with command words
- **THEN** stdout contains zero or more completion candidates
- **AND** each candidate is printed on its own line
- **AND** stdout contains no human status card or JSON contract response

#### Scenario: Completion is non-interactive
- **WHEN** `chc __complete` is invoked for a command path that could otherwise prompt
- **THEN** the command does not prompt
- **AND** it returns candidates or no candidates without waiting for user input

#### Scenario: Completion errors are quiet
- **WHEN** completion cannot resolve the supplied command words
- **THEN** `chc __complete` returns no candidates
- **AND** it does not print noisy diagnostics to stderr

### Requirement: Command and flag candidates
Completion SHALL derive command and flag candidates from the shared CLI command definitions.

#### Scenario: Root command candidates
- **WHEN** a shell adapter requests completion for the root command position
- **THEN** candidates include `codex`, `scripts`, and `completion`

#### Scenario: Codex subcommand candidates
- **WHEN** a shell adapter requests completion after `chc codex`
- **THEN** candidates include `status`, `export`, `apply`, and `install`

#### Scenario: Completion shell candidates
- **WHEN** a shell adapter requests completion after `chc completion`
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

### Requirement: Bundled script id candidates
Completion SHALL provide bundled script ids for the `scripts` command using the existing bundled script discovery behavior.

#### Scenario: Scripts candidates are discovered dynamically
- **WHEN** a shell adapter requests completion after `chc scripts`
- **THEN** candidates include discovered bundled script ids such as `convert-to-cbz`
- **AND** candidates are not maintained as a static shell-specific list

#### Scenario: Script flag candidates use script ids
- **WHEN** a shell adapter requests completion after `chc scripts --script`
- **THEN** candidates include discovered bundled script ids

#### Scenario: Discovery failure
- **WHEN** bundled script discovery fails during completion
- **THEN** `chc __complete` returns no script id candidates
- **AND** it does not trigger the interactive script selection prompt

### Requirement: Documentation
The CLI README SHALL document shell completion setup for PowerShell and zsh.

#### Scenario: PowerShell setup is documented
- **WHEN** a user reads `apps/cli/README.md`
- **THEN** it shows how to load PowerShell completion with `chc completion powershell`

#### Scenario: zsh setup is documented
- **WHEN** a user reads `apps/cli/README.md`
- **THEN** it shows how to load zsh completion with `chc completion zsh`

#### Scenario: Runtime prerequisite is documented
- **WHEN** a user reads the shell completion documentation
- **THEN** it explains that the global or linked `chc` command must be available first

### Requirement: PowerShell word boundary preservation
The PowerShell completion adapter SHALL preserve command-position boundaries when completing command candidates.

#### Scenario: Partial root command advances to next word
- **WHEN** PowerShell completion is requested for `chc code`
- **THEN** the candidate for `codex` completes the active word as `codex ` with a trailing space
- **AND** a subsequent completion request is positioned after `codex` rather than replacing `codex`

#### Scenario: Completed parent command does not get replaced by child command
- **WHEN** PowerShell completion is requested for `chc codex`
- **THEN** the candidate for `codex` completes the active word as `codex ` with a trailing space
- **AND** it does not replace `codex` with `apply`, `export`, `install`, or `status`

#### Scenario: Nested subcommands are offered after parent command boundary
- **WHEN** PowerShell completion is requested for `chc codex `
- **THEN** candidates include `apply`, `export`, `install`, and `status`
- **AND** those candidates are inserted after `codex` rather than replacing `codex`

### Requirement: PowerShell empty current-word transport
The PowerShell completion adapter SHALL reliably communicate an empty current word to `chc __complete` even when the global `chc` command is reached through a Windows command shim.

#### Scenario: Empty current word survives command shim invocation
- **WHEN** PowerShell completion is requested after a trailing space such as `chc codex `
- **THEN** the adapter passes an internal empty-word marker to `chc __complete`
- **AND** `chc __complete` interprets that marker as an empty current word before computing candidates

#### Scenario: Direct current-word completion remains distinct
- **WHEN** `chc __complete codex` is invoked without an empty current-word marker
- **THEN** completion treats `codex` as the current word prefix
- **AND** it does not return child commands for `codex`
