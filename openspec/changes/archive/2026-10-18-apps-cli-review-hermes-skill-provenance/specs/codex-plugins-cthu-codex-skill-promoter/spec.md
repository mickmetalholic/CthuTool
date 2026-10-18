## REMOVED Requirements

### Requirement: Repository-owned Codex skill absorber and promoter

**Reason**: The Evolution-only gate is replaced by native creation evidence and explicit review of uncertain local origins.
**Migration**: Use Repository-owned local Skill review and promotion; retain the project entry point, third-party exclusions, and selected-run guarantees.

## ADDED Requirements

### Requirement: Repository-owned local Skill review and promotion

CthuTool SHALL provide `codex-skill-promoter` under `.agents/skills/codex-skill-promoter` for reviewing local Codex and Hermes Skills and promoting an explicitly selected set into `codex/plugins/cthu-codex/skills`. The promoter SHALL remain outside plugin distribution, perform read-only discovery regardless of caller Git state, and keep `chc codex skills` limited to third-party GitHub Skills. It SHALL report native Hermes creation evidence, separate uncertain origins for explicit local-source confirmation, and exclude managed, protected, external, opted-out, or unsafe sources.

#### Scenario: Project maintenance Skill stays outside plugin distribution

- **WHEN** an agent discovers Skills from a CthuTool checkout
- **THEN** the promoter is available under `.agents/skills/codex-skill-promoter` with references, scanner, and invocation metadata
- **AND** CthuCodex installation does not distribute the promoter
- **AND** selected promoted Skills target the business plugin

#### Scenario: Explicit invocation performs read-only discovery

- **WHEN** the user invokes the promoter regardless of branch, HEAD, or working-tree state
- **THEN** it inspects the configured local Skill roots without changing Git, Skill files, or Hermes metadata

#### Scenario: Native Hermes creation records are reviewed

- **WHEN** a Hermes package has a valid create event linked to its identity and exact path and passes ownership and safety checks
- **THEN** the promoter reports the event identity, actor, timestamp, source-relative path, and current fingerprint
- **AND** it labels the evidence as recorded local creation without requiring a dedicated Evolution marker

#### Scenario: Management flags leave origin uncertain

- **WHEN** a local Hermes package has only usage counters, author text, a management/adoption flag, a legacy marker claim, or no creation history
- **THEN** the promoter lists it separately as source uncertain with available hints and missing evidence
- **AND** it requires explicit confirmation of that exact package's local source together with promotion selection
- **AND** it records the result as user-confirmed local origin rather than a verified historical creation

#### Scenario: Third-party skills are excluded

- **WHEN** a Codex or Hermes package is owned by a manifest, Hub/npx lifecycle, system/bundled installation, plugin, external location, organization, or protected inventory
- **THEN** it is excluded with the ownership reason
- **AND** local-source confirmation cannot override that exclusion

#### Scenario: Promotion and cleanup sets are explicit after discovery

- **WHEN** discovery finds recorded-local or source-uncertain candidates
- **THEN** the confirmation table shows exact paths, provenance classification and evidence gaps, files/fingerprints, compatibility warnings, targets/collision resolutions, original-retirement paths, and OpenSpec/PR scope
- **AND** every row defaults to Skip
- **AND** uncertain rows require explicit local-source confirmation plus selection
- **AND** the selected set authorizes verified retirement and the complete scoped promotion run

#### Scenario: Confirmed Hermes adaptation enters Codex staging

- **WHEN** the user selects a reviewed Hermes source and supplies any required local-source confirmation and collision resolution
- **THEN** the promoter creates reviewed Codex staging and records portable source identity, fingerprint, evidence classification, and any user attestation
- **AND** the original stays active until both replacements pass verification
- **AND** source scripts remain unexecuted during inspection

## MODIFIED Requirements

### Requirement: Confirmed OpenSpec-to-PR promotion

After the user confirms the candidate table, the promoter SHALL create a scoped OpenSpec proposal, complete its design/spec/tasks, apply the selected Skill change, verify both-agent compatibility and installed replacements, retire the unchanged original local source, archive only that OpenSpec change, and open a pull request for the task branch. It SHALL continue through these routine stages without additional confirmation; an actual conflict, changed source, failed verification, unavailable dependency, or rejected operation SHALL stop the dependent stages and preserve reviewable state.

#### Scenario: Successful promotion completes publication

- **WHEN** all confirmed sources and targets remain unchanged and every verification succeeds
- **THEN** the promoter installs the CthuCodex result, verifies the Codex plugin cache and Hermes-accessible replacement, removes each selected original from its active Skill root, archives its OpenSpec change, and opens one pull request
- **AND** the PR contains only the selected Skill, its adapters and documentation, and that change's archived OpenSpec artifacts and affected main specs

#### Scenario: Source changes or replacement fails

- **WHEN** a source fingerprint, provenance evidence or user attestation, eligibility classification, replacement load check, or installation verification differs from the reviewed state
- **THEN** the promoter stops before deleting that original and before archive or PR
- **AND** it reports the observed state and retains all unrelated files and sources

#### Scenario: Cleanup is blocked after verification

- **WHEN** permanent deletion of an unchanged, confirmed original is rejected but moving it out of the active Skill root is allowed
- **THEN** the promoter may use a clearly reported reversible retirement path after verifying containment and content again
- **AND** it does not claim permanent deletion or leave the original active
