## MODIFIED Requirements

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
