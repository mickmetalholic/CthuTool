# apps-cli-codex-skill-management Specification

## Purpose
TBD - created by archiving change apps-cli-interactive-codex-skills. Update Purpose after archive.
## Requirements
### Requirement: Interactive Codex skill manager
The CLI SHALL expose `chc codex skills` as the interactive manager for manifest-managed third-party Codex skills and eligible locally installed GitHub skills.

#### Scenario: Reconciliation inventory is shown
- **WHEN** a user runs `chc codex skills` in an interactive terminal
- **THEN** the command lists enabled and disabled manifest entries together with eligible backend-managed GitHub installations absent from the manifest
- **AND** each row shows the skill name, GitHub source, local or desired-state classification, available upstream state when known, and selected action

#### Scenario: Valid actions depend on state
- **WHEN** the user focuses a skill row and presses Space
- **THEN** the row cycles only through actions valid for its current state, including track, install, replace, update, enable, remove, or no action as applicable
- **AND** a current manifest-managed installation does not offer a redundant lifecycle mutation

#### Scenario: Unmanaged local skills are ignored
- **WHEN** a local skill is absent from the manifest and the pinned backend cannot provide supported GitHub provenance for explicit tracking
- **THEN** `chc codex skills` does not list, import, update, remove, or otherwise modify that skill

#### Scenario: Empty reconciliation inventory is actionable
- **WHEN** neither manifest entries nor eligible local-only GitHub skills exist
- **THEN** the command reports that no tracked or trackable GitHub skills were found
- **AND** it directs the user to Add skills from GitHub instead of reporting that no changes were selected

#### Scenario: Unchanged selections are distinguished from an empty inventory
- **WHEN** the command displays one or more actionable rows and the user presses Enter while every row remains at no action
- **THEN** the command reports `No changes selected.`
- **AND** it performs no local or manifest mutation

### Requirement: GitHub skill desired-state manifest
The repository SHALL store managed third-party skill intent in `codex/skills.manifest.json` without vendoring skill files into `codex/skills`.

#### Scenario: Versioned GitHub entry
- **WHEN** the command writes a managed skill entry
- **THEN** the manifest uses the current schema version
- **AND** the entry records the skill name, GitHub repository, skill path or selector, tracking ref or pin, and enabled state needed to install it again

#### Scenario: Local discovery does not generate intent
- **WHEN** local Codex skill directories exist without manifest entries
- **THEN** the command does not add them to the manifest automatically

#### Scenario: Legacy manifest requires explicit migration
- **WHEN** a legacy manifest entry lacks an installable GitHub source
- **THEN** the command reports that the entry cannot be managed automatically
- **AND** it does not guess a repository or overwrite the legacy entry without explicit user selection

### Requirement: Reviewed skill execution plan
The interactive manager SHALL require review and confirmation before mutating local skills or the manifest.

#### Scenario: Selected actions produce a plan
- **WHEN** the user presses Enter after selecting one or more actions
- **THEN** the command displays the installs, replacements, updates, removals, enablement changes, and manifest edits it will perform
- **AND** it asks for confirmation with a default-negative answer

#### Scenario: Cancel preserves state
- **WHEN** the user cancels the plan or declines confirmation
- **THEN** no local skill, skill-manager lock data, or manifest content is changed

#### Scenario: Partial backend failure is reported
- **WHEN** one selected backend operation fails
- **THEN** the command reports which skills completed and which failed
- **AND** it writes manifest state only for operations whose intended local state was successfully established

### Requirement: Npx skills lifecycle backend
The CLI SHALL use a pinned and validated `npx skills` command contract to perform third-party skill discovery, installation, update, and removal for the Codex user scope.

#### Scenario: Missing managed skill is installed
- **WHEN** the user confirms Install for a manifest-managed skill missing locally
- **THEN** the command invokes the pinned `skills` CLI for the recorded GitHub source and skill selector
- **AND** it targets the global Codex agent scope

#### Scenario: Managed skill is updated
- **WHEN** the user confirms Update for an installed managed skill
- **THEN** the command delegates the update to the pinned `skills` CLI
- **AND** it preserves the manifest source unless the user explicitly changes it

