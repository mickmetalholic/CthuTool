# apps-cli-bundled-script-execution Specification

## Purpose
Define how apps/cli discovers and invokes bundled scripts, forwards script arguments, preserves interactive selection, and exposes JSON-safe execution behavior.
## Requirements
### Requirement: Script Selection
The `scripts` command group SHALL resolve the target bundled script through the canonical `run` operation or the existing positional and `--script` compatibility forms.

#### Scenario: Canonical run command
- **WHEN** the user runs `chc scripts run convert-to-cbz`
- **THEN** the `scripts` command selects the bundled script with id `convert-to-cbz`

#### Scenario: Positional script id
- **WHEN** the user runs `chc scripts convert-to-cbz`
- **THEN** the `scripts` command selects the bundled script with id `convert-to-cbz`
- **AND** the compatibility form routes to the same runner used by `chc scripts run convert-to-cbz`

#### Scenario: Script flag
- **WHEN** the user runs `chc scripts --script convert-to-cbz`
- **THEN** the `scripts` command selects the bundled script with id `convert-to-cbz`
- **AND** the compatibility form routes to the same runner used by the canonical `run` operation

#### Scenario: Unknown script id
- **WHEN** the requested script id does not match a discovered script
- **THEN** the command fails with an `unknown_selection` command error

### Requirement: Interactive Script Prompt
The canonical `scripts run` operation SHALL prompt for script selection only when no script id is provided and the shared context is interactive.

#### Scenario: Interactive selection
- **WHEN** a user runs `chc scripts run` without a script id and the context is interactive
- **THEN** the command shows the existing script selection prompt using the shared discovered catalog

#### Scenario: Non-interactive missing script id
- **WHEN** a user runs `chc scripts run` without a script id and the context is non-interactive
- **THEN** the command fails without prompting and sets a non-zero exit code

### Requirement: Bundled Script Invocation Contract
The `scripts` command SHALL invoke discovered bundled script default exports from runtime-compatible prebuilt output with parsed script arguments and a bundled script context containing the shared CLI context. Installed CLI execution MUST NOT depend on the supported Node runtime importing repository TypeScript source files.

#### Scenario: Arguments are forwarded
- **WHEN** the user runs `chc scripts convert-to-cbz --input ./samples --format jpg`
- **THEN** `convert-to-cbz` receives `input` and `format` in its args object

#### Scenario: Context is forwarded
- **WHEN** a bundled script is invoked by the `scripts` command
- **THEN** the script receives a context object whose `cli` field is the shared CLI context

#### Scenario: Installed Node execution
- **WHEN** a local or managed installation runs `chc scripts run convert-to-cbz --input ./samples`
- **THEN** the supported Node runtime loads a packaged JavaScript entry for `convert-to-cbz`
- **AND** execution does not fail because an internal TypeScript module cannot be resolved

#### Scenario: Discovery and execution remain consistent
- **WHEN** the bundled-script catalog exposes a built-in script id
- **THEN** the CLI build provides one executable packaged entry for that id
- **AND** automated validation fails if the manifest catalog and packaged execution registry diverge

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
The `convert-to-cbz` bundled script SHALL emit a conversion summary object when the shared context has JSON output mode enabled and SHALL terminate deterministically after success or deliberate command-error output.

#### Scenario: Successful JSON conversion
- **WHEN** `chc scripts convert-to-cbz --input ./samples --json` completes successfully
- **THEN** stdout contains one JSON object with `ok: true`, `command: "scripts"`, `script: "convert-to-cbz"`, and a `summary` object

#### Scenario: Empty input JSON conversion completes
- **WHEN** `chc scripts convert-to-cbz --input <empty-directory> --json` finds no convertible files
- **THEN** stdout contains one parseable JSON summary with `totalFiles: 0` and the process exits successfully without prompting or hanging

#### Scenario: Human completion card
- **WHEN** `convert-to-cbz` completes successfully without JSON mode
- **THEN** it renders the existing human completion card

#### Scenario: JSON conversion failure
- **WHEN** `convert-to-cbz` fails in JSON mode with a deliberate command error
- **THEN** stdout contains one JSON object with `ok: false` and no human completion card

### Requirement: Bundled script lifecycle observability
Bundled script execution SHALL emit safe lifecycle diagnostics through the shared CLI diagnostics contract and SHALL clean up progress and diagnostic resources on success, zero-work, and failure paths.

#### Scenario: Script start is observable
- **WHEN** a bundled script starts executing
- **THEN** diagnostics identify the script id, execution mode, and safe argument summary without printing unbounded argument payloads

#### Scenario: Script progress stays JSON-safe
- **WHEN** a bundled script reports progress while JSON mode is enabled
- **THEN** progress diagnostics are kept off JSON stdout and do not prevent the final JSON result from being parseable

#### Scenario: Script diagnostics are cleaned up
- **WHEN** a bundled script completes with zero work, succeeds after work, or fails with a deliberate command error
- **THEN** progress loggers and diagnostics are flushed or stopped so the spawned CLI process can exit

### Requirement: Bundled Script Catalog Discovery
The `scripts` command group SHALL expose the discovered bundled-script catalog through group help and an explicit `list` operation using the same catalog used for completion, selection, and execution.

#### Scenario: Bare scripts group help
- **WHEN** a user runs `chc scripts` or `chc scripts --help`
- **THEN** stdout presents the public `list` and `run` operations
- **AND** includes an `AVAILABLE SCRIPTS` section with discovered script ids, titles, and descriptions
- **AND** exits successfully without running a bundled script

#### Scenario: Human script listing
- **WHEN** a user runs `chc scripts list`
- **THEN** stdout lists discovered script ids, titles, and descriptions
- **AND** the listed entries come from the same catalog used by script execution

#### Scenario: JSON script listing
- **WHEN** a user runs `chc scripts list --json`
- **THEN** stdout contains exactly one success JSON value with `command: "scripts list"` and bounded script metadata
- **AND** no human catalog text is written to stdout

#### Scenario: Reserved script operation ids
- **WHEN** a bundled script manifest declares `list` or `run` as its script id
- **THEN** discovery rejects or clearly warns about the reserved id
- **AND** static group operations remain unambiguous
