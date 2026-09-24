## Why

Channel Library maintenance currently has an add-only skill with a rigid multi-step workflow. Users need one lightweight, explicitly invoked entrypoint for adding, finding, editing, and removing Notion channel records.

## What Changes

- **BREAKING**: Replace `notion-add-channel` with `notion-manage-channels`; keep manual invocation and migrate README/docs.
- Support natural-language CRUD and batches without requiring a channel URL for existing-record lookup, updates, or deletion.
- Preserve platform identity matching, live schema discovery, existing tag options, and read-only access to explicitly selected browser tabs.
- Distinguish tag addition, removal, and replacement; permit explicitly delegated automatic classification without redundant confirmation, clarifying ambiguous choices.
- Use platform templates and repair their icons when application fails. Report batch outcomes individually; unresolved items do not block independent ready items.
- Scope removal to reversible Notion trash/archive where supported; never follow/unfollow or change platform accounts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `codex-plugins-cthu-codex-notion-channel-skill`: Replace the add-only contract with explicit-only channel management, scoped browser access, tag edit semantics, template fallback, and per-item results.

## Impact

Only the channel skill source, plugin README, channel documentation section, and this change's planning artifacts are affected. No new runtime dependency, service, database migration, or live Notion write is required. Book-library PR #81 remains independent and unmerged; this change does not install the plugin or merge either PR.
