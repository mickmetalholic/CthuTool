## MODIFIED Requirements

### Requirement: Explicit local GitHub skill tracking

The CLI SHALL let users explicitly adopt eligible locally installed GitHub skills into repository desired state without copying or reinstalling them. Codex skills produced by the Hermes absorption bridge are handled by the separate promotion action and are not treated as GitHub-tracking candidates unless they independently satisfy the GitHub provenance contract.

#### Scenario: Eligible local-only skill is discovered

- **WHEN** the pinned backend reports a locally installed skill absent from the manifest with a supported GitHub repository and unambiguous skill selector or path
- **THEN** `chc codex skills` includes it in the inventory with state `local_only`
- **AND** the row offers Track and no action as its valid actions

#### Scenario: Tracking metadata is completed explicitly

- **WHEN** a user selects Track for a local-only skill
- **THEN** the command requires an explicit branch-tracking or pin decision and a non-empty ref before creating the plan
- **AND** backend metadata may be presented as a default but does not silently determine the tracking policy

#### Scenario: Track plan is manifest-only

- **WHEN** a valid Track selection is presented for review
- **THEN** the plan shows the GitHub repository, selector, tracking type, ref, and manifest addition
- **AND** it states that the existing local installation will not be installed, updated, removed, or copied

#### Scenario: Confirmed Track writes desired state

- **WHEN** the user confirms a Track item whose source validates successfully
- **THEN** the command atomically upserts an enabled version 2 manifest entry with the reviewed source metadata
- **AND** it does not invoke a backend lifecycle mutation for that skill

#### Scenario: Unsupported local source stays unmanaged

- **WHEN** a local skill is self-authored, manually copied, well-known, plugin-provided, system-provided, non-GitHub, or missing supported provenance and has no valid Hermes-absorption provenance record selected for promotion
- **THEN** the command does not list it as GitHub-trackable or add it to the manifest
- **AND** it does not modify or name that local skill in the GitHub-tracking inventory

#### Scenario: Track cancellation preserves state

- **WHEN** the user cancels metadata collection, leaves Track unselected, or declines the reviewed plan
- **THEN** neither the local installation nor the manifest is changed

## ADDED Requirements

### Requirement: Explicit promotion of Codex skills absorbed from Hermes

The CLI SHALL expose a reviewed promotion action within `chc codex skills` for local Codex skills carrying a valid Hermes-absorption provenance record. Promotion SHALL be separate from GitHub tracking and SHALL publish the adapted skill into the repository's first-party Codex skill source without invoking the `npx skills` lifecycle backend.

#### Scenario: Promotion inventory contains only absorbed candidates

- **WHEN** the user chooses Promote absorbed skills from the interactive `chc codex skills` menu
- **THEN** the command lists only valid Hermes-absorption-marked local Codex skills that are not already represented by the repository plugin source
- **AND** arbitrary local, system, plugin-managed, or manifest-managed skills are not offered by this action

#### Scenario: Promotion plan identifies the adapted source

- **WHEN** the user selects an absorbed skill for promotion
- **THEN** the reviewed plan shows the Hermes source provenance, adapted Codex skill, target repository path under the first-party Codex plugin, and files to be added or changed
- **AND** it states that no GitHub manifest entry or `npx skills` lifecycle operation will be performed

#### Scenario: Confirmed promotion writes repository source

- **WHEN** the user confirms a promotion plan and the source provenance and target path validate successfully
- **THEN** the command writes the adapted Codex skill and its required support and plugin metadata files into the repository-managed first-party plugin source
- **AND** it preserves the Hermes provenance in repository-readable metadata
- **AND** it does not modify Hermes or unrelated repository skills

#### Scenario: Repository collision requires explicit resolution

- **WHEN** the promotion target already exists or its provenance conflicts with the selected absorbed skill
- **THEN** the command reports the collision and presents a diff or explicit replace/merge choice
- **AND** it does not overwrite the repository target until the user confirms that resolution

#### Scenario: Promotion cancellation is side-effect free

- **WHEN** the user cancels the promotion plan or declines confirmation
- **THEN** no local Codex skill, Hermes skill, repository skill, or manifest content is changed

#### Scenario: JSON promotion inventory is read-only

- **WHEN** the user runs `chc codex skills --json`
- **THEN** the JSON result includes Hermes-absorption-marked promotion candidates and their available promotion state
- **AND** it performs no target copy, repository write, manifest write, or backend lifecycle mutation
