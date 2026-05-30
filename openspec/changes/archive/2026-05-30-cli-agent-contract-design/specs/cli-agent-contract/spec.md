## ADDED Requirements

### Requirement: Shared CLI Context
The CLI SHALL derive a shared command context containing TTY state, interactivity, JSON output mode, and quiet output mode before command implementations perform prompt or rendering decisions.

#### Scenario: Interactive default follows TTY
- **WHEN** a command runs without `--no-interactive` and stdin is a TTY
- **THEN** the context marks the command as interactive

#### Scenario: Non-interactive flag disables prompts
- **WHEN** a command runs with `--no-interactive`
- **THEN** the context marks the command as non-interactive even if stdin is a TTY

#### Scenario: JSON flag is captured
- **WHEN** a command runs with `--json`
- **THEN** the context marks JSON output mode as enabled

#### Scenario: Quiet flag is captured
- **WHEN** a command runs with `--quiet`
- **THEN** the context marks quiet output mode as enabled

### Requirement: Prompt Suppression
Commands and bundled scripts MUST NOT call prompt APIs when the shared context is non-interactive.

#### Scenario: Missing required input in non-interactive mode
- **WHEN** a command requires input that was not provided and the context is non-interactive
- **THEN** the command fails without prompting and sets a non-zero exit code

#### Scenario: Missing required input in interactive mode
- **WHEN** a command requires input that was not provided and the context is interactive
- **THEN** the command may prompt for the missing input

### Requirement: JSON Stdout Contract
Commands that support JSON mode SHALL write exactly one parseable JSON value to stdout when `--json` is set.

#### Scenario: Successful JSON command
- **WHEN** a JSON-enabled command completes successfully
- **THEN** stdout contains one JSON object with `ok: true`

#### Scenario: Expected command error in JSON mode
- **WHEN** a JSON-enabled command fails with a deliberate command error
- **THEN** stdout contains one JSON object with `ok: false` and an `error` object

#### Scenario: Diagnostics stay off JSON stdout
- **WHEN** warnings or diagnostics are produced while `--json` is set
- **THEN** those diagnostics are written to stderr and are not mixed into JSON stdout

### Requirement: Command Error Model
Command boundary failures SHALL use a command error model with a stable code, human-readable message, and exit code.

#### Scenario: Missing argument error
- **WHEN** required input is missing in non-interactive mode
- **THEN** the error code is `missing_required_argument` and the exit code is non-zero

#### Scenario: Unknown selection error
- **WHEN** a command receives a requested script or plugin name that cannot be resolved
- **THEN** the error code is `unknown_selection` and the exit code is non-zero

#### Scenario: Human error rendering
- **WHEN** a command fails outside JSON mode
- **THEN** the command renders a concise error message to stderr

### Requirement: Human Output Preservation
Commands SHALL preserve readable human output and interactive prompts outside JSON mode.

#### Scenario: Human command output
- **WHEN** a command runs without `--json`
- **THEN** it may write status-oriented human text to stdout

#### Scenario: Human warnings
- **WHEN** a command discovers a recoverable warning outside JSON mode
- **THEN** it writes the warning to stderr without corrupting the command result
