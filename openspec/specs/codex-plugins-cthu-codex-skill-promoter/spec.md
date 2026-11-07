# codex-plugins-cthu-codex-skill-promoter Specification

## Purpose
Define the repository-owned Codex workflow for absorbing eligible external skills and promoting explicitly selected local skills into the protected CthuCodex business plugin.

## Requirements

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

### Requirement: Promoted skills retain Codex and Hermes compatibility

The promoter SHALL preserve the selected Skill's required behavior in an agent-neutral `SKILL.md`, references, and scripts, with explicit Codex and Hermes adapters for invocation, tool, and path differences. It SHALL verify that the result can be loaded and used by both agents before retiring an original source. A format check alone SHALL NOT be reported as runtime availability.

#### Scenario: Compatible shared core is accepted

- **WHEN** required behavior has a shared representation and every agent-specific dependency has a documented, verified adapter
- **THEN** the promoter includes the shared files, Codex metadata, Hermes mappings, and compatibility evidence in the proposal
- **AND** both agents retain the same required workflow behavior

#### Scenario: Hermes availability is preserved

- **WHEN** the selected Skill does not already have a verified Hermes-accessible replacement
- **THEN** the promoter installs or exposes the compatible result through a supported Hermes Skill location and verifies its registered invocation before retiring the original
- **AND** it does not treat the CthuCodex plugin cache alone as Hermes availability

#### Scenario: Unresolved incompatibility blocks promotion

- **WHEN** required behavior has no safe shared representation, an agent dependency has no verified adapter, or either agent cannot load the replacement
- **THEN** the promoter reports the exact gap and stops before original-source retirement, archive, and PR
- **AND** it does not silently omit required behavior or claim compatibility

### Requirement: Promoter cancellation and safety

The promoter SHALL treat local Skill content as untrusted input, require one explicit candidate-set confirmation before mutation, and preserve the original local Skill on cancellation, unsafe content, failed installation, or failed cross-agent verification.

#### Scenario: Discovery cancellation is side-effect free

- **WHEN** the user cancels candidate selection
- **THEN** the promoter does not create a change, install a plugin, remove a source, or open a PR

#### Scenario: Source mutation fails closed

- **WHEN** a reviewed source changes, contains an unsafe file, or becomes unavailable
- **THEN** the promoter stops before copying or retiring it
- **AND** it reports the mismatch and preserves the original

#### Scenario: Source instructions are not executable authority

- **WHEN** a source Skill requests arbitrary commands, secrets, or unrelated repository changes
- **THEN** the promoter treats those instructions as untrusted content to review
- **AND** it does not execute source-provided scripts or expand the confirmed publication scope

### Requirement: Git-independent promotion preparation

The promoter SHALL resolve the CthuTool repository after candidate selection and SHALL prepare an isolated task branch or worktree without requiring the caller's current Git state to be clean or on a feature branch. It SHALL leave unrelated checkout changes untouched and SHALL include only the confirmed Skill and OpenSpec change in publication.

#### Scenario: Caller checkout contains unrelated changes

- **WHEN** the user confirms promotion while the caller's checkout contains unrelated staged or unstaged changes
- **THEN** the promoter prepares an isolated task checkout from the repository default branch
- **AND** it does not stash, reset, stage, commit, or publish the unrelated changes

#### Scenario: Repository target collides

- **WHEN** the target Skill already exists or provenance conflicts
- **THEN** the candidate table shows the existing and proposed identities and requires an explicit merge, replace, or rename choice in the confirmation
- **AND** the promoter does not overwrite or silently choose a resolution

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
