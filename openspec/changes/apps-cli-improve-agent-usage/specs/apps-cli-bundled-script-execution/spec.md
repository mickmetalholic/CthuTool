## ADDED Requirements

### Requirement: Read-only script-specific help
The CLI SHALL render optional help owned by a discovered script when the user requests help for that script through canonical or supported compatibility selection forms. Help SHALL remain usable without invoking the script, prompting, creating output directories, or checking conversion dependencies.

#### Scenario: Conversion help is requested
- **WHEN** a user runs `chc scripts run convert-to-cbz --help`
- **THEN** help identifies the script and documents input, output, overwrite, format, quality, DPI, file concurrency, EPUB concurrency, defaults, prerequisites, and an invocation example
- **AND** no conversion or filesystem output mutation occurs

#### Scenario: Compatibility help is requested
- **WHEN** a user selects the same script through the positional or `--script` compatibility form with `--help`
- **THEN** help renders the same script-specific information as canonical selection

#### Scenario: Script has no optional help
- **WHEN** help is requested for an existing script that supplies only the original id, title, and description metadata
- **THEN** the common runner help remains available without executing that script

#### Scenario: Listing remains bounded
- **WHEN** script-specific help metadata is present and `chc scripts list --json` runs
- **THEN** the original bounded id, title, and description catalog contract is preserved
