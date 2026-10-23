## Purpose

Provide CthuTool's TypeScript dotfiles commands with a complete, versioned software and host model, preserving the latest repository's behavior while keeping installation and home configuration explicit and reviewable.

## ADDED Requirements

### Requirement: Dotfiles commands use the shared CLI contract
The CLI SHALL expose only `init` and the `env`, `config`, and `notion` groups directly under `chc dotfiles`. Env SHALL expose setup and doctor for software installation and diagnostics; config SHALL expose add, diff, and apply for home configuration; notion SHALL expose auth, diff, pull, and the advanced offline validate command for Notion-authored plan data. These commands SHALL use shared command discovery, help, completion, and error/output conventions. Initialization and host selection SHALL share init; the old flat operation aliases SHALL NOT be exposed. Bare groups and help/completion SHALL NOT authenticate, access Notion, or modify local state.

#### Scenario: Discovering the command group
- **WHEN** the user requests root help, dotfiles help, or completion
- **THEN** the public dotfiles commands are discoverable without a Token or a bound host
- **AND** no onboarding or synchronization starts

#### Scenario: Choosing a responsibility from root help
- **WHEN** the user invokes `chc dotfiles` without a subcommand
- **THEN** help presents init and the three groups with software-environment, configuration-file, and plan-data descriptions
- **AND** leaf operations are discovered through their corresponding group instead of duplicated flat aliases

#### Scenario: Distinguishing configuration and machine comparisons
- **WHEN** the user requests help for notion diff, config diff, notion validate, or env doctor
- **THEN** help explains that notion diff compares Notion with the local snapshot, config diff compares rendered templates with home files, notion validate checks configuration integrity, and env doctor checks actual machine health

### Requirement: Runtime and synchronization share a lossless validated model
The system SHALL validate a versioned model shared by runtime commands and Notion export. It MUST preserve package/runtime classification, software kind, platform ownership and installation handlers, health checks and severity, pinned releases and checksums, service configuration, host aliases, toolsets, explicit tools, and exclusions from the migration baseline. Unknown or conflicting model fields, unsupported schema versions, and invalid references SHALL fail before system or snapshot mutation.

#### Scenario: Validating current service and release configuration
- **WHEN** the published model contains CTHULHU's k3s service and pinned official k9s release
- **THEN** validation and planning retain their versions, ownership, service health, kubeconfig policy, and architecture-specific artifacts
- **AND** synchronization does not reduce them to package names

#### Scenario: Rejecting incomplete models
- **WHEN** a model field is unsupported or a host references a missing toolset
- **THEN** validation reports the location and reason
- **AND** setup does not install anything

### Requirement: Published snapshots support operation without Notion access
Setup planning, configuration rendering, doctor, and validate SHALL consume the published local snapshot without requiring a Notion Token or making Notion requests. Network access for explicitly requested package or runtime operations SHALL remain independent of Notion authentication.

#### Scenario: Working without Notion credentials
- **WHEN** a bound machine has a valid local snapshot and runs setup dry-run or doctor without a Token
- **THEN** its software plan and diagnostics are derived from that snapshot without an authentication prompt

### Requirement: Installation and configuration application are explicit operations
`env setup --dry-run` SHALL report the resolved platform plan without mutating the machine. `env setup` SHALL install only selected, supported, tool-owned software using the declared platform policy. It SHALL NOT implicitly apply home templates or install mise-managed runtimes. `config diff` SHALL preview home changes, and `config apply` SHALL explicitly delegate their application to chezmoi. Diagnostics SHALL distinguish blocking, optional, and manual checks.

An initialized machine SHALL be able to invoke apply independently of setup. Apply SHALL NOT import local configuration into the repository or synchronize Notion.

#### Scenario: Reviewing before installing
- **WHEN** a bound host runs setup dry-run
- **THEN** output explains selected tools, installation methods, externally owned tools, and unsupported/manual actions
- **AND** no installer, service change, runtime installation, or chezmoi apply runs

#### Scenario: Separating setup and apply
- **WHEN** setup completes
- **THEN** configuration application and mise runtime installation remain explicit next steps
- **AND** repeated setup avoids reinstalling tools whose declared desired state is already satisfied

