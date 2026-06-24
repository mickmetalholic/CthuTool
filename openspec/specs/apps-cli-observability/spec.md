# apps-cli-observability Specification

## Purpose
Define CLI command, bundled script, stderr diagnostics, JSON-safe, and redaction semantics for apps/cli observability.

## Requirements

### Requirement: CLI invocation observability
The CLI SHALL define structured invocation diagnostics for command name, subcommand, script id when applicable, mode, duration, exit code, and stable error code, and those diagnostics MUST NOT prevent deterministic command termination.

#### Scenario: Command completion is observable
- **WHEN** a CLI command completes
- **THEN** CLI observability records command identity, duration, exit code, JSON mode, quiet mode, and stable error code when present

#### Scenario: Command diagnostics respect output mode
- **WHEN** a CLI command runs with JSON output mode enabled
- **THEN** observability diagnostics are written to stderr or another diagnostics channel and do not corrupt JSON stdout

#### Scenario: Diagnostics do not keep JSON commands alive
- **WHEN** a JSON-enabled CLI command emits observability diagnostics during success or deliberate command-error handling
- **THEN** the command exits after writing its single JSON stdout value and does not leave active diagnostic handles that keep the process alive

### Requirement: CLI bundled script diagnostics
The CLI SHALL define bundled script lifecycle diagnostics for selection, argument validation, execution start, progress diagnostics, completion, and failure.

#### Scenario: Script failure is observable
- **WHEN** a bundled script throws or returns a deliberate command error
- **THEN** CLI observability records script id, phase, duration, stable error code, and safe context without logging sensitive input values

### Requirement: CLI redaction semantics
The CLI SHALL redact credentials, tokens, environment-derived secrets, unbounded payloads, and sensitive filesystem details from diagnostics output.

#### Scenario: Sensitive environment value is excluded
- **WHEN** a command error involves environment or configuration values
- **THEN** CLI diagnostics report the failing key or setting name without printing secret values
