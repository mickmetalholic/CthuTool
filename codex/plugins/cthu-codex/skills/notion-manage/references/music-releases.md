# Music Releases

## Target and fields

- Database: `https://app.notion.com/p/e50b0eeaf5f14a858c93c5442c0f9d66`
- Data source: `collection://4bc30fee-e028-4593-a505-4c4bfc6cf062`
- People relations (`Artist`, `Conductors`, `Performers`): People & Organizations,
  `collection://0beb941d-d073-4079-a207-c8126201d1eb`.
- `Works` relation: Classical Work, `collection://97d2982c-2812-48ef-ab37-e919a80a5e4f`.
- Template hint: `01f4c2fa-1bf3-4ca8-a436-a1f609558dd6`; last observed with a gray
  `music-album` icon and `Want to listen` default. Fetch the live template to verify.

Read the live schema relevant to the request. `Name` is a title; `Artist` a
relation; `MusicBrainz Release Group` and `Discogs Master` URLs; `Release Date` and
`Listened Date` dates; `Release Type` a select; `Genres` a multi-select; `Status` a
status; `Score` a number; `Rating` a read-only formula. `Conductors`, `Performers`,
and `Works` are relations. `Composers` and `Work Type` are read-only
rollups through `Works`, sourced from Classical Work's `Composer` and `Work Type`.
`Performers` replaces the previously observed `Ensembles`; `Soloists` is no longer
present. Use verified performer credits, without assuming this rename migrated
all former soloist links. Never send obsolete property names.
Last observed release types:
Album, Single, EP, Broadcast, Other; statuses: Want to listen, Listening, Listened.
Reuse current options. Report incompatible fields before writing them; do not
change schema, views, options, or related People & Organizations/Classical Work pages as a side effect.
The current SQL schema omits `Composers`, `Work Type`, and `Rating`; use supported
page/rollup reads when needed rather than querying nonexistent columns.

## Essential safeguards

- For classical releases, leave `Artist` and `Genres` unset on creation and omit
  them from enrichment writes. Their absence is intentional, not a completeness
  defect. Identify the release with its source records and role-specific
  `Conductors`, `Performers`, and `Works`; `Composers` and `Work Type` remain rollups.
  Do not clear existing values incidentally. If classical/non-classical scope is
  unclear, resolve it before choosing the fields to write.

- MusicBrainz **Release Group** is the canonical identity and authority for title,
  artist credits, primary type, and earliest release date. Convert a concrete
  Release URL to its owning group; never use an edition, reissue, or remaster date.
  Do not pad partial dates: report their precision and leave `Release Date`
  unchanged until a full earliest date is verified.
- Discogs **Master** cross-checks title, artist, and year and supplies Genre/Style for non-classical releases.
  Prefer a linked Master, verify identity, and reuse existing normalized options.
  Report missing options and source conflicts; do not substitute a concrete Release
  or streaming-service metadata for these authorities.
- For non-classical releases, resolve artist credits against existing People & Organizations pages: MusicBrainz Artist
  URL first, then a unique exact normalized name without a conflicting identifier.
  Fetch the relation schema and candidate pages; clarify missing or ambiguous artists
  before the affected write. Do not create artists or fill their identifiers here.
- Apply the same identity checks to `Conductors` and `Performers`,
  using verified role-specific credits; do not copy the entire `Artist` list into
  those fields. Link `Works` only to verified existing Classical Work pages,
  matching composer, work title, and IMSLP identity; use catalogue details in verified
  titles/sources when available, not a presumed catalogue property. Distinguish a
  complete work from a movement, excerpt, or arrangement. A release may link multiple
  works; preserve unrelated links. Different recordings of the same work remain
  distinct releases. Clarify ambiguous matches and do not create or edit related
  pages as a side effect.
  Never write `Composers` or `Work Type` directly or change a work to force a rollup.
- Follow [cover handling](covers.md), matching the selected release; cover sourcing
  does not change MusicBrainz/Discogs metadata authority.

For requested `Works` matching, read [Classical Work](classical-works.md).
For optional MusicBrainz/Discogs enrichment, read [resolver notes](music-resolver.md).
Routine queries and personal-field updates need neither resolver nor public enrichment.
