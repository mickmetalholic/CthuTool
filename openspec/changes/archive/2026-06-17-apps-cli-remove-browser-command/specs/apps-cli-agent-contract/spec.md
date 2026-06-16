## ADDED Requirements

### Requirement: Incomplete top-level command help
The CLI SHALL render native help for a top-level command when the user invokes that command without enough arguments to perform an action.

#### Scenario: Top-level command omitted
- **WHEN** the user runs `chc`
- **THEN** the CLI prints root help and exits successfully

#### Scenario: Command group omitted
- **WHEN** the user runs a top-level command such as `chc codex`, `chc scripts`, or `chc completion` without a subcommand or required argument
- **THEN** the CLI prints that command's native help and exits successfully

#### Scenario: Complete command still runs
- **WHEN** the user runs a complete command such as `chc codex status` or `chc scripts hello-world`
- **THEN** the CLI executes that command instead of printing help
