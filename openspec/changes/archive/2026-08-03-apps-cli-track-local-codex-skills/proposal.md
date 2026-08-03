## Why

`chc codex skills` currently builds its inventory only from `codex/skills.manifest.json`, so an empty manifest hides locally installed GitHub skills even when the pinned `skills` backend has enough provenance to reproduce them. Users need an explicit, reviewed way to adopt those eligible local installations into repository desired state without vendoring their files or importing unrelated local skills.

## What Changes

- Build the interactive and JSON inventories from the union of manifest entries and locally installed skills whose pinned-backend metadata identifies a supported GitHub source.
- Classify eligible installations missing from the manifest as `local_only` and offer an explicit Track action that writes reproducible source metadata to `codex/skills.manifest.json` without reinstalling or copying the skill.
- Keep local self-authored, manually copied, well-known, plugin-provided, system, and otherwise unsupported or provenance-incomplete skills hidden and untouched.
- Require the user to review and confirm local-to-manifest additions; never import local skills automatically.
- Distinguish an empty managed set from an unchanged action plan so the interactive UI gives actionable guidance instead of the ambiguous `No changes selected.` message.
- Extend read-only JSON output, backend contract validation, documentation, and tests for eligible local-only skills and Track behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-cli-codex-skill-management`: Extend reconciliation to display backend-managed GitHub skills that exist only locally and let users explicitly track their reproducible source metadata in the repository manifest.

## Impact

- Affected CLI code: Codex skills backend metadata parsing, inventory classification, interactive action table, plan execution, JSON output, and human status messages.
- Affected repository state: confirmed Track actions add deterministic version 2 entries to `codex/skills.manifest.json`; no skill directories are copied into the repository.
- Affected tests and docs: backend lock-contract fixtures, inventory/plan unit tests, CLI integration tests, and Codex skills documentation.
- No new runtime dependency is introduced; the feature remains bounded to the pinned `npx skills` contract and Codex user scope.
