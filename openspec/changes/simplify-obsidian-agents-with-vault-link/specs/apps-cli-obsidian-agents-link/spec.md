## Purpose

Provide guided, machine-local link setup so a visible Obsidian-synchronized
directory can expose vault-scoped Skills and state through the conventional
`.agents` path without a second Git synchronization system.

## ADDED Requirements

### Requirement: Interactive vault agents setup
The CLI SHALL provide `chc obsidian agents setup` as an interactive workflow
that creates or edits one machine-local Obsidian agents profile without
requiring hand-edited configuration.

#### Scenario: First-time setup uses the visible vault directory
- **WHEN** no valid profile exists and the user runs `chc obsidian agents setup`
- **THEN** the command prompts for the Obsidian vault path
- **AND** it proposes `<vault>/Agent` as the visible source directory
- **AND** it derives `<vault>/.agents` as the agent compatibility path
- **AND** it previews filesystem changes before requesting confirmation

#### Scenario: Existing setup can be changed
- **WHEN** a valid profile exists and the user runs setup again
- **THEN** the command displays the configured vault, visible source, and compatibility link
- **AND** it allows the user to keep or change the configured vault or visible source
- **AND** it validates and previews the replacement topology before changing links or directories

#### Scenario: Missing setup is actionable
- **WHEN** a command requires an Obsidian agents profile but none is valid
- **THEN** the CLI reports that setup is required
- **AND** it points to `chc obsidian agents setup`
- **AND** it does not infer a vault from the current working directory and mutate it silently

### Requirement: Machine-local profile persistence
The CLI SHALL persist machine-specific vault and source paths under the local
CthuTool data directory and SHALL keep them out of the Obsidian-synchronized
source directory.

#### Scenario: Profile is saved atomically
- **WHEN** setup completes successfully
- **THEN** the selected vault path and visible source path are stored in the local profile
- **AND** the compatibility path is derived from the selected vault
- **AND** the profile write is atomic

#### Scenario: A different machine uses a different absolute vault path
- **WHEN** another machine configures the same synced vault at a different absolute path
- **THEN** setup stores that machine's local paths independently
- **AND** no absolute path file is written under `<vault>/Agent`

### Requirement: Visible source and vault-local compatibility link
The configured topology SHALL keep real shared content in a visible directory
inside the vault and SHALL expose it through a machine-local `<vault>/.agents`
directory link.

#### Scenario: New topology is created
- **WHEN** the selected vault is valid and neither agents path exists
- **THEN** setup creates `<source>/skills` and `<source>/state`
- **AND** it creates `<vault>/.agents` as a directory link to the visible source
- **AND** accessing `<vault>/.agents/skills` resolves to `<source>/skills`

#### Scenario: Platform-appropriate link is selected
- **WHEN** setup creates the compatibility link on Windows
- **THEN** it uses a directory junction when the target is a supported local directory
- **AND** it reports an actionable error rather than silently copying content when a junction cannot be created

#### Scenario: Unix-like setup creates a symbolic link
- **WHEN** setup creates the compatibility link on a supported Unix-like platform
- **THEN** it creates a directory symbolic link to the visible source
- **AND** it verifies the resolved target after creation

#### Scenario: Source must remain sync-visible
- **WHEN** the configured source is outside the vault, begins with a dot path segment, or equals the compatibility path
- **THEN** setup rejects the topology
- **AND** it explains that shared content must remain in a visible directory inside the selected vault

### Requirement: Safe adoption, migration, and repair
Setup SHALL preserve existing agents content and SHALL not overwrite, delete,
or merge ambiguous directories while adopting or repairing the topology.

#### Scenario: Existing real `.agents` directory is adopted
- **WHEN** `<vault>/.agents` is a real directory and the visible source does not exist or is empty
- **THEN** setup previews adoption of the existing directory as the visible source
- **AND** after confirmation it moves the directory without discarding its files or hidden metadata
- **AND** it creates the compatibility link only after the move succeeds

#### Scenario: Existing visible source receives a missing link
- **WHEN** the visible source already contains files and `<vault>/.agents` is absent
- **THEN** setup preserves the source contents
- **AND** it creates and verifies only the missing compatibility link after confirmation

#### Scenario: Ambiguous dual directories stop setup
- **WHEN** both `<vault>/.agents` and the visible source are real non-empty directories
- **THEN** setup stops before moving or merging files
- **AND** it reports both paths and requires manual reconciliation

#### Scenario: Incorrect link is not replaced silently
- **WHEN** `<vault>/.agents` is a link whose resolved target differs from the configured source
- **THEN** setup reports the current and expected targets
- **AND** it requires explicit confirmation before replacing only the link
- **AND** it does not delete or modify the old target

#### Scenario: Interrupted migration remains recoverable
- **WHEN** directory adoption or link creation fails
- **THEN** setup reports the filesystem state it observed after failure
- **AND** it leaves the surviving source content accessible at a reported path
- **AND** a later setup run can inspect and repair the topology without assuming the previous step completed

### Requirement: Read-only topology status
The CLI SHALL provide `chc obsidian agents status` as a non-interactive,
read-only view of the configured profile and vault link topology.

#### Scenario: Healthy topology is reported
- **WHEN** the profile, vault, visible source, and compatibility link are valid
- **THEN** status reports the profile name, vault path, source path, compatibility path, link type, and resolved target
- **AND** it reports the existence of `skills/` and `state/`
- **AND** it reports the topology as healthy without contacting a Git remote

#### Scenario: Broken or missing link is reported
- **WHEN** the compatibility link is absent, broken, or targets another directory
- **THEN** status exits without modifying the filesystem
- **AND** it reports the exact mismatch and recommends rerunning setup

#### Scenario: JSON status is stable and non-mutating
- **WHEN** the user runs `chc obsidian agents status --json`
- **THEN** the command returns stable machine-readable fields for configuration, paths, link, content directories, and health
- **AND** it does not create directories, repair links, invoke Obsidian, or perform network operations

### Requirement: Obsidian-owned synchronization boundary
The feature SHALL rely on Obsidian Sync to transport the visible source and
SHALL not add a second automatic Git or Hook synchronization workflow.

#### Scenario: Normal Skill work performs no CthuTool sync phase
- **WHEN** a Skill is invoked from the configured vault or writes shared state
- **THEN** CthuTool does not fetch, commit, push, or acquire a synchronization lock
- **AND** no CthuCodex before-turn or end-of-turn Hook is required by this feature

#### Scenario: Synchronization guarantees are reported accurately
- **WHEN** setup or status explains synchronization behavior
- **THEN** it identifies Obsidian Sync as eventually consistent
- **AND** it does not claim that another machine has uploaded or downloaded the latest file
- **AND** it warns that concurrently written non-Markdown state files require a conflict-resistant layout or manual recovery
