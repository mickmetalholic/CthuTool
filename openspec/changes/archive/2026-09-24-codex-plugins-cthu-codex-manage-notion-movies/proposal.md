## Why

Movie Library already has a skill, but its long add-only confirmation workflow cannot manage existing records and references obsolete fields. Bring it in line with the other lightweight, manually invoked library skills using the verified live schema.

## What Changes

- **BREAKING**: Disable implicit invocation of `notion-manage-movies`; keep its name and Notion display grouping.
- Replace the reviewed single-add workflow with query, create, scoped update, and reversible removal driven by clear user instructions.
- Use current `IMDb` and `TMDB` URL properties and `Watched Date`; distinguish writable personal values from formulas.
- Resolve Director and Cast through existing People Vault records without incidental related-page creation or schema changes.
- Use the live template, repair its icon if needed, and output verified poster images or links for manual addition.
- Retain public identity evidence, duplicate prevention, private retrieval boundaries, and verification safeguards without mandatory repeated confirmation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `codex-plugins-cthu-codex-notion-movie-library-skill`: Lightweight manual Movie Library CRUD and current schema semantics replace the old add-only workflow.

## Impact

Only this business plugin skill, its invocation metadata, plugin README, movie documentation section, and selected OpenSpec capability. No new runtime dependencies, backend integration, generated adapter edits, or live Notion record mutations.
