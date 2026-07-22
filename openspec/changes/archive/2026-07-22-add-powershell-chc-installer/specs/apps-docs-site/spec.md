## MODIFIED Requirements

### Requirement: Client installation documentation
The docs site SHALL document how users install, inspect, safely update, switch, and remove CthuTool client tools on client computers using the canonical CLI lifecycle interface.

#### Scenario: Reader installs CLI tooling
- **WHEN** a reader opens CLI installation documentation
- **THEN** the documentation explains target-machine prerequisites, public Bash and PowerShell installer usage, committed bundle runtime behavior, remote install mode, local checkout install mode, automatic zsh and PowerShell completion behavior, and supported override environment variables

#### Scenario: Reader checks the installed CLI version
- **WHEN** a reader needs only the installed CLI version
- **THEN** the documentation presents `chc --version` as the canonical version-only entry point
- **AND** it does not present the legacy `chc version` compatibility alias as a canonical command

#### Scenario: Reader inspects installed CLI tooling
- **WHEN** a reader needs to inspect CLI installation state
- **THEN** the documentation explains that `chc status` includes the installed version and reports the detected local or remote source checkout
- **AND** it documents the explicit install-directory override

#### Scenario: Reader updates managed CLI tooling
- **WHEN** a reader needs to update a default remote managed installation
- **THEN** the documentation presents `chc update --check` and `chc update` as source-aware managed update commands
- **AND** explains that repository and ref defaults follow the installed managed checkout

#### Scenario: Reader updates local-linked CLI tooling
- **WHEN** a reader uses a local-linked installation
- **THEN** the documentation explains that default `chc update` does not mutate the local or managed checkout
- **AND** shows the manual Git and committed-bundle development workflow
- **AND** shows how to restore the global command to remote managed mode explicitly

#### Scenario: Reader updates an explicit custom checkout
- **WHEN** a reader intentionally manages a non-default update checkout
- **THEN** the documentation explains the `--install-dir`, `--repo`, and `--ref` overrides and their environment equivalents
- **AND** warns that a successful explicit apply can relink the global command to that selected checkout

### Requirement: CLI installer mode documentation
The docs site SHALL document CLI installer mode selection and its relationship to subsequent status and update behavior.

#### Scenario: Reader compares remote and local mode
- **WHEN** a reader reviews CLI installation docs
- **THEN** the documentation explains that raw stdin/expression installer usage selects remote mode and checkout script execution selects local mode by default
- **AND** explains that `chc status` derives mode from the checkout providing the running module
- **AND** explains that default automatic update is available only for the default managed source
- **AND** documents `CHC_INSTALL_MODE=remote` as the way to restore the global command to the managed checkout after local development
