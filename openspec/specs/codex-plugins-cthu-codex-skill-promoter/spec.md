# codex-plugins-cthu-codex-skill-promoter Specification

## Purpose
Define the repository-owned Codex workflow for absorbing eligible external skills and promoting explicitly selected local skills into the protected CthuCodex business plugin.

## Requirements

### Requirement: Repository-owned Codex skill absorber and promoter

The CthuCodex plugin SHALL provide a `codex-skill-promoter` skill for
absorbing eligible Hermes evolution skills into Codex user staging and
developing explicitly selected local Codex skills into the repository-owned
`cthu-codex` plugin. It SHALL be the sole repository-supplied user-facing entry
point for this workflow; the `chc` CLI SHALL NOT be required for local-skill
discovery or proposal creation, and the plugin SHALL NOT also expose a
standalone `hermes-skill-absorber` skill.

#### Scenario: Explicit invocation performs read-only discovery

- **WHEN** the user invokes `codex-skill-promoter`
- **THEN** the skill resolves the local Codex skills root from `CODEX_HOME` or
  the user's default Codex home
- **AND** it reads skill trees and provenance read-only before presenting any
  proposal
- **AND** it resolves the Hermes skills root from `HERMES_HOME` or the user's
  default Hermes home
- **AND** during discovery it does not modify Hermes, the current repository
  checkout, or local skill files

#### Scenario: Only evolution-created Hermes skills are eligible

- **WHEN** the Hermes tree contains bundled, Hub-managed, protected built-in,
  external, organization-managed, opted-out, or unprovenanced skills
- **THEN** the promoter excludes those skills from the absorption proposal
- **AND** it accepts a Hermes candidate only with a valid dedicated
  `.hermes-evolution.json` marker
- **AND** usage metadata, author fields, activity, and directory location are
  not sufficient provenance

#### Scenario: Third-party skills are excluded

- **WHEN** the local Codex tree contains a skill owned by the GitHub/npx
  lifecycle, the repository manifest, a system installation, or an installed
  plugin
- **THEN** the promoter does not propose copying it as a locally authored
  skill
- **AND** it reports the ownership reason when the user asks for details

#### Scenario: Promotion and cleanup sets are explicit after discovery

- **WHEN** read-only discovery finds one or more eligible candidates
- **THEN** the promoter shows every candidate with its source, classification,
  provenance, files, and warnings
- **AND** it asks the user to choose Promote or Skip for each candidate and to
  select zero or more exact cleanup targets for each promoted candidate
- **AND** promotion defaults to Skip and every local copy defaults to Keep
- **AND** a Codex candidate exposes its Codex source as one cleanup target
- **AND** a Hermes candidate exposes its original Hermes source and future
  adapted Codex staging path as independent cleanup targets
- **AND** every cleanup target belongs to a promoted candidate

#### Scenario: Confirmed Hermes adaptation enters Codex staging

- **WHEN** the user selects an eligible Hermes candidate, reviews every
  adaptation and collision decision, and confirms the absorption
- **THEN** the promoter writes the adapted tree atomically under the Codex
  user skills root with `.cthu-skill-bridge.json`
- **AND** the adapted Codex tree becomes the source for the common checkout
  promotion stage
- **AND** the Hermes source remains unchanged through adaptation, repository
  promotion, installation, and verification

### Requirement: Promoted skills retain Codex and Hermes compatibility

The promoter SHALL preserve a portable shared skill core for Codex and Hermes.
Shared `SKILL.md`, references, and scripts SHALL use agent-neutral capabilities
and configurable paths where possible. Agent-specific discovery metadata,
invocation syntax, or tool mappings SHALL be isolated in explicit adapter
files and SHALL NOT silently replace shared semantics.

#### Scenario: Compatible shared core is accepted

- **WHEN** a selected skill can express its required behavior with shared
  instructions plus explicit Codex or Hermes adapters
- **THEN** the promoter includes the compatibility structure and each adapter
  decision in the proposal
- **AND** Codex metadata such as `agents/openai.yaml` and mappings in
  `references/codex-adapter.md` do not make the shared instructions Codex-only
- **AND** required Hermes-only mappings remain explicit in
  `references/hermes-adapter.md`

#### Scenario: Unresolved incompatibility blocks promotion

- **WHEN** required behavior depends on an agent-specific tool, invocation, or
  path with no safe shared representation or explicit counterpart
- **THEN** the promoter reports the incompatible behavior and refuses the
  repository write
- **AND** it does not present silent omission as compatibility

