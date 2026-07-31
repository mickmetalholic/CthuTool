# Album schema and matching contract

## Live data sources

- Album database: `https://app.notion.com/p/e50b0eeaf5f14a858c93c5442c0f9d66`
- Album data source: `4bc30fee-e028-4593-a505-4c4bfc6cf062`
- People Vault data source: `0beb941d-d073-4079-a207-c8126201d1eb`

Always fetch both live schemas before planning a mutation. The IDs are expected
identities, not permission to ignore schema drift.

## Required Album properties

| Property | Type | Meaning |
| --- | --- | --- |
| Name | title | MusicBrainz Release Group title |
| Artist | relation | Existing People Vault pages |
| Release Date | date | Full `first-release-date` from MusicBrainz Release Group |
| Release Type | select | MusicBrainz primary Release Group type |
| Genre | multi-select | Confirmed Discogs Master genres and styles |
| MusicBrainz Release Group | URL | Canonical abstract Release Group URL only |
| Discogs Master | URL | Canonical Discogs Master URL only |
| Status | status | Personal data; never write in this workflow |
| Listened Date | date | Personal data; never write in this workflow |
| Score | number | Personal data; never write in this workflow |
| Rating | formula | Personal data; never write in this workflow |

`Artist` must target People Vault. People Vault must have a
`MusicBrainz Artist` URL property.

## Property descriptions

If the connector cannot write property descriptions, apply these exact descriptions
manually in Notion and refetch the data sources to verify the property names and
types afterward:

- `Artist`: Relation to existing People Vault artist records; resolve by MusicBrainz Artist URL first.
- `Release Date`: Earliest full MusicBrainz Release Group first-release-date; never use an edition or reissue date.
- `Release Type`: MusicBrainz Release Group primary type.
- `Genre`: Controlled vocabulary sourced from confirmed Discogs Master genres and styles.
- `MusicBrainz Release Group`: Canonical abstract MusicBrainz Release Group URL only, never a concrete Release URL.
- `Discogs Master`: Canonical Discogs Master URL used for cross-validation and Genre provenance.
- `MusicBrainz Artist`: Canonical MusicBrainz Artist URL for stable People Vault identity.

## Matching thresholds

- Eligible MusicBrainz recommendation: score at least `80` and at least `8`
  points above the next eligible candidate.
- Eligible Discogs recommendation: score at least `78` and at least `8` points
  above the next Master candidate.
- A direct valid identifier bypasses search ranking, but never bypasses identity,
  type, edition, date, or artist conflict checks.
- Allowed MusicBrainz primary types for the initial schema are `Album`, `Single`,
  `EP`, `Broadcast`, and `Other`. A new upstream primary type must be previewed and
  added as a select option only after confirmation.

## Authority and conflict rules

MusicBrainz Release Group is authoritative for canonical name, artist credits,
primary type, and earliest release date. Discogs Master cross-checks title, artist,
and year and supplies Genre/Style. Streaming services are links only and cannot
replace core metadata.

Block instead of writing when candidates are ambiguous, an artist is missing or
conflicting, a concrete edition qualifier cannot be reconciled, years conflict, or
a non-empty Notion value differs. Replacing an existing value requires a later
preview naming that field and explicit field-specific approval.

## Notion query fallback

Prefer a parameterized data-source query when the connector exposes one. If it is
unavailable, read the configured database view or use scoped Notion search, fetch
every candidate page, and perform canonical URL and normalized-name comparisons
locally. Never treat an unfetched search snippet as proof of a duplicate or artist
identity.
