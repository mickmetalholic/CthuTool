## MODIFIED Requirements

### Requirement: Interactive Codex skill manager
The CLI SHALL expose `chc codex skills` as the interactive manager for manifest-managed third-party skills from supported GitHub sources or repository-relative local directories, together with eligible locally installed GitHub skills.

#### Scenario: Reconciliation inventory is shown
- **WHEN** a user runs `chc codex skills` in an interactive terminal
- **THEN** the command lists enabled and disabled manifest entries together with eligible backend-managed GitHub installations absent from the manifest
- **AND** each row shows the skill name, normalized GitHub source or repository-relative local source, local or desired-state classification, available upstream state when known, and selected action

#### Scenario: Valid actions depend on state
- **WHEN** the user focuses a skill row and presses Space
- **THEN** the row cycles only through actions valid for its current state, including track, install, replace, update, enable, remove, or no action as applicable
- **AND** a current manifest-managed installation does not offer a redundant lifecycle mutation

#### Scenario: Unmanaged local skills are ignored
- **WHEN** a local skill is absent from the manifest and the pinned backend cannot provide supported GitHub provenance for explicit tracking or a recognized bridge provenance for a separate explicit promotion flow
- **THEN** `chc codex skills` does not list, import, update, remove, or otherwise modify that skill

#### Scenario: Empty reconciliation inventory is actionable
- **WHEN** neither manifest entries nor eligible local-only GitHub skills exist
- **THEN** the command reports that no tracked or trackable supported skills were found
- **AND** it directs the user to Add a supported source instead of reporting that no changes were selected

#### Scenario: Unchanged selections are distinguished from an empty inventory
- **WHEN** the command displays one or more actionable rows and the user presses Enter while every row remains at no action
- **THEN** the command reports `No changes selected.`
- **AND** it performs no local or manifest mutation

### Requirement: GitHub skill desired-state manifest
The repository SHALL store managed third-party skill intent in `codex/skills.manifest.json` without vendoring skill files into `codex/skills`, using the current schema version for both supported GitHub and repository-relative local source entries.

#### Scenario: Versioned GitHub entry
- **WHEN** the command writes a managed skill from a GitHub shorthand, full GitHub URL, or direct GitHub tree URL
- **THEN** the manifest uses the current schema version
- **AND** the entry records the skill name, canonical GitHub repository, selector, tracking ref or pin, and enabled state needed to install it again

#### Scenario: Versioned local entry
- **WHEN** the command writes a managed skill from a local directory
- **THEN** the manifest uses the current schema version
- **AND** the entry records the skill name, a normalized repository-relative path, selector, local source kind, and enabled state needed to install it again from that checkout

#### Scenario: Local discovery does not generate intent
- **WHEN** local Codex skill directories exist without manifest entries
- **THEN** the command does not add them to the manifest automatically

#### Scenario: Legacy manifest requires explicit migration
- **WHEN** a legacy manifest entry lacks an installable supported source
- **THEN** the command reports that the entry cannot be managed automatically
- **AND** it does not guess a repository or path or overwrite the legacy entry without explicit user selection

### Requirement: Npx skills lifecycle backend
The CLI SHALL use a pinned and validated `npx skills` command contract to perform third-party skill discovery, installation, update, and removal for supported GitHub sources and repository-relative local sources in the Codex user scope.

#### Scenario: Missing managed skill is installed
- **WHEN** the user confirms Install for a manifest-managed skill missing locally
- **THEN** the command invokes the pinned `skills` CLI for the recorded normalized GitHub source or local path and skill selector
- **AND** it targets the global Codex agent scope

#### Scenario: Managed skill is updated
- **WHEN** the user confirms Update for an installed managed skill with an available update action
- **THEN** the command delegates the update or reinstall to the pinned `skills` CLI
- **AND** it preserves the manifest source unless the user explicitly changes it

#### Scenario: Unmanaged collision requires replacement approval
- **WHEN** a manifest-managed skill name collides with a local installation that lacks compatible source tracking
- **THEN** the command marks the skill as unmanaged rather than updating it in place
- **AND** replacement occurs only when the user explicitly selects and confirms Replace

