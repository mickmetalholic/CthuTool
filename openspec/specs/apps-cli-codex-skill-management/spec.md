# apps-cli-codex-skill-management Specification

## Purpose
Define the reviewed interactive and non-interactive lifecycle for manifest-managed Codex skills sourced through the supported skill backend.

## Requirements

### Requirement: Interactive Codex skill manager

The CLI SHALL expose `chc codex skills` as the interactive manager for
manifest-managed third-party skills from supported GitHub sources, together
with eligible locally installed GitHub skills. Locally authored, previously
Hermes-absorbed, and eligible evolution-created Hermes skills SHALL be managed
by the repository-owned `codex-skill-promoter` skill and SHALL NOT become CLI
inventory rows.

#### Scenario: Reconciliation inventory is shown

- **WHEN** a user runs `chc codex skills` in an interactive terminal
- **THEN** the command lists enabled and disabled manifest entries together
  with eligible backend-managed GitHub installations absent from the manifest
- **AND** each reconciliation row shows the skill name, normalized GitHub
  source, local or desired-state classification, available upstream state when
  known, and selected action

#### Scenario: Valid actions depend on state

- **WHEN** the user focuses a skill row and presses Space
- **THEN** the row cycles only through actions valid for its current state,
  including track, install, replace, update, enable, remove, or no action as
  applicable
- **AND** a current manifest-managed installation does not offer a redundant
  lifecycle mutation

#### Scenario: Unmanaged local skills are ignored

- **WHEN** a local skill is absent from the manifest and the pinned backend
  cannot provide supported GitHub provenance
- **THEN** `chc codex skills` does not list, import, update, remove, or
  otherwise modify that skill

#### Scenario: Empty reconciliation inventory is actionable

- **WHEN** neither manifest entries nor eligible local-only GitHub skills exist
- **THEN** the command reports that no tracked or trackable supported skills
  were found
- **AND** it directs the user to Add a supported GitHub source or use the
  repository-owned `codex-skill-promoter` skill for a local skill instead of
  reporting that no changes were selected

#### Scenario: Unchanged selections are distinguished from an empty inventory

- **WHEN** the command displays one or more actionable rows and the user
  presses Enter while every row remains at no action
- **THEN** the command reports `No changes selected.`
- **AND** it performs no local or manifest mutation

### Requirement: GitHub skill desired-state manifest

The repository SHALL store managed third-party skill intent in
`codex/skills.manifest.json` without vendoring third-party skill files into
`codex/skills`, using the current schema version for supported GitHub source
entries only.

#### Scenario: Versioned GitHub entry

- **WHEN** the command writes a managed skill from a GitHub shorthand, full
  GitHub URL, or direct GitHub tree URL
- **THEN** the manifest uses the current schema version
- **AND** the entry records the skill name, canonical GitHub repository,
  selector, tracking ref or pin, and enabled state needed to install it again

#### Scenario: Versioned local entry

- **WHEN** a user supplies a repository-relative or absolute local directory
  to the third-party Add flow
- **THEN** the command rejects the source before discovery
- **AND** it does not write a local-source manifest entry
- **AND** the user is directed to the repository-owned
  `codex-skill-promoter` skill for a locally authored or absorbed skill

#### Scenario: Local discovery does not generate intent

- **WHEN** local Codex skill directories exist without manifest entries
- **THEN** the command does not add them to the manifest automatically
- **AND** local development candidates are discovered only by the
  repository-owned `codex-skill-promoter` skill

#### Scenario: Existing local-source entry fails closed

- **WHEN** a version 2 manifest contains an unsupported local-source entry
- **THEN** the command reports that the entry is no longer manageable
- **AND** it does not invoke the backend or silently convert the entry
- **AND** migration requires an explicit user change to a GitHub entry or to
  the repository-owned local-skill development workflow

#### Scenario: Legacy manifest requires explicit migration

- **WHEN** a legacy manifest entry lacks an installable supported source
- **THEN** the command reports that the entry cannot be managed automatically
- **AND** it does not guess a repository or path or overwrite the legacy entry
  without explicit user selection

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

