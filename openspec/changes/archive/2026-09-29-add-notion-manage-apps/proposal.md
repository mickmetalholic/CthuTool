## Why

App Vault needs the same manual CRUD interface as the other personal Notion libraries. App identity, platform choices, and existing knowledge links require guidance specific to this database.

## What Changes

- Add `notion-manage-apps` with explicit invocation and lightweight CRUD.
- Preserve app identity, existing taxonomy, knowledge relations, and page content.
- Handle unavailable templates explicitly and return verified app artwork for manual addition.
- Document the skill alongside existing library skills.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-notion-app-vault-skill`: Manual management of App Vault records.

### Modified Capabilities

None.

## Impact

Only the requested business plugin skill, docs, and scoped OpenSpec artifacts. No live Notion writes, software installation, new dependencies, or generated adapter changes.
