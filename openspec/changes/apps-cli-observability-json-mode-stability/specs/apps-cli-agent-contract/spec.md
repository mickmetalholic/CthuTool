## MODIFIED Requirements

### Requirement: JSON Stdout Contract
Commands that support JSON mode SHALL write exactly one parseable JSON value to stdout when `--json` is set and SHALL complete the process lifecycle deterministically after that value is written.

#### Scenario: Successful JSON command
- **WHEN** a JSON-enabled command completes successfully
- **THEN** stdout contains one JSON object with `ok: true`

#### Scenario: Expected command error in JSON mode
- **WHEN** a JSON-enabled command fails with a deliberate command error
- **THEN** stdout contains one JSON object with `ok: false` and an `error` object

#### Scenario: Diagnostics stay off JSON stdout
- **WHEN** warnings or diagnostics are produced while `--json` is set
- **THEN** those diagnostics are written to stderr and are not mixed into JSON stdout

#### Scenario: JSON command exits after output
- **WHEN** a JSON-enabled command writes its success or deliberate-error JSON value
- **THEN** the command resolves its command runner and exits without leaving active handles or child work that causes callers to time out
