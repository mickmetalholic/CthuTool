## MODIFIED Requirements

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
