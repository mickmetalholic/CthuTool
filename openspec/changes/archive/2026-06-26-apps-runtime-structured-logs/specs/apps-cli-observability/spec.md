## MODIFIED Requirements

### Requirement: CLI invocation observability
The CLI SHALL define structured invocation diagnostics for every top-level command, including source, command name, subcommand, script id when applicable, mode, duration, exit code, and stable error code, and those diagnostics MUST NOT prevent deterministic command termination.

#### Scenario: Command completion is observable
- **WHEN** a CLI command completes
- **THEN** CLI observability records source, command identity, duration, exit code, JSON mode, quiet mode, and stable error code when present

#### Scenario: Command diagnostics respect output mode
- **WHEN** a CLI command runs with JSON output mode enabled
- **THEN** observability diagnostics are written to stderr or another diagnostics channel and do not corrupt JSON stdout

#### Scenario: Diagnostics do not keep JSON commands alive
- **WHEN** a JSON-enabled CLI command emits observability diagnostics during success or deliberate command-error handling
- **THEN** the command exits after writing its single JSON stdout value and does not leave active diagnostic handles that keep the process alive

#### Scenario: Top-level commands share diagnostics lifecycle
- **WHEN** any top-level CLI command runs with diagnostics enabled
- **THEN** the command emits a consistent lifecycle of start and completion or failure diagnostics with source, command identity, duration, exit code, and stable error code when present
