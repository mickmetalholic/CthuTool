# apps-cli-cross-agent-skill-absorption Specification

## Purpose
Provide a Codex-side, provenance-aware workflow for adapting selected eligible local Hermes skills into Codex without mirroring directories or taking ownership of Hermes skill management.

## Requirements

### Requirement: Codex bridge filters Hermes candidates

The Codex bridge skill SHALL offer only local Hermes skills with an explicit evolution provenance marker as absorption candidates. It SHALL exclude bundled skills, Skills Hub skills, external or organization-managed skills, protected built-ins, and skills with an explicit opt-out, and it SHALL not infer provenance from a directory location, activity, or `author` field.

#### Scenario: Bundled and hub-managed skills are excluded

- **WHEN** the local Hermes inventory contains a name listed in `.bundled_manifest` or `.hub/lock.json`
- **THEN** the Codex bridge does not offer that name for absorption
- **AND** it does not modify the skill or its Hermes metadata

#### Scenario: External and organization-managed skills are excluded

- **WHEN** a discovered Hermes skill resolves to an external skill directory or an organization-managed mirror
- **THEN** the Codex bridge classifies it as ineligible and does not offer an absorption action

#### Scenario: Missing evolution provenance is rejected

- **WHEN** a local Hermes skill has no dedicated supported evolution provenance marker
- **THEN** the Codex bridge does not offer it for absorption even if it has recent use, patch activity, or an agent-style author field

#### Scenario: Explicitly evolution-marked skill is offered

- **WHEN** a local Hermes skill has a supported evolution provenance marker and no explicit opt-out
- **THEN** the Codex bridge includes it as an eligible candidate with its marker, scope, and source path

### Requirement: Codex bridge inventory is read-only

The Codex bridge SHALL inspect the local Hermes skill roots and present candidate names, scopes, source paths, provenance classification, and Codex-compatibility warnings without changing Hermes skill files or metadata.

#### Scenario: Codex bridge inspects Hermes skills

- **WHEN** a user invokes the Codex bridge skill
- **THEN** it presents eligible Hermes candidates and explains why built-in, hub-managed, external, organization-managed, and unprovenanced skills are unavailable
- **AND** the inspection performs no write

#### Scenario: Hermes installation is unavailable

- **WHEN** the expected local Hermes roots or provenance metadata cannot be read
- **THEN** the bridge reports provenance as unavailable and offers no automatic absorption candidate
- **AND** it does not create fallback provenance or modify any Hermes file

### Requirement: Hermes skill is adapted into Codex through review

The Codex bridge SHALL adapt a selected Hermes skill to Codex's skill format, paths, tool names, and invocation conventions, and SHALL show the proposed Codex content and warnings before requesting confirmation.

#### Scenario: Hermes skill is prepared for Codex

- **WHEN** the user selects an eligible Hermes candidate in the Codex bridge
- **THEN** the bridge reads the skill instructions and relevant support files, produces a Codex-targeted preview, and identifies unsupported Hermes-only references or behavior
- **AND** it does not copy the source file blindly

#### Scenario: User declines the proposed absorption

- **WHEN** the user cancels or declines after reviewing the Codex preview
- **THEN** neither the Hermes source skill nor the Codex target skill directory is changed

### Requirement: Codex absorption preserves Hermes source and provenance

The repository-owned `codex-skill-promoter` SHALL expose an explicit Hermes
absorption stage. After confirmation, that stage SHALL write only the adapted
Codex skill and a Codex-side provenance record under the selected Codex-user
scope (`$CODEX_HOME/skills`). The record SHALL identify the Hermes source name
and path, source content fingerprint, absorption time, target scope, and
adaptation result. The Hermes source SHALL remain unchanged through absorption,
repository promotion, installation, and verification. The absorption stage
SHALL NOT write directly into a repository plugin directory; repository
publication is a later reviewed stage of the same skill. Only a final cleanup
phase MAY delete an explicitly selected, unchanged, still-eligible Hermes
source after successful plugin verification and a separate exact-path
confirmation.