#### Scenario: Applying configuration without reinstalling software
- **WHEN** an initialized, bound machine with resolved local conflicts invokes apply without invoking setup
- **THEN** only the selected home configuration is applied
- **AND** no software installer, mise install, or Notion operation runs

### Requirement: Configuration files have a focused adoption entry point
`chc dotfiles config add <path...>` SHALL compare explicitly selected home files with the bound source's rendered configuration and provide choices to import or merge local configuration into reviewable source changes, use the repository version on a later config apply, or defer the conflict while leaving the local file untouched. Init SHALL be able to delegate first-time file reconciliation to the same behavior. Config add SHALL require a valid binding, SHALL NOT alter that binding, and SHALL NOT bulk-import the home directory. Existing source templates MUST NOT be replaced with rendered machine-specific content automatically. Credentials, SSH private keys, and Git identity SHALL remain outside adoption. Imports SHALL NOT change Notion-managed software/host data or commit/push changes.

#### Scenario: Adopting a file after initialization
- **WHEN** a bound machine invokes config add for its shell configuration
- **THEN** the file is compared, backed up, and explicitly resolved into reviewable source changes
- **AND** the machine's binding, installed software, and home file remain unchanged

#### Scenario: Missing adoption targets
- **WHEN** config add is invoked without a target path
- **THEN** it reports the required input without scanning or importing the home directory

#### Scenario: An existing machine meets a newly initialized repository
- **WHEN** init finds an existing shell configuration differing from the source template
- **THEN** it presents the difference and backs up the selected local file before accepting a resolution
- **AND** an approved import or merge produces reviewable repository changes without applying home configuration

#### Scenario: Deferring a local conflict
- **WHEN** the user defers a differing existing file during init
- **THEN** the local file remains unchanged and the pending conflict is reported
- **AND** apply refuses to overwrite that unresolved file

### Requirement: Apply protects existing local content
Before writing selected home targets, apply SHALL preflight unresolved adoption conflicts and local edits, preserve a private recoverable backup of existing content to be overwritten, and refuse unresolved changes without partially applying the selected targets. Approved resolutions MUST be revalidated if the source or local files changed after review. Unattended execution SHALL fail on unresolved conflicts instead of assuming overwrite consent. Existing files absent from the managed target set SHALL remain untouched.

#### Scenario: Local configuration changes after initialization review
- **WHEN** a reviewed file is edited locally before apply
- **THEN** config apply reports the changed file and requests renewed reconciliation through config add or first-time init
- **AND** it writes none of the selected home targets

#### Scenario: A newly introduced template collides with a local file
- **WHEN** an updated snapshot introduces a managed target whose existing local content has not been reviewed
- **THEN** apply reports the adoption conflict without overwriting it
- **AND** unrelated unmanaged home files remain untouched

### Requirement: Service handling preserves baseline boundaries
Service installation and health behavior SHALL preserve the baseline's fresh-install safeguards, version checks, and kubeconfig access policy. Existing clusters SHALL NOT be reset, replaced, or downgraded implicitly. Dotfiles setup SHALL NOT install Kubernetes workloads or configure GitOps.

#### Scenario: Encountering an existing k3s installation
- **WHEN** setup finds an existing cluster whose state requires operator action
- **THEN** it reports the required action instead of running a fresh-install or destructive replacement path

### Requirement: Home configuration migration preserves user identity and completion
CthuTool SHALL read Git identity from Git and SHALL NOT maintain or overwrite `user.name` or `user.email`. Moving away from the old Git template MUST preserve existing identity and unrelated Git configuration. Reapplying managed shell profiles SHALL preserve a single functional CthuTool completion integration when enabled.

#### Scenario: Migrating a populated Git configuration
- **WHEN** an existing machine migrates from the old managed Git template
- **THEN** its Git identity and unrelated settings remain intact
- **AND** any optional managed Git settings are isolated through an explicit include

#### Scenario: Applying an enabled completion profile repeatedly
- **WHEN** the user enables completion and subsequently applies dotfiles more than once
- **THEN** completion remains functional with no duplicate initialization blocks
