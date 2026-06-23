## Purpose
Define how apps/cli discovers and invokes bundled scripts, forwards script arguments, preserves interactive selection, and exposes JSON-safe execution behavior.

## Requirements

### Requirement: Script Selection
The `scripts` command SHALL resolve the target bundled script from either the positional script id or the `--script` flag.

#### Scenario: Positional script id
- **WHEN** the user runs `chc scripts convert-to-cbz`
- **THEN** the `scripts` command selects the bundled script with id `convert-to-cbz`

#### Scenario: Script flag
- **WHEN** the user runs `chc scripts --script convert-to-cbz`
- **THEN** the `scripts` command selects the bundled script with id `convert-to-cbz`

#### Scenario: Unknown script id
- **WHEN** the requested script id does not match a discovered script
- **THEN** the command fails with an `unknown_selection` command error

### Requirement: Interactive Script Prompt
The `scripts` command SHALL prompt for script selection only when no script id is provided and the shared context is interactive.

#### Scenario: Interactive selection
- **WHEN** no script id is provided and the context is interactive
- **THEN** the command shows the existing script selection prompt

#### Scenario: Non-interactive missing script id
- **WHEN** no script id is provided and the context is non-interactive
- **THEN** the command fails without prompting and sets a non-zero exit code

### Requirement: Bundled Script Invocation Contract
The `scripts` command SHALL invoke bundled script default exports with parsed script arguments and a bundled script context containing the shared CLI context.

#### Scenario: Arguments are forwarded
- **WHEN** the user runs `chc scripts convert-to-cbz --input ./samples --format jpg`
- **THEN** `convert-to-cbz` receives `input` and `format` in its args object

#### Scenario: Context is forwarded
- **WHEN** a bundled script is invoked by the `scripts` command
- **THEN** the script receives a context object whose `cli` field is the shared CLI context

#### Scenario: Script execution failure
- **WHEN** a bundled script throws during execution
- **THEN** the `scripts` command reports a `script_execution_failed` command error and exits non-zero

### Requirement: convert-to-cbz Input Handling
The `convert-to-cbz` bundled script SHALL run directly when `--input` is present and SHALL only prompt for input when the shared context is interactive.

#### Scenario: Input provided
- **WHEN** `convert-to-cbz` receives a non-empty `input` argument
- **THEN** it starts the conversion without prompting

#### Scenario: Input omitted interactively
- **WHEN** `convert-to-cbz` receives no input and the shared context is interactive
- **THEN** it prompts for the input directory

#### Scenario: Input omitted non-interactively
- **WHEN** `convert-to-cbz` receives no input and the shared context is non-interactive
- **THEN** it fails with a `missing_required_argument` command error without prompting

### Requirement: convert-to-cbz JSON Summary
The `convert-to-cbz` bundled script SHALL emit a conversion summary object when the shared context has JSON output mode enabled.

#### Scenario: Successful JSON conversion
- **WHEN** `chc scripts convert-to-cbz --input ./samples --json` completes successfully
- **THEN** stdout contains one JSON object with `ok: true`, `command: "scripts"`, `script: "convert-to-cbz"`, and a `summary` object

#### Scenario: Human completion card
- **WHEN** `convert-to-cbz` completes successfully without JSON mode
- **THEN** it renders the existing human completion card

#### Scenario: JSON conversion failure
- **WHEN** `convert-to-cbz` fails in JSON mode with a deliberate command error
- **THEN** stdout contains one JSON object with `ok: false` and no human completion card

### Requirement: Bundled script lifecycle observability
Bundled script execution SHALL emit safe lifecycle diagnostics through the shared CLI diagnostics contract.

#### Scenario: Script start is observable
- **WHEN** a bundled script starts executing
- **THEN** diagnostics identify the script id, execution mode, and safe argument summary without printing unbounded argument payloads

#### Scenario: Script progress stays JSON-safe
- **WHEN** a bundled script reports progress while JSON mode is enabled
- **THEN** progress diagnostics are kept off JSON stdout and do not prevent the final JSON result from being parseable
