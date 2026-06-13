## ADDED Requirements

### Requirement: PowerShell word boundary preservation
The PowerShell completion adapter SHALL preserve command-position boundaries when completing command candidates.

#### Scenario: Partial root command advances to next word
- **WHEN** PowerShell completion is requested for `chc browse`
- **THEN** the candidate for `browser` completes the active word as `browser ` with a trailing space
- **AND** a subsequent completion request is positioned after `browser` rather than replacing `browser`

#### Scenario: Completed parent command does not get replaced by child command
- **WHEN** PowerShell completion is requested for `chc browser`
- **THEN** the candidate for `browser` completes the active word as `browser ` with a trailing space
- **AND** it does not replace `browser` with `auth`, `doctor`, or `install`

#### Scenario: Nested subcommands are offered after parent command boundary
- **WHEN** PowerShell completion is requested for `chc browser `
- **THEN** candidates include `auth`, `doctor`, and `install`
- **AND** those candidates are inserted after `browser` rather than replacing `browser`

### Requirement: PowerShell empty current-word transport
The PowerShell completion adapter SHALL reliably communicate an empty current word to `chc __complete` even when the global `chc` command is reached through a Windows command shim.

#### Scenario: Empty current word survives command shim invocation
- **WHEN** PowerShell completion is requested after a trailing space such as `chc browser `
- **THEN** the adapter passes an internal empty-word marker to `chc __complete`
- **AND** `chc __complete` interprets that marker as an empty current word before computing candidates

#### Scenario: Direct current-word completion remains distinct
- **WHEN** `chc __complete browser` is invoked without an empty current-word marker
- **THEN** completion treats `browser` as the current word prefix
- **AND** it does not return child commands for `browser`
