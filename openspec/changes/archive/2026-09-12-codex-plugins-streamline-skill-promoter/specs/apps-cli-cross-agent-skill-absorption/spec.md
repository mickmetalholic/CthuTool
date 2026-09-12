## MODIFIED Requirements

### Requirement: Codex absorption preserves Hermes source and provenance

The repository-owned `codex-skill-promoter` SHALL absorb only a selected eligible Hermes Evolution Skill into reviewed Codex staging, record its source identity, content fingerprint, target scope, and adaptation, and keep the Hermes original unchanged until a compatible replacement is available and verified in Hermes. The confirmed end-to-end run MAY then retire the exact unchanged original from the active Hermes Skill root. It SHALL NOT mirror directories, run source scripts, or infer missing Evolution provenance.

#### Scenario: Confirmed absorption writes an adapted Codex target

- **WHEN** the user confirms a candidate table with an eligible Hermes Skill and a safe adaptation
- **THEN** the promoter writes the reviewed Codex staging tree and provenance record
- **AND** the original Hermes tree remains unchanged during staging, repository promotion, and replacement verification

#### Scenario: Unsafe or incomplete source is rejected

- **WHEN** inspection finds secrets, inaccessible references, unsupported executable behavior, or an unmapped dependency
- **THEN** the promoter refuses to write an adapted target
- **AND** it leaves Hermes, Codex staging, and repository Skill trees unchanged

#### Scenario: Original remains until Hermes replacement works

- **WHEN** a replacement cannot be loaded through a supported Hermes Skill location with the required behavior
- **THEN** the promoter keeps the original Hermes Skill active and does not archive or open a PR as a completed promotion
- **AND** it reports the availability gap

### Requirement: Codex target collisions require an explicit resolution

The promoter SHALL detect a same-name target or conflicting provenance before the candidate-set confirmation and SHALL require the user to choose merge, replace, or rename in that one confirmation. It SHALL preserve prior target content unless the exact resolution was reviewed and confirmed.

#### Scenario: Existing Codex target has no bridge provenance

- **WHEN** the target name already exists without compatible absorption provenance
- **THEN** the candidate table shows the collision and does not overwrite it during discovery
- **AND** the user must select an exact resolution before the end-to-end run starts

#### Scenario: Re-absorption sees the recorded source

- **WHEN** a Codex target has bridge provenance and the Hermes source fingerprint has changed
- **THEN** the promoter shows the old target, changed source, and proposed adaptation separately
- **AND** it does not silently replace local Codex edits

## ADDED Requirements

### Requirement: Hermes-accessible replacement precedes source retirement

When a confirmed promotion would remove an active Hermes original, the promoter SHALL first install or expose the compatible result at a supported Hermes Skill location, verify discovery and explicit invocation there, and retain the original until the replacement passes. A Codex plugin cache SHALL NOT count as a Hermes replacement.

#### Scenario: Verified replacement permits retirement

- **WHEN** the compatible replacement is discoverable and usable in Hermes and the original still matches its reviewed identity, Evolution marker, and fingerprint
- **THEN** the promoter removes only that original from the active Hermes Skill root
- **AND** it keeps the verified replacement available

#### Scenario: Hermes cannot load the replacement

- **WHEN** the replacement is unavailable, invalid, or fails a required invocation check
- **THEN** the promoter retains the original and stops dependent archive and PR work

## REMOVED Requirements

### Requirement: Codex bridge remains local and one-way

**Reason**: The reviewed promotion now includes a task-scoped repository change, verified Hermes replacement, original retirement, and PR publication; the old local-only/manual-handoff requirement contradicts that flow.
**Migration**: Keep provenance and source-safety checks, perform one-way replacement without directory mirroring, and include Git publication in the confirmed `codex-skill-promoter` run. Hermes-side absorption of Codex into Hermes remains outside `chc codex skills`.
