## Why

The Music Release database is already targeted by the album maintenance skill, but its mandatory preview workflow and metadata-only scope make routine management cumbersome. Use the same lightweight, manual-only CRUD approach as the other personal libraries.

## What Changes

- **BREAKING**: Replace `notion-maintain-album` with `notion-manage-music-releases`, invoked manually only.
- Support query, create, scoped update, and reversible removal, including explicitly requested listening fields.
- Preserve canonical MusicBrainz Release Group, Discogs Master, date precision, and People Vault identity safeguards.
- Use the live template, repair its icon when needed, and return verified cover images or links on creation.
- Retain the existing read-only resolver as an optional helper; remove mandatory preview, implicit invocation, and incidental schema/People Vault writes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `codex-plugins-cthu-codex-notion-album-skill`: Replace the album-only workflow with lightweight Music Release management.

## Impact

Business plugin skill directory and metadata, its resolver test paths, obsolete prose contract tests, plugin README, documentation, and the existing capability spec. No live Notion writes, new dependencies, generated adapters, or unrelated library changes.
