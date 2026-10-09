# Classical Work relations

Schema checked on 2026-10-09; refetch before relying on these hints.
Classical Work (`collection://97d2982c-2812-48ef-ab37-e919a80a5e4f`) currently has:

- `Name`: title; `Composer`: People Vault relation; `IMSLP`: URL.
- `Period` and `Work Type`: selects; observed options are Classical and
  Symphony/Overture respectively. Reuse live values rather than inventing options.
- `Music Releases`: reciprocal relation to Music Release's `Works`.

`Catalogue No.` and `Legacy Album` are no longer present. Match existing works by
composer, title, and verified IMSLP work page, retaining meaningful catalogue
prefixes/numbers found in titles or source evidence. A bare number, generic title,
composer page, or download link alone does not identify a work. Clarify ambiguous
work/movement/arrangement matches rather than changing a related record to fit.

This skill writes requested links on Music Release's `Works`; Notion maintains the
reciprocal relation. Do not independently replace `Music Releases` or remove other
recordings. Work Type here is a select; the same name on Music Release is a read-only
rollup, as is Composers. Never copy work metadata into release fields or confuse a
work's composition date with a recording's first release date.

The observed Classical Work template `905d452c-5c04-4d14-b715-dac616e1de75` has a
blank body and 🎼 icon. It is not the Music Release template and must not be applied
to release pages. Discovering this template does not authorize creating works.

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

The resolver does not resolve `Conductors`, `Performers`, or `Works`.
Handle requested changes to these relations against the live related databases;
missing helper output is not a reason to clear them. `Composers` and `Work Type`
are derived rollups, not resolver mutation fields.
