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

### Requirement: Configuration files delegate adoption and merging to chezmoi
`chc dotfiles config add <path...>` SHALL require a valid saved binding and explicit regular home file paths. It SHALL delegate ordinary file import and source attribute mapping to `chezmoi add`, without forcing template replacement. Existing templates SHALL use `chezmoi merge` with the user's configured merge tool in an interactive terminal. Imports SHALL remain reviewable source changes without implicitly invoking apply, installation, Notion synchronization, or Git publication. Credentials, SSH configuration/private keys and Git identity SHALL remain outside adoption. Native Git auto-add/commit/push MUST be disabled before adoption. Init MAY offer the same selected-file entry point; leaving files unapplied SHALL NOT make a successful binding fail.

#### Scenario: Adopting a regular file
- **WHEN** a bound machine explicitly selects regular home files for config add
- **THEN** chc validates paths and saves private backups before delegating import to chezmoi add
- **AND** chezmoi handles source paths and attributes without a handwritten mapping or chc adoption receipt

#### Scenario: Reconciling a template
- **WHEN** an existing template is selected interactively
- **THEN** chc opens chezmoi merge using the user's configured tool and inherited terminal
- **AND** the user merges into the source template and reviews the resulting Git diff without an automatic home apply

#### Scenario: Template merging requested through JSON
- **WHEN** a template is selected without interactive input or with JSON output
- **THEN** the command reports that interactive merge is required before any selected source file changes
- **AND** no editor or prompt starts

#### Scenario: Rejecting unsafe adoption inputs
- **WHEN** a selected path is missing, outside home, a directory, a private credential or an SSH/Git identity file
- **THEN** the selected batch is rejected before source mutation

### Requirement: Apply uses native conflict state with bounded safeguards
Chezmoi SHALL own applied-file state and conflict decisions. Chc SHALL NOT maintain adoption receipts, source/target approval digests, or a separate conflict decision store. Interactive config apply SHALL back up existing targets and delegate to native apply with less-interactive prompting, including pre-existing targets; it SHALL NOT force overwrite. Users may diff, overwrite, skip or quit using native prompts. Interactive application follows chezmoi's sequential semantics: already confirmed targets may have changed when a later target is skipped, cancelled or fails. Noninteractive/JSON apply SHALL first run native dry-run with error-on-conflict and no TTY, and SHALL fail before home writes on an existing conflict. Both phases SHALL retain conflict checks; an edit after preflight MUST NOT be force-overwritten. Unmanaged home files SHALL remain untouched.

#### Scenario: Existing local content on first apply
- **WHEN** a selected target already exists and differs from the desired state
- **THEN** interactive apply asks through chezmoi before replacement and can skip that target
- **AND** noninteractive apply reports failed native preflight without writing selected home targets

#### Scenario: A local edit after a previous application
- **WHEN** the user changes a managed file locally
- **THEN** native chezmoi state detects the local modification on the next apply
- **AND** no chc receipt or forced overwrite bypasses that conflict

#### Scenario: Repository-only update
- **WHEN** the source changes and the local target still matches chezmoi's last applied state
- **THEN** native apply can update it normally without a separate adoption approval

#### Scenario: Preserving local SSH mappings
- **WHEN** bootstrap or the user already configured SSH
- **THEN** the native create-only SSH source leaves that configuration intact
- **AND** it creates the default configuration only when absent, without reading the destination back into a self-referential template

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
