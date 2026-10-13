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

The project-owned `codex-skill-promoter` under `.agents/skills/codex-skill-promoter` SHALL absorb only a selected eligible Hermes Evolution Skill into reviewed Codex staging, record its source identity, content fingerprint, target scope, and adaptation, and keep the Hermes original unchanged until a compatible replacement is available and verified in Hermes. The confirmed end-to-end run MAY then retire the exact unchanged original from the active Hermes Skill root. It SHALL NOT mirror directories, run source scripts, or infer missing Evolution provenance.

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

### Requirement: Hermes-accessible replacement precedes source retirement

When a confirmed promotion would remove an active Hermes original, the promoter SHALL first install or expose the compatible result at a supported Hermes Skill location, verify discovery and explicit invocation there, and retain the original until the replacement passes. A Codex plugin cache SHALL NOT count as a Hermes replacement.

#### Scenario: Verified replacement permits retirement

- **WHEN** the compatible replacement is discoverable and usable in Hermes and the original still matches its reviewed identity, Evolution marker, and fingerprint
- **THEN** the promoter removes only that original from the active Hermes Skill root
- **AND** it keeps the verified replacement available

#### Scenario: Hermes cannot load the replacement

- **WHEN** the replacement is unavailable, invalid, or fails a required invocation check
- **THEN** the promoter retains the original and stops dependent archive and PR work