#### Scenario: Confirmed absorption writes an adapted Codex target

- **WHEN** the user confirms a reviewed absorption with no unresolved safety
  error
- **THEN** the promoter's absorption stage writes the adapted skill to the
  selected Codex-user scope
- **AND** it records source provenance and the adaptation summary
- **AND** it does not write to Hermes, a repository plugin source, or invoke
  source-provided scripts

#### Scenario: Unsafe or incomplete source is rejected

- **WHEN** inspection finds secrets, inaccessible references, unsupported
  executable behavior, or another unresolved safety error
- **THEN** the promoter refuses to write the Codex target
- **AND** it reports the blocking finding and leaves Hermes, Codex staging,
  and repository skill trees unchanged

### Requirement: Codex target collisions require an explicit resolution

The Codex bridge SHALL detect an existing target skill with the same identity before writing and SHALL require the user to choose a safe resolution such as merge, replace, or a new name. It SHALL preserve prior Codex target content unless the selected resolution is explicitly confirmed.

#### Scenario: Existing Codex target has no bridge provenance

- **WHEN** the target name already exists without a compatible absorption record
- **THEN** the bridge reports a collision and does not overwrite it during the initial preview or confirmation
- **AND** it offers only explicitly reviewed resolution choices

#### Scenario: Re-absorption sees the recorded source

- **WHEN** a Codex target skill has a bridge provenance record and the Hermes source fingerprint has changed
- **THEN** the bridge shows the prior Codex target version, source changes, and proposed adaptation as separate inputs to the resolution
- **AND** it does not silently replace local Codex edits

### Requirement: Codex bridge remains local and one-way

The promoter's Hermes absorption stage SHALL operate on local skill trees
only. It SHALL not mirror directories, synchronize changes between machines,
invoke Hermes's remote sync plane, edit or update Hermes skills, or publish to
the repository automatically. After a separate explicit promotion stage, a
user-selected clean feature checkout is the versioned plugin staging source;
plugin installation verifies that checkout, and Git commit/PR is the
synchronization mechanism.

#### Scenario: Local absorption does not propagate automatically

- **WHEN** a user confirms an absorption on one machine
- **THEN** the promoter changes only the selected Codex-user skill tree
- **AND** it does not change the Hermes source tree, a remote service, or
  repository files

#### Scenario: Promotion changes only the selected checkout

- **WHEN** the user continues the repository-owned `codex-skill-promoter`
  workflow from a prepared checkout and confirms its repository proposal
- **THEN** the skill copies the reviewed bridge skill into that checkout's
  first-party plugin source
- **AND** it invokes the existing plugin installation command against that
  checkout and verifies the plugin before any optional local-source cleanup
- **AND** cleanup is considered only for exact Codex or eligible Hermes paths
  explicitly selected by the user after discovery for a promoted candidate
- **AND** it does not create or switch a branch/worktree, commit, push, update
  the npx manifest, or edit or update Hermes
- **AND** the promoted skill becomes shareable only after the user reviews and
  synchronizes the checkout's Git changes

#### Scenario: Optional Hermes source cleanup is isolated and guarded

- **WHEN** the user selected the original Hermes path as a cleanup target for
  a promoted candidate and plugin installation and verification succeeded
- **THEN** the promoter shows that exact Hermes path separately from any Codex
  staging cleanup target and asks for final deletion confirmation
- **AND** it rechecks direct-child containment, non-symlink status, the
  Evolution marker, managed and protected inventories, opt-outs, and the
  reviewed fingerprint immediately before deletion
- **AND** it removes only that unchanged eligible source tree
- **AND** it never edits, merges, updates, mirrors, or broadly cleans Hermes

#### Scenario: Hermes-side absorption remains out of scope

- **WHEN** a user wants to absorb a Codex skill into Hermes
- **THEN** the promoter reports that the Hermes-side workflow belongs to
  Hermes's own skill source and local management
- **AND** it does not add a Hermes lifecycle operation to `chc codex skills`