The CLI SHALL use a pinned and validated `npx skills` command contract to
perform third-party skill discovery, installation, update, and removal for
supported GitHub sources in the Codex user scope. Repository-local paths SHALL
NOT be passed to the backend as third-party sources.

#### Scenario: Missing managed skill is installed

- **WHEN** the user confirms Install for a manifest-managed skill missing
  locally
- **THEN** the command invokes the pinned `skills` CLI for the recorded
  normalized GitHub source and skill selector
- **AND** it targets the global Codex agent scope

#### Scenario: Managed skill is updated

- **WHEN** the user confirms Update for an installed managed skill with an
  available update action
- **THEN** the command delegates the update or reinstall to the pinned
  `skills` CLI
- **AND** it preserves the manifest source unless the user explicitly changes
  it

#### Scenario: Unmanaged collision requires replacement approval

- **WHEN** a manifest-managed skill name collides with a local installation
  that lacks compatible source tracking
- **THEN** the command marks the skill as unmanaged rather than updating it in
  place
- **AND** replacement occurs only when the user explicitly selects and
  confirms Replace

#### Scenario: Backend contract mismatch fails closed

- **WHEN** the pinned backend cannot provide the expected command behavior or
  metadata for a supported GitHub source
- **THEN** `chc codex skills` exits with an actionable error
- **AND** it does not infer state from unrecognized human-formatted output or
  mutate managed skills

### Requirement: Add and remove managed skills

The interactive manager SHALL let users add supported GitHub skills to desired
state and remove managed skills from both desired and installed state.

#### Scenario: Add from GitHub source

- **WHEN** the user chooses Add, supplies a GitHub shorthand, full GitHub URL,
  or direct GitHub tree URL, and selects one or more discovered skills
- **THEN** the command normalizes the source, includes installation and
  manifest additions in the reviewed plan, and records the canonical
  repository, selector, and tracking metadata
- **AND** confirmed successful installations are recorded only after the
  local installation succeeds

#### Scenario: Add from local source

- **WHEN** the user chooses Add and supplies a repository-relative path,
  absolute path, or another local directory
- **THEN** the command reports that local paths are not supported as npx
  managed sources
- **AND** it performs no discovery, installation, removal, or manifest write
- **AND** it explains that a locally authored, bridge-marked, or eligible
  Hermes evolution skill can be reviewed through the repository-owned
  `codex-skill-promoter` skill

#### Scenario: Unsupported source is rejected

- **WHEN** the user supplies a GitLab URL or arbitrary Git URL
- **THEN** the command reports that only the supported GitHub forms are
  accepted
- **AND** it performs no discovery mutation, installation, removal, or
  manifest write

#### Scenario: Remove managed skill

- **WHEN** the user confirms Remove for a managed skill
- **THEN** the command delegates local removal to the pinned `skills` CLI
- **AND** it removes the manifest entry only after successful local removal or
  confirmed absence

#### Scenario: Related skills are explicit entries

- **WHEN** a selected wrapper skill depends on another skill that the backend
  does not resolve automatically
- **THEN** each required skill is represented as an explicit selected or
  manifest-managed entry
- **AND** the command does not assume dependencies from natural-language
  instructions alone

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

The CLI SHALL let users explicitly adopt eligible locally installed GitHub skills into repository desired state without copying or reinstalling them. Codex skills produced by the Hermes absorption bridge are handled by the separate promotion action and are not treated as GitHub-tracking candidates unless they independently satisfy the GitHub provenance contract.

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

- **WHEN** a local skill is self-authored, manually copied, well-known, plugin-provided, system-provided, non-GitHub, or missing supported provenance and has no valid Hermes-absorption provenance record selected for promotion
- **THEN** the command does not list it as GitHub-trackable or add it to the manifest
- **AND** it does not modify or name that local skill in the GitHub-tracking inventory

#### Scenario: Track cancellation preserves state

- **WHEN** the user cancels metadata collection, leaves Track unselected, or declines the reviewed plan
- **THEN** neither the local installation nor the manifest is changed
