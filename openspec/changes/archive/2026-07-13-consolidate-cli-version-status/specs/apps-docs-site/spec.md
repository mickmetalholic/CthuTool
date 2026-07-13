## MODIFIED Requirements

### Requirement: Client installation documentation
The docs site SHALL document how users install, inspect, update, and remove CthuTool client tools on client computers using the canonical CLI lifecycle interface.

#### Scenario: Reader installs CLI tooling
- **WHEN** a reader opens CLI installation documentation
- **THEN** the documentation explains target-machine prerequisites, public raw installer usage, committed bundle runtime behavior, remote install mode, local checkout install mode, automatic zsh completion behavior, and supported override environment variables

#### Scenario: Reader checks the installed CLI version
- **WHEN** a reader needs only the installed CLI version
- **THEN** the documentation presents `chc --version` as the canonical version-only entry point
- **AND** it does not present the legacy `chc version` compatibility alias as a canonical command

#### Scenario: Reader inspects installed CLI tooling
- **WHEN** a reader needs to inspect CLI installation state
- **THEN** the documentation explains that `chc status` includes the installed version and reports the detected local or remote source checkout
- **AND** it documents the explicit install-directory override

#### Scenario: Reader manages installed CLI tooling
- **WHEN** a reader needs to update CLI tooling
- **THEN** the documentation presents `chc update` as the update command