#### Scenario: Backend contract mismatch fails closed
- **WHEN** the pinned backend cannot provide the expected command behavior or metadata for a supported source
- **THEN** `chc codex skills` exits with an actionable error
- **AND** it does not infer state from unrecognized human-formatted output or mutate managed skills

### Requirement: Add and remove managed skills
The interactive manager SHALL let users add supported GitHub or repository-relative local skills to desired state and remove managed skills from both desired and installed state.

#### Scenario: Add from GitHub source
- **WHEN** the user chooses Add, supplies a GitHub shorthand, full GitHub URL, or direct GitHub tree URL, and selects one or more discovered skills
- **THEN** the command normalizes the source, includes installation and manifest additions in the reviewed plan, and records the canonical repository, selector, and tracking metadata
- **AND** confirmed successful installations are recorded only after the local installation succeeds

#### Scenario: Add from local source
- **WHEN** the user chooses Add, supplies a repository-relative local directory, and selects one or more discovered skills
- **THEN** the command includes installation and a local-source manifest addition in the reviewed plan
- **AND** confirmed successful installations are recorded only after the local installation succeeds

#### Scenario: Unsupported source is rejected
- **WHEN** the user supplies a GitLab URL or arbitrary Git URL
- **THEN** the command reports that only the supported GitHub forms and repository-relative local directories are accepted
- **AND** it performs no discovery mutation, installation, removal, or manifest write

#### Scenario: Remove managed skill
- **WHEN** the user confirms Remove for a managed skill
- **THEN** the command delegates local removal to the pinned `skills` CLI
- **AND** it removes the manifest entry only after successful local removal or confirmed absence

#### Scenario: Related skills are explicit entries
- **WHEN** a selected wrapper skill depends on another skill that the backend does not resolve automatically
- **THEN** each required skill is represented as an explicit selected or manifest-managed entry
- **AND** the command does not assume dependencies from natural-language instructions alone

## ADDED Requirements

### Requirement: Local-source ownership is verified before lifecycle mutation

The CLI SHALL maintain machine-local provenance for skills installed from repository-relative local sources and SHALL require matching ownership before offering Update, Reinstall, or Remove for that local-source entry.

#### Scenario: Successful local installation records ownership

- **WHEN** the user confirms a local-source Add plan and installation succeeds
- **THEN** the command atomically records the manifest source path, selector, target path, source fingerprint, installed-target fingerprint, and installation time in the Codex user ownership record
- **AND** it writes the repository manifest entry only after the local installation and ownership record are established

#### Scenario: Missing ownership record is non-mutating

- **WHEN** a local-source manifest entry has an installed skill but no matching Codex user ownership record
- **THEN** the command classifies the skill as ownership-missing
- **AND** it does not offer Update, Reinstall, or Remove for that skill
- **AND** it reports that the user must explicitly re-adopt the source through a reviewed flow

#### Scenario: Mismatched ownership record is non-mutating

- **WHEN** the ownership record's source path, selector, or target does not match the manifest, or the installed target fingerprint differs from the recorded installed-target fingerprint
- **THEN** the command classifies the skill as an ownership collision
- **AND** it does not update, reinstall, remove, or overwrite the installed skill

#### Scenario: Changed local source remains owned but requires review

- **WHEN** the ownership record matches the manifest and installed target, but the current local source fingerprint differs from the recorded source fingerprint
- **THEN** the command classifies the skill as source-changed rather than ownership-mismatched
- **AND** it may offer a reviewed Update or Reinstall that shows the changed source and refreshes both fingerprints only after success

#### Scenario: Matching ownership permits reviewed lifecycle actions

- **WHEN** the ownership record matches the manifest source and installed skill
- **THEN** the command may offer Update, Reinstall, or Remove through the normal reviewed plan
- **AND** cancellation or declined confirmation leaves the skill, ownership record, and manifest unchanged