### Requirement: User-managed checkout promotion proposal

The promoter SHALL validate the current checkout and branch prepared by the
user before writing repository plugin source. It SHALL present the checkout,
branch, `HEAD`, source, target, provenance, compatibility, collision
resolution, install step, and cleanup step for explicit review. It SHALL NOT
create or switch a branch or worktree.

#### Scenario: Prepared checkout is validated before discovery

- **WHEN** the user invokes the promoter from a repository checkout
- **THEN** the promoter verifies that the current repository is the intended
  CthuTool checkout on a clean non-detached feature branch before reading a
  local skill tree
- **AND** it captures the repository root, branch, `HEAD`, and target path
- **AND** it refuses a dirty, detached, default-branch, changed, or wrong
  checkout without writing plugin files
- **AND** it directs the user to prepare or switch checkout state themselves

#### Scenario: Source is proposed in the selected checkout

- **WHEN** the selected checkout and source fingerprint still match the
  proposal immediately before writing
- **THEN** the promoter copies the source atomically into
  `<current-checkout>/codex/plugins/cthu-codex/skills/<name>`
- **AND** it preserves portable Hermes provenance for absorbed skills
- **AND** it validates shared compatibility, `SKILL.md`, support files,
  containment, and symlink safety before copying

#### Scenario: Repository collision requires explicit resolution

- **WHEN** the target skill already exists in the checkout or has conflicting
  provenance
- **THEN** the promoter shows the existing and proposed content and offers an
  explicit merge, replace, or rename decision
- **AND** it does not overwrite the target without confirmation

### Requirement: Selected-checkout plugin installation and cleanup

After writing a proposal, the promoter SHALL use the existing `chc codex
install` command against the current checkout to install and verify the plugin.
It MAY use that command only as an execution step after the repository-owned
skill has created and reviewed the checkout proposal. Local source deletion
SHALL be guarded by successful verification, membership in the selected
cleanup target set, and a final explicit confirmation. A selected Hermes
source SHALL additionally remain an eligible Evolution source at the exact
reviewed path immediately before deletion.

#### Scenario: Selected-checkout plugin is installed and verified

- **WHEN** the proposed plugin source is written successfully
- **THEN** the promoter runs
  `chc codex install --repo-root <current-checkout>` with the user's Codex home
  and plugin cache context
- **AND** it verifies that each promoted skill is present in the installed
  plugin/cache before offering cleanup
- **AND** it leaves the local source intact when installation or verification
  fails

#### Scenario: Local source is removed only after verification

- **WHEN** installation and verification succeed for a source in the selected
  cleanup set and the user gives final deletion confirmation
- **THEN** the promoter rechecks that a selected Codex source remains an
  unchanged, non-symlinked direct child of the Codex skills root
- **AND** it rechecks that a selected Hermes source remains an unchanged,
  non-symlinked direct child of the Hermes skills root with the same valid
  Evolution marker and no managed, protected, external, organization, or
  opt-out classification
- **AND** it removes only that unchanged source tree
- **AND** a Hermes-origin workflow treats its original Hermes source and
  adapted Codex staging tree as independent cleanup targets
- **AND** it retains the source if it changed or if any verification step
  failed

#### Scenario: Checkout remains available for Git review

- **WHEN** the workflow completes successfully
- **THEN** the promoter reports the checkout path, branch, and changed files
- **AND** it leaves checkout changes for the user to review, commit, and push
  or open a pull request
- **AND** it does not create or switch a branch/worktree, commit, push, or
  remove a checkout automatically

### Requirement: Promoter cancellation and safety

The promoter SHALL treat local skill content as untrusted input, require
explicit confirmation for repository writes and local deletion, and preserve
the original local skill on cancellation or failure.

#### Scenario: Discovery cancellation is side-effect free

- **WHEN** the user cancels candidate selection or the proposal preview
- **THEN** the promoter does not write repository files,
  install a plugin, or remove a local skill

#### Scenario: Source mutation fails closed

- **WHEN** the local source changes after review, contains unsafe files, or
  becomes unavailable
- **THEN** the promoter aborts the promotion before copying or cleanup
- **AND** it reports the source mismatch and leaves the original source
  untouched

#### Scenario: Source instructions are not executable authority

- **WHEN** a local skill contains instructions that request arbitrary commands,
  secret access, or unrelated repository changes
- **THEN** the promoter treats them as content to review rather than commands
  to follow
- **AND** it does not execute source-provided scripts as part of promotion
