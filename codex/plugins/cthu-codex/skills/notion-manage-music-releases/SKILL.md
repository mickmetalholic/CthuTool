---
name: notion-manage-music-releases
description: Manually manage the personal Notion Music Release database with query, create, update, and reversible removal. Use only when explicitly invoked for this library.
---

# Notion · Manage Music Releases

Use this skill only when explicitly invoked. Interpret the user's natural-language
request; no fixed input format or mandatory second confirmation is needed for a
clear, authorized operation. Clarify unresolved identity or scope before affected writes.

## Target and fields

- Database: `https://app.notion.com/p/e50b0eeaf5f14a858c93c5442c0f9d66`
- Data source: `collection://4bc30fee-e028-4593-a505-4c4bfc6cf062`
- People relations (`Artist`, `Conductors`, `Performers`): People Vault,
  `collection://0beb941d-d073-4079-a207-c8126201d1eb`.
- `Works` relation: Classical Work, `collection://97d2982c-2812-48ef-ab37-e919a80a5e4f`.
- Template hint: `01f4c2fa-1bf3-4ca8-a436-a1f609558dd6`; last observed with a gray
  `music-album` icon and `Want to listen` default. Fetch the live template to verify.

Read the live schema relevant to the request. `Name` is a title; `Artist` a
relation; `MusicBrainz Release Group` and `Discogs Master` URLs; `Release Date` and
`Listened Date` dates; `Release Type` a select; `Genre` a multi-select; `Status` a
status; `Score` a number; `Rating` a read-only formula. `Conductors`, `Performers`,
and `Works` are relations. `Composers` and `Work Type` are read-only
rollups through `Works`, sourced from Classical Work's `Composer` and `Work Type`.
`Performers` replaces the previously observed `Ensembles`; `Soloists` is no longer
present. Use verified performer credits, without assuming this rename migrated
all former soloist links. Never send obsolete property names.
Last observed release types:
Album, Single, EP, Broadcast, Other; statuses: Want to listen, Listening, Listened.
Reuse current options. Report incompatible fields before writing them; do not
change schema, views, options, or related People Vault/Classical Work pages as a side effect.
The current SQL schema omits `Composers`, `Work Type`, and `Rating`; use supported
page/rollup reads when needed rather than querying nonexistent columns.

## Basic operations

- **Query:** Search the configured data source, fetch candidates, and return useful
  fields and page links. Use supported structured queries or scoped search; paginate
  when possible and disclose incomplete coverage. A snippet is not identity proof.
- **Create:** Resolve the requested release and check canonical Release Group and
  Master URLs plus title/artist candidates for duplicates. Do not infer absence
  from a partial search. Use the live default template and requested metadata;
  keep personal defaults unless the user specifies otherwise. Return a verified
  cover image or direct image link for manual addition; if unavailable, say so.
- **Update:** Fetch the target, change only requested fields, and preserve other
  values, personal notes, and covers. Missing-metadata completion fills empty fields;
  explicit replacements are allowed. Check template conventions without reapplying
  a template that would duplicate content or reset existing values.
- **Remove:** Identify the exact requested pages and use reversible trash/archive
  only when the connector supports it. If unsupported, explain and provide page
  links for manual removal. Never substitute permanent deletion.

## Essential safeguards

- MusicBrainz **Release Group** is the canonical identity and authority for title,
  artist credits, primary type, and earliest release date. Convert a concrete
  Release URL to its owning group; never use an edition, reissue, or remaster date.
  Do not pad partial dates: report their precision and leave `Release Date`
  unchanged until a full earliest date is verified.
- Discogs **Master** cross-checks title, artist, and year and supplies Genre/Style.
  Prefer a linked Master, verify identity, and reuse existing normalized options.
  Report missing options and source conflicts; do not substitute a concrete Release
  or streaming-service metadata for these authorities.
- Resolve all artist credits against existing People Vault pages: MusicBrainz Artist
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
- `Status`, `Listened Date`, and `Score` are personal fields: edit them only when
  requested. Never infer them from release metadata, write `Rating`, or confuse
  listening dates with release dates. Do not generate personal reviews or notes.
- Verify template application and the consistent icon after creation or update.
  If application fails or the icon is missing, manually copy the live template icon
  using supported tools. Preserve unrelated content; disclose any repair limitation.
- Verify cover identity and image URL against the selected release. Return the image
  or link, without replacing uploaded covers or inventing URLs when access fails.
- Recheck relevant state before writes, clarify intervening conflicts, and refetch
  afterward to verify fields/icon or removal status. Return page links and unresolved
  details. Reconcile uncertain outcomes before retrying, especially after creation.

For Classical Work field/matching details and optional MusicBrainz/Discogs
enrichment, see [matching and resolver notes](references/schema-and-matching.md). Routine queries and personal
field updates do not require that resolver or external metadata searches.
