## Why

The personal Comic Book Library needs lightweight manual CRUD guidance that respects comic works, parts, volumes, and multiple creators. Reusing book instructions verbatim would assume absent fields and conflate publication completion with personal reading state.

## What Changes

- Add explicit-only `notion-manage-comics` in the existing Notion naming family, with natural-language CRUD and no fixed input format.
- Preserve work/part/volume/edition identity, multiple authors, shared access relations, and personal notes and scores.
- Use the current comic template, repair its shared icon if necessary, and return a verified cover image or direct link for each new entry.
- Work with the live schema without adding absent Genres, Series, Finished, or reading-progress fields; keep reading status distinct from serialization status.
- Document the skill, validate it, sync its new main specification, and archive this change independently of the book/channel changes.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-notion-comic-library-skill`: Explicit-only comic-library CRUD with comic identity, multi-author preservation, template/icon consistency, and manual cover handoff.

### Modified Capabilities

None.

## Impact

Adds a two-file authored skill under `codex/plugins/cthu-codex/skills/notion-manage-comics`, a short documentation entry, and its OpenSpec artifacts. Uses existing Notion tools and public metadata lookup only as needed. No new dependencies, generated adapter changes, database migration, live record mutations, plugin installation, PR creation, or merge is included.
