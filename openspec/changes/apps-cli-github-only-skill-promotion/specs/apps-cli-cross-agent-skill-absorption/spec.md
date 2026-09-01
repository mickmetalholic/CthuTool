## MODIFIED Requirements

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

### Requirement: Hermes absorption remains local and one-way

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
