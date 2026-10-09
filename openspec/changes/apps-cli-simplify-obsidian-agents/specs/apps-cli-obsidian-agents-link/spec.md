## MODIFIED Requirements

### Requirement: Interactive vault agents setup
The CLI SHALL provide `chc obsidian agents setup` as an interactive workflow that creates or edits a machine-local configuration identified by its vault path, without asking users to enter a profile ID. The CLI SHALL accept `--vault` for explicit selection and SHALL reject the removed `--profile` option with guidance to use `--vault`.

#### Scenario: First-time setup uses the visible vault directory
- **WHEN** the user runs setup without an explicit vault
- **THEN** the command prompts for the Obsidian vault path without prompting for a profile ID
- **AND** it proposes `<vault>/Agents` as the visible source directory
- **AND** it derives `<vault>/.agents` as the compatibility path
- **AND** it previews filesystem changes before requesting confirmation

#### Scenario: Existing setup can be changed
- **WHEN** setup selects a vault that is already configured
- **THEN** it displays that vault's configured source and compatibility link
- **AND** it allows the user to keep or change the visible source
- **AND** it validates and previews replacement topology before changing links or directories
- **AND** it updates that vault's configuration without creating a duplicate or selecting another vault implicitly

#### Scenario: Different vault is configured independently
- **WHEN** setup selects a different canonical vault path
- **THEN** it creates a separate configuration without modifying configurations or links for other vaults

#### Scenario: Missing setup is actionable
- **WHEN** a command requires a configured vault but the selected vault is not configured
- **THEN** the CLI reports that setup is required and points to `chc obsidian agents setup --vault <path>`
- **AND** it does not infer a vault from the working directory and mutate it silently

#### Scenario: Non-interactive setup needs a vault
- **WHEN** setup runs non-interactively without `--vault`
- **THEN** it reports that `--vault` is required instead of selecting a default configuration

#### Scenario: Removed profile option is actionable
- **WHEN** setup or status is invoked with `--profile`
- **THEN** it rejects the option without mutation and explains that vault paths now identify configurations

### Requirement: Machine-local profile persistence
The CLI SHALL persist machine-specific vault and source paths under the local CthuTool data directory, identify configurations by canonical vault path, and keep local configuration out of the synchronized source. It SHALL NOT persist user-authored profile IDs or an implicit default profile.

#### Scenario: Profile is saved atomically
- **WHEN** setup completes successfully
- **THEN** the selected canonical vault path and visible source path are stored atomically
- **AND** the compatibility path is derived from the selected vault

#### Scenario: Equivalent paths identify one configuration
- **WHEN** setup reaches an existing vault through a symlink or equivalent normalized path
- **THEN** it reuses the configuration for the same real vault directory
- **AND** two different real vaults with the same directory basename remain distinct

#### Scenario: A different machine uses a different absolute vault path
- **WHEN** another machine configures the same synced vault at a different absolute path
- **THEN** setup stores that machine's local paths independently
- **AND** no absolute path configuration file is written under the visible source

#### Scenario: Current link configurations remain usable
- **WHEN** a valid version-2 ID-keyed link configuration is loaded
- **THEN** its vault and source paths are interpreted as path-identified configurations without filesystem migration
- **AND** a read-only status invocation does not rewrite the configuration file
- **AND** the next successful setup persists the new format without IDs or default selection

#### Scenario: Unavailable vault can still be inspected
- **WHEN** a previously configured vault directory is missing
- **THEN** unfiltered status still includes its stored path and reports the missing directory

#### Scenario: Git-era configuration is unsupported
- **WHEN** a version-1 configuration is loaded
- **THEN** the CLI reports the unsupported format with instructions to save a backup and rerun setup using a fresh local configuration
- **AND** it does not migrate Git-era configuration or mutate vault contents

## ADDED Requirements

### Requirement: Safe link creation and repair without directory migration
Setup SHALL preserve existing content while creating or repairing links, SHALL NOT adopt or migrate a real `.agents` directory, and SHALL NOT inspect or manage Git metadata.

#### Scenario: Real `.agents` directory blocks setup
- **WHEN** `<vault>/.agents` is a real directory, whether empty or non-empty
- **THEN** setup stops before making filesystem or configuration changes
- **AND** it reports the occupied path and asks the user to relocate the directory manually before retrying
- **AND** it does not move, remove, or merge its contents

#### Scenario: Existing visible source receives a missing link
- **WHEN** the visible source already contains files and `<vault>/.agents` is absent
- **THEN** setup preserves source contents
- **AND** it ensures `skills/` and `state/` exist and creates and verifies the missing link after confirmation

