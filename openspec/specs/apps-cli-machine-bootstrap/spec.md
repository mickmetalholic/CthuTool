# apps-cli-machine-bootstrap Specification

## Purpose

Start CthuTool onboarding from a machine without Git, Node, or chc by preparing the runtime and GitHub SSH first, then cloning the selected repository over SSH and handing configuration work to the installed TypeScript CLI.

## Requirements

### Requirement: Standalone bootstrap requires no preinstalled project tools
CthuTool SHALL publish standalone POSIX and PowerShell bootstrap scripts downloadable from GitHub Raw over HTTPS. With supported OS download/extraction facilities, the scripts SHALL prepare Git, OpenSSH, Node major 24, and npm before requiring `chc`. They SHALL NOT require an existing CthuTool checkout, Go, pnpm, Bun, or a local CLI build. Downloaded runtime artifacts MUST be verified against pinned checksums.

#### Scenario: Starting on a fresh supported machine
- **WHEN** the user downloads and executes the platform bootstrap without Git, Node, or chc
- **THEN** prerequisites are prepared before repository or CLI-dependent steps
- **AND** unsupported OS/architecture combinations stop with actionable guidance

#### Scenario: Reusing compatible prerequisites
- **WHEN** compatible Git/OpenSSH/Node 24/npm already exist
- **THEN** bootstrap reuses them without an unrelated system upgrade

### Requirement: GitHub SSH precedes repository cloning
Bootstrap SHALL prepare or reuse an appropriate SSH key without overwriting existing private keys, guide public-key registration when needed, and verify GitHub SSH authentication and repository read access before cloning. It SHALL preserve SSH host-key verification and SHALL NOT silently fall back to an HTTPS Git remote.

#### Scenario: Registering a new machine
- **WHEN** no usable GitHub SSH authentication exists
- **THEN** bootstrap helps prepare a key and displays only registration-safe public information
- **AND** cloning waits until SSH authentication and repository access succeed

#### Scenario: SSH authentication is unavailable unattended
- **WHEN** a noninteractive bootstrap cannot authenticate to GitHub over SSH
- **THEN** it exits with resumable setup guidance without waiting for browser/key-registration input
- **AND** it does not attempt an HTTPS clone

### Requirement: SSH checkout has a safe configurable default location
Bootstrap SHALL clone `git@github.com:mickmetalholic/CthuTool.git` to `~/Documents/GitHub/CthuTool` by default, with an explicit destination override. It SHALL safely reuse a matching checkout without resetting local changes, reject unrelated files or repositories at the destination, and preserve the SSH remote for subsequent source updates. Reconfiguring an existing HTTPS origin SHALL require an explicit option.

#### Scenario: Default first clone
- **WHEN** the default destination does not exist
- **THEN** bootstrap creates the parent directories and clones through SSH into the expanded home-relative path

#### Scenario: Destination contains unrelated files
- **WHEN** the chosen destination is occupied by unrelated content
- **THEN** bootstrap reports the collision and accepts an explicit alternative on a later run
- **AND** it neither deletes nor overwrites that content

#### Scenario: Rerunning with local changes
- **WHEN** a matching checkout already contains local changes
- **THEN** bootstrap preserves them and does not reset or silently pull over them

### Requirement: CLI installation uses the chosen checkout and committed bundle
Bootstrap SHALL install/link `chc` from the chosen checkout's committed distribution and make it usable under Node 24, including in a new terminal. It SHALL use that actual checkout for future default source updates, rather than cloning another hidden copy. Home files, Token cache, and user configuration MUST NOT become root-owned as a side effect of prerequisite installation.

#### Scenario: Installing from the default Documents checkout
- **WHEN** prerequisites and the SSH checkout are ready
- **THEN** bootstrap installs the committed CLI without building it on the machine
- **AND** `chc source status` identifies that checkout and its SSH remote

### Requirement: Onboarding delegates authentication and binding to TypeScript
After installing `chc`, bootstrap SHALL invoke the shared authentication flow through `chc dotfiles notion auth`, then dotfiles init for host binding and existing-configuration reconciliation. It SHALL NOT invoke a separate binding command or overwrite unresolved existing home files. It SHALL NOT implement a separate shell Token cache or software-plan editor. It SHALL NOT automatically pull Notion snapshots, install the host's software set, apply home configuration, or install mise runtimes.

#### Scenario: Completing initial binding
- **WHEN** the user completes authentication and selects a published compatible host
- **THEN** bootstrap reports the saved binding and explicit next commands for reviewing and applying the plan
- **AND** no package setup or home apply runs

### Requirement: Bootstrap is resumable and reports incomplete onboarding
Each stage SHALL recognize completed work safely. Authentication cancellation, API failure, or binding failure after CLI installation MUST preserve the installed prerequisites and checkout, report onboarding as incomplete, and provide commands to resume the failed stage. Noninteractive mode SHALL require explicit inputs or existing state for all otherwise interactive stages.

#### Scenario: Token entry is cancelled after installation
- **WHEN** the user cancels the shared authentication prompt
- **THEN** Git, Node, the SSH checkout, and chc remain available
- **AND** bootstrap reports the auth/init commands needed to resume without claiming completion
