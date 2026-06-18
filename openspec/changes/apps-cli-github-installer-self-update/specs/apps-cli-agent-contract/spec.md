## MODIFIED Requirements

### Requirement: Command Error Model
Command boundary failures SHALL use a command error model with a stable code, human-readable message, and exit code.

#### Scenario: Missing argument error
- **WHEN** required input is missing in non-interactive mode
- **THEN** the error code is `missing_required_argument` and the exit code is non-zero

#### Scenario: Unknown selection error
- **WHEN** a command receives a requested script or plugin name that cannot be resolved
- **THEN** the error code is `unknown_selection` and the exit code is non-zero

#### Scenario: Self-update failure error
- **WHEN** the `self-update` command cannot complete a Git, dependency install, build, or global install step
- **THEN** the error code is `self_update_failed` and the exit code is non-zero

#### Scenario: Human error rendering
- **WHEN** a command fails outside JSON mode
- **THEN** the command renders a concise error message to stderr

### Requirement: Incomplete top-level command help
The CLI SHALL render native help for a top-level command when the user invokes that command without enough arguments to perform an action.

#### Scenario: Top-level command omitted
- **WHEN** the user runs `chc`
- **THEN** the CLI prints root help and exits successfully

#### Scenario: Command group omitted
- **WHEN** the user runs a top-level command such as `chc codex`, `chc scripts`, `chc self-update`, or `chc completion` without a subcommand or required argument
- **THEN** the CLI prints that command's native help and exits successfully

#### Scenario: Complete command still runs
- **WHEN** the user runs a complete command such as `chc codex status`, `chc scripts hello-world`, or `chc self-update --json`
- **THEN** the CLI executes that command instead of printing help
