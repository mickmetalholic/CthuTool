## Why

The Animation Library needs the same lightweight, manually invoked CRUD support as the other personal Notion libraries. Animation-specific scope and voice-credit distinctions must be preserved during matching and metadata completion.

## What Changes

- Add `notion-manage-animation` for live-schema query, creation, scoped updates, and reversible removal.
- Include template/icon verification, manual poster output, role-aware existing people relations, and personal-field protection.
- Document the new entry point without adding a runtime helper.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-notion-animation-library-skill`: Manual management of the personal Animation Library.

### Modified Capabilities

None.

## Impact

The explicitly requested business plugin skill and documentation, plus this capability's OpenSpec artifacts. No generated adapters, dependencies, live records, or other library skills change.
