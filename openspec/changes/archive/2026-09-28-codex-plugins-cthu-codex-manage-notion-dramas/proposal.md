## Why

Drama Library has no dedicated management skill. Add the same lightweight, manual-only CRUD interface as the other personal libraries while preserving series/season identity and episode-count meaning.

## What Changes

- Add `notion-manage-dramas`, displayed under Notion and invoked manually only.
- Support natural-language query, create, scoped update, and connector-supported reversible removal.
- Respect the live Drama Library schema, existing Category/Genres options, People Vault relations, and user-owned viewing data.
- Verify series versus season scope, canonical IMDb/TMDB TV or fallback Reference identity, episode counts, and release dates.
- Use the live template with consistent icon repair and return verified poster images or direct links for manual addition.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-notion-drama-library-skill`: Manual Drama Library CRUD with series/season identity, template, and personal-data safeguards.

### Modified Capabilities

None.

## Impact

A new instruction-only skill and invocation metadata, plugin README and docs, and one new capability. No scripts, dependencies, backend integration, live Notion writes, unrelated library changes, or generated adapter edits.
