# Optional metadata resolver

`scripts/resolve-album.mjs` is a standalone, read-only MusicBrainz Release Group
and Discogs Master helper. Use it when metadata enrichment benefits from candidate
ranking; it is not the CRUD interface and its output never authorizes a write.
Resolve its path relative to this skill directory, including in installed plugins.

Pass JSON through stdin, for example:

```json
{"operation":"check","title":"Paranoid","artist":"Black Sabbath"}
```

Run with `node scripts/resolve-album.mjs` from this skill directory. A direct
MusicBrainz URL may be passed in `raw`; a concrete Release resolves to its group.
The helper uses an identifying User-Agent and serial, bounded requests. Discogs
search requires `DISCOGS_TOKEN`; direct Master lookup can work without it. Report
blocked lookups, never expose credentials, and retain useful source links rather
than dumping raw upstream payloads.

Recommendations require score 80 for MusicBrainz or 78 for Discogs and an 8-point
margin. Direct identifiers skip ranking, not identity and conflict checks.
MusicBrainz owns core metadata; Discogs supplies confirmed Genre/Style. Partial
dates remain partial. A score alone neither resolves conflicting evidence nor
expands the user's request.

Legacy helper exports remain metadata-only: `buildAlbumMutationPayload` excludes
personal fields, `buildFieldPreview` can illustrate differences, and artist or
option helpers can suggest missing values. Do not execute suggested People Vault
updates or option creation. Follow SKILL.md for authorization, current schema,
existing options, template/icon, covers, and direct personal-field CRUD.
