## ADDED Requirements

### Requirement: Browser host protocol correlation
CthuDesktop browser host SHALL consume protocol observability metadata from browser commands and include compatible metadata in browser results and errors.

#### Scenario: Command metadata reaches browser host
- **WHEN** CthuDesktop receives a browser command with observability metadata
- **THEN** the browser host makes that metadata available to local diagnostics without using it to change browser execution permissions

#### Scenario: Error preserves command correlation
- **WHEN** CthuDesktop returns a browser error
- **THEN** the error message preserves the command id and compatible observability metadata so backend diagnostics can correlate the failure
