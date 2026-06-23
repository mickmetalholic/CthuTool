## ADDED Requirements

### Requirement: Bundled script lifecycle observability
Bundled script execution SHALL emit safe lifecycle diagnostics through the shared CLI diagnostics contract.

#### Scenario: Script start is observable
- **WHEN** a bundled script starts executing
- **THEN** diagnostics identify the script id, execution mode, and safe argument summary without printing unbounded argument payloads

#### Scenario: Script progress stays JSON-safe
- **WHEN** a bundled script reports progress while JSON mode is enabled
- **THEN** progress diagnostics are kept off JSON stdout and do not prevent the final JSON result from being parseable
