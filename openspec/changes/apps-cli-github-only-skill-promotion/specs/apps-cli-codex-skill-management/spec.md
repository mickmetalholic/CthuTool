## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Local-source ownership is verified before lifecycle mutation

**Reason**: Repository-local directories are no longer accepted as
third-party `npx skills` sources, so machine-local ownership records and the
associated lifecycle states have no remaining managed source to protect.

**Migration**: Remove local-source entries from the manifest. If the skill was
absorbed from Hermes or authored locally, leave it in Codex-user staging and
use the repository-owned `codex-skill-promoter` skill to install and then
optionally remove the local source. If it is third-party, replace it with a
supported GitHub source entry.

### Requirement: Explicit promotion of Codex skills absorbed from Hermes

**Reason**: Local-skill development is not third-party lifecycle management
and should not expand the `chc codex skills` command. A repository-owned
Codex skill can provide the review, user-managed checkout, install, and cleanup workflow
using the repository's own conventions.

**Migration**: Use the CthuCodex `codex-skill-promoter` skill for locally
authored or Hermes-absorbed skills. Keep `chc codex skills` for supported
GitHub sources only.
