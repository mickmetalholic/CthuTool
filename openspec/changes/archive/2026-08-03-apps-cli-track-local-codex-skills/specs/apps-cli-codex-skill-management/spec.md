## ADDED Requirements

### Requirement: Explicit local GitHub skill tracking
The CLI SHALL let users explicitly adopt eligible locally installed GitHub skills into repository desired state without copying or reinstalling them.

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
- **WHEN** a local skill is self-authored, manually copied, well-known, plugin-provided, system-provided, non-GitHub, or missing supported provenance
- **THEN** the command does not list it as trackable or add it to the manifest
- **AND** it does not modify or name that local skill in human or JSON output

#### Scenario: Track cancellation preserves state
- **WHEN** the user cancels metadata collection, leaves Track unselected, or declines the reviewed plan
- **THEN** neither the local installation nor the manifest is changed

## MODIFIED Requirements

### Requirement: Interactive Codex skill manager
The CLI SHALL expose `chc codex skills` as the interactive manager for manifest-managed third-party Codex skills and eligible locally installed GitHub skills.

#### Scenario: Reconciliation inventory is shown
- **WHEN** a user runs `chc codex skills` in an interactive terminal
- **THEN** the command lists enabled and disabled manifest entries together with eligible backend-managed GitHub installations absent from the manifest
- **AND** each row shows the skill name, GitHub source, local or desired-state classification, available upstream state when known, and selected action

#### Scenario: Valid actions depend on state
- **WHEN** the user focuses a skill row and presses Space
- **THEN** the row cycles only through actions valid for its current state, including track, install, replace, update, enable, remove, or no action as applicable
- **AND** a current manifest-managed installation does not offer a redundant lifecycle mutation

#### Scenario: Unmanaged local skills are ignored
- **WHEN** a local skill is absent from the manifest and the pinned backend cannot provide supported GitHub provenance for explicit tracking
- **THEN** `chc codex skills` does not list, import, update, remove, or otherwise modify that skill

#### Scenario: Empty reconciliation inventory is actionable
- **WHEN** neither manifest entries nor eligible local-only GitHub skills exist
- **THEN** the command reports that no tracked or trackable GitHub skills were found
- **AND** it directs the user to Add skills from GitHub instead of reporting that no changes were selected

#### Scenario: Unchanged selections are distinguished from an empty inventory
- **WHEN** the command displays one or more actionable rows and the user presses Enter while every row remains at no action
- **THEN** the command reports `No changes selected.`
- **AND** it performs no local or manifest mutation
