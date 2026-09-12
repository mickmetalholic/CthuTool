## MODIFIED Requirements

### Requirement: Repository-owned Codex skill absorber and promoter

The CthuCodex plugin SHALL provide `codex-skill-promoter` as the sole repository-supplied entry point for promoting eligible local Codex Skills and absorbing eligible Hermes Evolution Skills; it SHALL NOT expose a separate `hermes-skill-absorber`. Discovery SHALL be read-only and SHALL begin without a current Git branch, HEAD, or cleanliness prerequisite. `chc codex skills` SHALL remain limited to GitHub-backed third-party Skills.

#### Scenario: Explicit invocation performs read-only discovery

- **WHEN** the user invokes `codex-skill-promoter` from a dirty checkout, detached HEAD, default branch, or directory outside a Git checkout
- **THEN** the promoter scans eligible local Codex and Hermes roots read-only
- **AND** it does not create a branch, change Git state, or write a Skill during discovery

#### Scenario: Only evolution-created Hermes skills are eligible

- **WHEN** the Hermes tree contains bundled, Hub-managed, protected built-in, external, organization-managed, opted-out, or unprovenanced Skills
- **THEN** the promoter excludes them from absorption
- **AND** it accepts a Hermes candidate only with a valid dedicated `.hermes-evolution.json` marker
- **AND** usage, author, activity, and directory location do not prove Evolution provenance

#### Scenario: Third-party skills are excluded

- **WHEN** the local Codex tree contains a Skill owned by the GitHub/npx lifecycle, repository manifest, system installation, or installed plugin
- **THEN** the promoter excludes it from locally authored candidates
- **AND** it reports the ownership reason when requested

#### Scenario: Promotion and cleanup sets are explicit after discovery

- **WHEN** read-only discovery finds eligible candidates
- **THEN** the promoter displays a table with each Skill name, source mode and exact path, provenance or ownership evidence, file summary, compatibility result and warnings, plugin target and collision resolution, exact original-source removal path, and planned OpenSpec/PR scope
- **AND** every candidate defaults to Skip
- **AND** the user selects the promotion set and any collision resolution in one explicit confirmation before mutation
- **AND** the confirmation states that verified original-source retirement and PR creation are included in the selected run

#### Scenario: Confirmed Hermes adaptation enters Codex staging

- **WHEN** the user confirms an eligible Hermes candidate with a compatible adaptation and no unresolved collision
- **THEN** the promoter creates a provenance-recorded Codex staging tree from reviewed regular files
- **AND** it preserves the Hermes original until a replacement is available and verified in Hermes
- **AND** it does not execute source-provided scripts

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

## ADDED Requirements

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

- **WHEN** a source fingerprint, provenance marker, eligibility classification, replacement load check, or installation verification differs from the reviewed state
- **THEN** the promoter stops before deleting that original and before archive or PR
- **AND** it reports the observed state and retains all unrelated files and sources

#### Scenario: Cleanup is blocked after verification

- **WHEN** permanent deletion of an unchanged, confirmed original is rejected but moving it out of the active Skill root is allowed
- **THEN** the promoter may use a clearly reported reversible retirement path after verifying containment and content again
- **AND** it does not claim permanent deletion or leave the original active

## REMOVED Requirements

### Requirement: User-managed checkout promotion proposal

**Reason**: Clean feature-branch gating blocked discovery and required manual Git preparation contrary to the selected end-to-end workflow.
**Migration**: Discovery ignores caller Git state; confirmed promotion prepares an isolated task checkout and protects unrelated changes.

### Requirement: Selected-checkout plugin installation and cleanup

**Reason**: Optional cleanup and manual Git handoff left duplicate active Skills and stopped before the requested PR.
**Migration**: One candidate confirmation includes verified source retirement and the OpenSpec-to-PR lifecycle; failures preserve original sources.