#### Scenario: Incorrect link is not replaced silently
- **WHEN** `<vault>/.agents` is a link whose resolved target differs from the configured source
- **THEN** setup reports the current and expected targets
- **AND** it requires explicit confirmation before replacing only the link
- **AND** it does not delete or modify the old target

#### Scenario: Interrupted link creation remains recoverable
- **WHEN** link creation or repair fails
- **THEN** setup reports the observed filesystem state and leaves source content accessible
- **AND** a later setup run can inspect and repair the topology without assuming the previous step completed

#### Scenario: Git metadata has no special behavior
- **WHEN** the visible source contains `.git` metadata
- **THEN** setup and status treat it as unrelated content without inspecting, migrating, deleting, or reporting it

## MODIFIED Requirements

### Requirement: Read-only topology status
The CLI SHALL provide `chc obsidian agents status` as a non-interactive, read-only view of all configured vaults, or one vault selected with `--vault`. Human output SHALL provide a compact overview, clearly separated vault sections, textual health labels, aligned details, and actionable diagnostics. It SHALL NOT display profile IDs, legacy Git diagnostics, synchronization consistency fields, or constant synchronization warnings.

#### Scenario: Healthy topology is reported
- **WHEN** the selected vault, visible source, compatibility link, skills, and state directories are valid
- **THEN** status reports a healthy summary and a vault section containing the full vault and source paths, compatibility link path, link type, resolved target, and content directory checks
- **AND** no warning is printed for the healthy vault

#### Scenario: All vaults are shown by default
- **WHEN** status runs without `--vault`
- **THEN** it reports every configured vault in deterministic path order with total, healthy, and attention-needed counts
- **AND** it uses the same section layout for one or many vaults without implicit default selection

#### Scenario: Explicit vault filters status
- **WHEN** status runs with a configured vault path or an equivalent path alias
- **THEN** it reports only the matching vault
- **AND** an unknown path produces an actionable setup-required result without falling back to another vault

#### Scenario: Broken or missing link is reported
- **WHEN** a compatibility link is absent, broken, or targets another directory
- **THEN** status reports the precise issue and a setup repair command for that vault
- **AND** it does not modify the filesystem

#### Scenario: Real directory receives appropriate guidance
- **WHEN** the compatibility path is occupied by a real directory
- **THEN** status reports the conflict and instructs the user to relocate it manually before setup

#### Scenario: Empty configuration is actionable
- **WHEN** no configurations exist
- **THEN** status shows a concise empty state and a setup command without an empty table or success badge

#### Scenario: Terminal output remains readable
- **WHEN** paths contain spaces or non-ASCII text or output is displayed in a narrow terminal
- **THEN** all paths and diagnostics remain readable without truncating repair-critical information
- **AND** wrapping and alignment account for displayed character width

#### Scenario: Color and quiet preferences are respected
- **WHEN** color is disabled or output is redirected
- **THEN** the output remains readable without relying on color and default redirected output contains no ANSI styling or terminal control sequences
- **AND** `--quiet` suppresses human status output

#### Scenario: JSON status is stable and non-mutating
- **WHEN** status runs with `--json`
- **THEN** it returns one stable envelope with `result.vaults` as an array for zero, one, or many vaults, plus summary counts
- **AND** each vault entry contains path identity, topology, content directory checks, health, and actual local issues
- **AND** the result contains no profile ID, legacy, consistency, or constant synchronization-warning fields and no human presentation text or ANSI styling
- **AND** it does not create directories, rewrite configuration, repair links, invoke Obsidian, or perform network operations

### Requirement: Obsidian-owned synchronization boundary
The feature SHALL rely on Obsidian Sync to transport the visible source and SHALL NOT add an automatic Git or Hook synchronization workflow. Setup and status SHALL report local topology only without presenting constant synchronization reminders or claiming remote synchronization completion.

#### Scenario: Normal Skill work performs no CthuTool sync phase
- **WHEN** a Skill is invoked from the configured vault or writes shared state
- **THEN** CthuTool does not fetch, commit, push, or acquire a synchronization lock
- **AND** no CthuCodex before-turn or end-of-turn Hook is required by this feature

#### Scenario: Synchronization guarantees are reported accurately
- **WHEN** setup or status succeeds
- **THEN** it does not emit `consistency` or constant eventual-consistency warnings
- **AND** it does not claim another machine has uploaded or downloaded the latest file

## REMOVED Requirements

### Requirement: Safe adoption, migration, and repair
**Reason**: Real `.agents` directory adoption and migration are explicitly removed. Link creation and repair remain covered by the new requirement without directory migration or Git-specific handling.
**Migration**: Users with a real `.agents` directory must relocate its contents manually before running setup. Existing correct links and visible source directories continue to work.
