## ADDED Requirements

### Requirement: CLI browser auth non-ownership
The CLI SHALL NOT create, store, export, upload, or verify third-party browser login state for backend browser automation.

#### Scenario: Login command is unavailable
- **WHEN** a user invokes a legacy CLI command that previously opened a browser login or created an auth bundle
- **THEN** the CLI reports that browser login is managed by CthuDesktop and does not create or upload auth state

#### Scenario: CLI lists browser state
- **WHEN** a user invokes a supported CLI browser status command
- **THEN** the CLI reads backend APIs and reports site configuration, public profile summaries, or pending auth tasks without accessing local browser cookies or storage

#### Scenario: JSON output remains machine-readable
- **WHEN** a supported CLI browser status command runs with `--json`
- **THEN** stdout contains one parseable JSON object and does not include raw cookies, localStorage values, or storage-state contents
