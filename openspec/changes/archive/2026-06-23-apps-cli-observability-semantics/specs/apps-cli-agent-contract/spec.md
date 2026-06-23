## ADDED Requirements

### Requirement: CLI diagnostics output contract
The shared CLI context SHALL expose enough mode information for commands to emit diagnostics without violating interactivity, quiet mode, or JSON stdout contracts.

#### Scenario: JSON stdout remains parseable
- **WHEN** a JSON-enabled command emits diagnostics
- **THEN** those diagnostics are kept off stdout and the command still writes exactly one parseable JSON value to stdout

#### Scenario: Quiet mode suppresses nonessential diagnostics
- **WHEN** quiet mode is enabled
- **THEN** nonessential info and progress diagnostics are suppressed while errors remain available through the command error model
