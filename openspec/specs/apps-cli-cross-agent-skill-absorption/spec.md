# apps-cli-cross-agent-skill-absorption Specification

## Purpose
Provide a Codex-side, provenance-aware workflow for adapting selected eligible local Hermes skills into Codex without mirroring directories or taking ownership of Hermes skill management.

## Requirements

### Requirement: Codex bridge classifies native Hermes provenance

The bridge SHALL classify safe unmanaged Hermes packages using native create events and current usage hints. Recorded local creation requires a valid create event matching the Skill identity and exact package path. A management flag, adoption, author, activity, location, or unsupported legacy marker alone SHALL leave origin uncertain. Uncertain local packages SHALL remain visible for explicit user confirmation before absorption. Managed, bundled, Hub, protected, external, organization, opted-out, or unsafe packages SHALL stay excluded.

#### Scenario: Bundled and hub-managed skills are excluded

- **WHEN** a source name or exact relative path is covered by bundled or Hub inventories
- **THEN** the bridge excludes it and preserves its files and metadata

#### Scenario: External and organization-managed skills are excluded

- **WHEN** a source belongs to an external or organization-managed location
- **THEN** it is excluded from absorption and local-source confirmation does not bypass the exclusion

#### Scenario: Native create event establishes recorded origin

- **WHEN** a valid create event has a supported actor, timestamp, identity, and after-state path linked to the current package
- **THEN** the bridge reports recorded local creation with the event reference and current fingerprint
- **AND** later evidence that deletes, replaces, or contradicts that source is reported as uncertain

#### Scenario: Missing or incomplete creation history needs confirmation

- **WHEN** ownership checks pass but native creation history is absent, malformed, conflicting, or cannot be linked uniquely to the source
- **THEN** the bridge shows a source-uncertain row and its evidence gap
- **AND** only explicit local-source confirmation for the displayed path and fingerprint permits the selected promotion
- **AND** the confirmation is recorded as user attestation and does not modify Hermes provenance

#### Scenario: Adoption is not historical creation

- **WHEN** the usage record marks a Skill as agent-managed without a matching native creation event
- **THEN** the bridge reports that management hint and leaves origin uncertain

### Requirement: Hermes category discovery preserves package boundaries

The bridge SHALL traverse category directories inside the configured Hermes Skill root and identify each contained package by its full source-relative path. It SHALL exclude links, archive/cache/Hub/organization metadata trees, and package support directories from discovery. Once a package is found, its support tree SHALL be inspected as package content. Copies and retirement SHALL target only the reviewed package, preserving category parents and siblings.

#### Scenario: Nested local Skill is discovered

- **WHEN** a category contains a regular local Skill package such as `media/example`
- **THEN** the bridge lists that package with its exact absolute and source-relative paths

#### Scenario: Repeated names retain distinct source identities

- **WHEN** different categories contain packages with the same declared Skill name
- **THEN** the bridge keeps separate path-qualified rows and reports identity/target collisions before selection
- **AND** name-only creation records cannot establish unique provenance for both

#### Scenario: Links and metadata trees are excluded

- **WHEN** a category, package, reference, or inventory would traverse a symbolic link, escape the root, or enter excluded metadata
- **THEN** the bridge reports the boundary and does not read through it or offer the unsafe package

#### Scenario: Nested retirement preserves neighbors

- **WHEN** verified replacements permit retirement of a selected nested source
- **THEN** only that unchanged package is retired
- **AND** its category parent, sibling packages, and unrelated files remain

### Requirement: Codex bridge inventory is read-only

The Codex bridge SHALL inspect the local Hermes skill roots and present candidate names, scopes, source paths, provenance classification, and Codex-compatibility warnings without changing Hermes skill files or metadata.

#### Scenario: Codex bridge inspects Hermes skills

- **WHEN** a user invokes the Codex bridge skill
- **THEN** it presents recorded-local and source-uncertain Hermes candidates separately and explains hard exclusions
- **AND** the inspection performs no write

#### Scenario: Hermes installation is unavailable

- **WHEN** the local Hermes root or required ownership inventories cannot be read
- **THEN** the bridge reports the unavailable inventory and blocks affected promotion while showing safe diagnostic results
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

The project-owned `codex-skill-promoter` under `.agents/skills/codex-skill-promoter` SHALL absorb only a selected safe unmanaged Hermes Skill with native creation evidence or explicit local-source attestation into reviewed Codex staging, record its full source-relative identity, content fingerprint, native evidence or explicit user attestation, target scope, and adaptation, and keep the Hermes original unchanged until a compatible replacement is available and verified in Hermes. The confirmed end-to-end run MAY then retire the exact unchanged original from the active Hermes Skill root. It SHALL NOT mirror directories, run source scripts, or manufacture Hermes provenance.

#### Scenario: Confirmed absorption writes an adapted Codex target

- **WHEN** the user confirms a candidate table with a reviewed Hermes Skill with any required explicit source confirmation and a safe adaptation
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

- **WHEN** the compatible replacement is discoverable and usable in Hermes and the original still matches its reviewed exact package path, native evidence or user attestation, eligibility, and fingerprint
- **THEN** the promoter removes only that original from the active Hermes Skill root
- **AND** it keeps the verified replacement available

#### Scenario: Hermes cannot load the replacement

- **WHEN** the replacement is unavailable, invalid, or fails a required invocation check
- **THEN** the promoter retains the original and stops dependent archive and PR work