#### Scenario: Unmanaged collision requires replacement approval
- **WHEN** a manifest-managed skill name collides with a local installation that lacks compatible source tracking
- **THEN** the command marks the skill as unmanaged rather than updating it in place
- **AND** replacement occurs only when the user explicitly selects and confirms Replace

#### Scenario: Backend contract mismatch fails closed
- **WHEN** the pinned backend cannot provide the expected command behavior or metadata
- **THEN** `chc codex skills` exits with an actionable error
- **AND** it does not infer state from unrecognized human-formatted output or mutate managed skills

### Requirement: Add and remove managed skills
The interactive manager SHALL let users add supported GitHub skills to desired state and remove managed skills from both desired and installed state.

#### Scenario: Add from GitHub source
- **WHEN** the user chooses Add, supplies or selects a GitHub source, and selects one or more discovered skills
- **THEN** the command includes installation and manifest additions in the reviewed plan
- **AND** confirmed successful installations are recorded with their source metadata

#### Scenario: Remove managed skill
- **WHEN** the user confirms Remove for a managed skill
- **THEN** the command delegates local removal to the pinned `skills` CLI
- **AND** it removes the manifest entry only after successful local removal or confirmed absence

#### Scenario: Related skills are explicit entries
- **WHEN** a selected wrapper skill depends on another skill that the backend does not resolve automatically
- **THEN** each required skill is represented as an explicit selected or manifest-managed entry
- **AND** the command does not assume dependencies from natural-language instructions alone

### Requirement: Safe non-interactive behavior
The skills command SHALL preserve the CLI JSON and non-interactive safety contract without prompting or selecting mutations implicitly.

#### Scenario: JSON inventory is read-only
- **WHEN** a user runs `chc codex skills --json`
- **THEN** stdout contains one parseable JSON object describing managed skill state and available actions
- **AND** the command performs no installation, update, replacement, removal, or manifest write

#### Scenario: Non-interactive invocation does not hang
- **WHEN** `chc codex skills` runs without an interactive terminal and without an explicit supported automation action
- **THEN** it fails with a clear non-interactive usage error
- **AND** it does not wait for input or mutate state

### Requirement: Explicit local GitHub skill tracking
The CLI SHALL let users explicitly adopt eligible locally installed GitHub skills into repository desired state without copying or reinstalling them.

#### Scenario: Eligible local-only skill is discovered
- **WHEN** the pinned backend reports a locally installed skill absent from the manifest with a supported GitHub repository and unambiguous skill selector or path
- **THEN** `chc codex skills` includes it in the inventory with state `local_only`
- **AND** the row offers Track and no action as its valid actions

#### Scenario: Tracking metadata is completed explicitly
- **WHEN** a user selects Track for a local-only skill
- **THEN** the command requires an explicit branch-tracking or pin decision and a non-empty ref before creating the plan
- **AND** backend metadata may be presented as a default but does not silently determine the tracking policy

#### Scenario: Track plan is manifest-only
- **WHEN** a valid Track selection is presented for review
- **THEN** the plan shows the GitHub repository, selector, tracking type, ref, and manifest addition
- **AND** it states that the existing local installation will not be installed, updated, removed, or copied

#### Scenario: Confirmed Track writes desired state
- **WHEN** the user confirms a Track item whose source validates successfully
- **THEN** the command atomically upserts an enabled version 2 manifest entry with the reviewed source metadata
- **AND** it does not invoke a backend lifecycle mutation for that skill

#### Scenario: Unsupported local source stays unmanaged
- **WHEN** a local skill is self-authored, manually copied, well-known, plugin-provided, system-provided, non-GitHub, or missing supported provenance
- **THEN** the command does not list it as trackable or add it to the manifest
- **AND** it does not modify or name that local skill in human or JSON output

#### Scenario: Track cancellation preserves state
- **WHEN** the user cancels metadata collection, leaves Track unselected, or declines the reviewed plan
- **THEN** neither the local installation nor the manifest is changed
