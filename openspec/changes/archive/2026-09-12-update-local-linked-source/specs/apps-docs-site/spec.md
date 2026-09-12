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
- **THEN** the documentation presents `chc source update --check` and `chc source update` as source-aware managed update commands
- **AND** explains that repository and ref defaults follow the installed managed checkout

#### Scenario: Reader updates local-linked CLI tooling
- **WHEN** a reader uses a local-linked installation
- **THEN** the documentation explains that default `chc source update` checks and fast-forwards the linked local checkout without mutating the managed checkout or relinking the global command
- **AND** shows that locally edited CLI source still requires a committed-bundle rebuild
- **AND** shows how to restore the global command to remote managed mode explicitly

#### Scenario: Reader updates an explicit custom checkout
- **WHEN** a reader intentionally manages a non-default update checkout
- **THEN** the documentation explains the `--install-dir`, `--repo`, and `--ref` overrides and their environment equivalents
- **AND** warns that a successful explicit apply can relink the global command to that selected checkout
