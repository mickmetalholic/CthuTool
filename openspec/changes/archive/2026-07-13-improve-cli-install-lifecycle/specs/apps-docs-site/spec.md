## MODIFIED Requirements

### Requirement: Client installation documentation
The docs site SHALL document how users install, update, and remove CthuTool client tools on client computers.

#### Scenario: Reader installs CLI tooling
- **WHEN** a reader opens CLI installation documentation
- **THEN** the documentation explains target-machine prerequisites, public raw installer usage, committed bundle runtime behavior, remote install mode, local checkout install mode, automatic zsh completion behavior, and supported override environment variables

#### Scenario: Reader inspects installed CLI tooling
- **WHEN** a reader needs to inspect CLI installation state
- **THEN** the documentation explains that `chc status` reports the detected local or remote source checkout
- **AND** it documents the explicit install-directory override

#### Scenario: Reader manages installed CLI tooling
- **WHEN** a reader needs to update CLI tooling
- **THEN** the documentation presents `chc update` as the update command
