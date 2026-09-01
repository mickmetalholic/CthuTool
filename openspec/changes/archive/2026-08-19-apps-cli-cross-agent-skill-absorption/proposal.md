## Why

Hermes and Codex skills are intentionally managed in different ways, so mirroring their skill directories would create conflicts, overwrite local work, and spread machine-specific changes. CthuTool needs a Codex-side workflow that can inspect a selected eligible Hermes skill and adapt it into Codex without taking ownership of Hermes's skill lifecycle.

## What Changes

- Add a Codex-side bridge skill that reads eligible local Hermes skills and absorbs a user-selected skill into Codex after showing an adapted preview.
- Restrict Hermes candidates to an explicit evolution provenance marker, while excluding bundled skills, Skills Hub skills, external or organization-managed skills, and any skill without reliable provenance. Do not infer eligibility from a directory name, activity, or `author` field.
- Keep Hermes discovery read-only. Do not add a Hermes bridge skill, write Hermes skill files, install Hermes assets, or manage Hermes lifecycle state in CthuTool.
- Keep the source skill unchanged during inspection and absorption. Require explicit confirmation, report collisions, preserve provenance, and never silently overwrite or delete an existing skill.
- Keep `chc codex skills` as the single Codex-skill-to-repository synchronization command. Add an explicit promotion path for bridge-marked, absorbed Codex skills; do not automatically mirror either skill directory.
- Promote the adapted Codex version to the repository, rather than copying the raw Hermes file, and keep ordinary unmanaged local Codex skills outside the command's inventory.

## Capabilities

### New Capabilities

- `apps-cli-cross-agent-skill-absorption`: Inspect, adapt, review, and explicitly absorb eligible local Hermes skills into Codex without directory mirroring.

### Modified Capabilities

- `apps-cli-codex-skill-management`: Allow explicitly absorbed, bridge-marked local Codex skills to be promoted into repository-managed skill sources while continuing to ignore arbitrary unmanaged local skills.

## Impact

- Adds one Codex bridge skill and its documentation/deployment assets.
- Extends the Codex skill manager's inventory, reviewed plan, provenance, and repository promotion behavior.
- Requires read-only discovery of Hermes local metadata such as the bundled manifest, Hub lock, and evolution provenance records.
- Adds fixtures and tests for built-in exclusion, evolution-created candidate filtering, adaptation, collisions, cancellation, and promotion.
- Does not add or deploy a Hermes skill, change Hermes's local skill lifecycle, invoke Hermes's remote sync plane, or modify Hermes files.
