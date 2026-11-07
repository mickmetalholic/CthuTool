# apps-cli-dotfiles-host-binding Specification

## Purpose

Bind a physical machine to a canonical host definition already published from Notion, keeping local identity and the configuration source stable without creating a second place to author machine software plans.

## Requirements

### Requirement: Init binds only published host identities
The host-selection portion of `chc dotfiles init` SHALL select an existing canonical Host ID from the local published snapshot and persist only the local binding and source location. It SHALL NOT author local host plans, override software/toolsets/shell/terminal definitions, create Notion hosts, or synchronize automatically. Explicit host selection SHALL support unattended binding without interactive prompts.

Init SHALL be the only command that persists a selected Host ID. Rerunning init with an explicit host SHALL update the binding after validation. An explicit `--host` on env setup, env doctor, config diff, or config apply SHALL select only that invocation's compatible host without replacing the saved binding. Config add SHALL use the saved binding and SHALL NOT select or persist another host.

#### Scenario: Binding a known machine
- **WHEN** the user selects a compatible published host
- **THEN** init stores its canonical ID and presents the resolved Notion-managed plan
- **AND** Notion definitions and repository snapshots remain unchanged

#### Scenario: A new host is not yet published
- **WHEN** no published host matches the desired machine
- **THEN** init explains how to define and activate the host in Notion, publish a reviewed snapshot, update this checkout, and rerun binding
- **AND** it does not create an alternate local plan

#### Scenario: Selecting a host for one diagnostic
- **WHEN** env doctor is invoked with an explicit compatible Host ID different from the saved binding
- **THEN** the result describes the explicitly selected host
- **AND** the saved binding remains unchanged

### Requirement: Host binding validates operating system and identity
Binding SHALL reject host/OS mismatches and ambiguous aliases, and SHALL distinguish WSL Linux from native Windows. Legacy aliases and physical hostnames SHALL be migration hints only; a successful binding MUST persist the reviewed canonical ID rather than an inferred alias.

#### Scenario: Selecting Windows from WSL
- **WHEN** init is run inside WSL and the selected definition is native Windows
- **THEN** binding fails with guidance to select a Linux/WSL definition
- **AND** the previous binding is preserved

#### Scenario: Migrating an ambiguous legacy hostname
- **WHEN** a legacy name resolves to multiple hosts or has no reviewed canonical mapping
- **THEN** migration requires explicit compatible selection instead of silently assigning a host

### Requirement: Unbound machines have no implicit install plan
Host-dependent installation and application SHALL require a valid binding or an explicit valid host argument. Unbound or unknown hosts SHALL NOT receive a generic default software plan. Host-neutral validation and diagnostics SHALL remain available with the binding problem clearly reported.

#### Scenario: Running setup before binding
- **WHEN** an unbound machine runs env setup
- **THEN** env setup reports the missing binding and the init command
- **AND** no software is installed

### Requirement: Configuration source remains stable across CLI source switches
The system SHALL maintain one authoritative local binding in chezmoi configuration, including a fixed sourceDir for the chosen CthuTool checkout. Switching the executable with `chc source use` SHALL NOT silently change the home configuration source or bound host.

#### Scenario: Switching the CLI to a development worktree
- **WHEN** the CLI executable is relinked to another worktree
- **THEN** dotfiles operations continue using the bound sourceDir
- **AND** an unavailable or incompatible bound source produces an actionable error without fallback mutation

### Requirement: Existing chezmoi sources require deliberate migration
`init` SHALL prepare required dotfiles tooling and a selected source without applying home configuration. It SHALL select a host when unbound and preserve a valid existing binding unless another host is explicitly selected. Rerunning init SHALL allow existing local configuration to be reconciled through the same entry point. It SHALL support explicit source and host inputs; unattended first initialization without a valid binding MUST require an explicit host instead of prompting. It MUST detect an existing different chezmoi source, preserve its configuration and source files, and require an explicit migration option before changing sourceDir. A successful migration SHALL retain a recoverable prior configuration and validate the new canonical binding before replacement.

#### Scenario: Rerunning initialization on a bound machine
- **WHEN** init runs with a valid existing binding and no new host selection
- **THEN** the current host is preserved while configuration reconciliation remains available
- **AND** no package setup or home apply runs

#### Scenario: Initializing an unattended machine
- **WHEN** init runs noninteractively without a saved binding or explicit host
- **THEN** it reports the required host input without waiting for interaction
- **AND** it does not assign a default host

#### Scenario: Discovering another managed source
- **WHEN** init finds a different sourceDir without an explicit migration option
- **THEN** it reports the conflict and migration command
- **AND** leaves the source, binding, and home files unchanged

#### Scenario: Migrating a legacy dotfiles source
- **WHEN** the user explicitly migrates the recognized legacy source and selects a valid host
- **THEN** the new binding and sourceDir are saved with a recoverable previous configuration
- **AND** no home apply, package setup, or runtime installation runs automatically

### Requirement: Init makes environment preparation visible
Init SHALL display its detected OS/architecture/WSL context and running Node version, then report checks of chezmoi and mise. For each tool it SHALL state whether the installation is reused or missing, name the selected installer before installation, and report the available executable path and observed version when obtainable. Version probing SHALL be observational and SHALL NOT introduce automatic upgrades or replace native source compatibility enforcement. Quiet mode SHALL suppress progress. JSON mode SHALL return structured environment/tool results within the existing single-result contract without human progress text.

#### Scenario: Existing tools are reused
- **WHEN** init finds chezmoi and mise already available
- **THEN** human output shows their paths, observed versions and reuse decisions before binding
- **AND** no reinstall or automatic upgrade runs

#### Scenario: A required tool is missing
- **WHEN** init must install a tool
- **THEN** it prints the selected platform installer before running it and reports the installed executable on success
- **AND** a failed installation retains the preceding progress and an actionable error

#### Scenario: JSON or quiet environment reporting
- **WHEN** init runs with JSON or quiet output
- **THEN** human check/install progress is suppressed
- **AND** successful JSON includes structured environment/tool results in one stdout value
