## MODIFIED Requirements

### Requirement: Client installation documentation
The docs site SHALL document how users install, update, and remove CthuTool client tools on client computers.

#### Scenario: Reader installs CLI tooling
- **WHEN** a reader opens CLI installation documentation
- **THEN** the documentation explains target-machine prerequisites, public raw installer usage, committed bundle runtime behavior, remote install mode, local checkout install mode, and supported override environment variables

#### Scenario: Reader manages installed CLI tooling
- **WHEN** a reader needs to update CLI tooling
- **THEN** the documentation presents `chc update` as the primary update command
- **AND** it identifies `chc self-update` as a backwards-compatible alias

### Requirement: Module usage documentation
The docs site SHALL provide module-oriented usage documentation for major CthuTool product areas.

#### Scenario: Reader chooses CLI module
- **WHEN** a reader opens CLI module documentation
- **THEN** the documentation reflects the current install/update/runtime model and links to command reference and package-local development sources

## ADDED Requirements

### Requirement: CLI installer mode documentation
The docs site SHALL document CLI installer mode selection for user and development install paths.

#### Scenario: Reader compares remote and local mode
- **WHEN** a reader reviews CLI installation docs
- **THEN** the documentation explains that raw/stdin installer usage selects remote mode and checkout script execution selects local mode by default
- **AND** it documents `CHC_INSTALL_MODE=remote` as the way to restore the global command to the managed checkout after local development
