## Why

The Documentary Library needs the same lightweight manual CRUD interface as the other personal Notion libraries. Its film, series, season, and episode records require scope-aware matching to avoid duplicate or incorrect entries.

## What Changes

- Add `notion-manage-documentaries` with explicit-only invocation and live schema discovery.
- Cover basic CRUD, template/icon verification, manual image output, and protection of viewing and collection fields.
- Document the skill alongside existing Notion library skills.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-notion-documentary-library-skill`: Manual management of the personal Documentary Library.

### Modified Capabilities

None.

## Impact

Only the explicitly requested business plugin skill, its documentation, and this OpenSpec capability change. No runtime dependencies, generated adapters, or live Notion records change.
