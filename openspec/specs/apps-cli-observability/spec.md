# apps-cli-observability Specification

## Purpose
Define CLI command, bundled script, stderr diagnostics, JSON-safe, and redaction semantics for apps/cli observability.

## Requirements
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

### Requirement: CLI diagnostic stream separation
The CLI SHALL keep user-facing command output separate from diagnostics while aligning diagnostic event fields with the shared CthuTool client-event envelope.

#### Scenario: CLI event remains local-first
- **WHEN** CLI observability records a diagnostic event
- **THEN** the event includes a stable source, level, event name, message, timestamp, and safe details
- **AND** the event is not sent to `POST /api/client-events` by default
