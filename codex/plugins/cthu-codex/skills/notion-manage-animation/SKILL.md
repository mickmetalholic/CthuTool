---
name: notion-manage-animation
description: Manually manage the personal Notion Animation Library with query, creation, scoped updates, and reversible removal. Use only when explicitly invoked for this library.
---

# Notion · Manage Animation

Use only when explicitly invoked. Interpret natural-language requests; clear intent
and targets authorize the operation without mandatory second confirmation. Clarify
unresolved identity or scope before affected writes.

## Target and fields

- Database: `https://app.notion.com/p/830265c59ff741d2b670342ebe1bea9a`.
- Data source hint: `collection://2c140453-fba0-4615-b012-d5c1d84a6e7d`.
- People Vault: `collection://0beb941d-d073-4079-a207-c8126201d1eb`.
- Default template hint: `fabaade0-573a-42cd-90ff-55b3c8748a07`; observed blank body,
  gray `movie-clapboard-play` icon, `Want to watch`, and unchecked `Has Document`.

Fetch the live schema and template. Metadata fields: `Name` (title), `IMDb` (URL),
`Genre` (multi-select), `Episodes` (number), and `Release Date` (date). `Director`,
`Writer`, and `Cast` relate to People Vault. Personal fields: `Status`, `Watched Date`,
`Score`, and `Has Document`. `Rating` is a read-only formula, currently absent from
SQL columns; use supported page/formula reads if needed. Observed statuses: Want to
watch, Watching, Research & archive, Watched. Reuse current options and exact keys;
there are no observed Type, Season, TMDB, or Reference fields. Do not add them or
change schema, formulas, options, or views as a side effect.

## Basic operations

- **Query:** Use supported queries or scoped search, fetch candidates, and return
  relevant fields and page links. Paginate where possible and disclose incomplete
  coverage or unavailable formulas. Queries stay read-only; snippets are not identity proof.
- **Create:** Resolve the requested work and scope; check IMDb and title/year/part
  candidates for duplicates. Return exact-scope existing matches instead of creating
  another. If duplicate checks are insufficient, report the limitation before creation.
  Use the live template with requested metadata and retain personal defaults. Return a
  verified poster/image or direct image link for manual addition, or say none was found.
- **Update:** Fetch the target and change only requested fields. Completion fills empty
  values; explicit replacement is allowed. Preserve other metadata, notes, files,
  covers, and relation credits. Check template conventions without reapplying a
  template that resets values or duplicates content.
- **Remove:** Distinguish `Research & archive` status from actual removal; clarify
  ambiguous archive requests. For explicit removal use supported reversible trash/
  archive, or report the limitation with manual page links. Never permanently delete.

## Essential safeguards

- Distinguish series, seasons, parts/cours, films, specials, OVAs/ONAs, remakes, and
  adaptations. Reconcile alternate titles using year, studio/credits, and source
  evidence. Shared franchise names or parent-series IMDb URLs are not duplicate proof.
  Do not silently turn a season into the whole series or link a live-action adaptation.
- Use verified canonical IMDb title URLs matching the selected scope. If unavailable,
  leave IMDb empty/unchanged and report supporting sources; do not invent identifiers
  or put another catalog's URL into IMDb. Use official studio/broadcaster or reliable
  catalog evidence for metadata and report conflicts instead of guessing.
- `Episodes` is the selected unit's count, not watched progress. Check whether specials
  are included and distinguish aired/announced counts from confirmed totals for ongoing
  works; leave uncertain values unset/unchanged. Release Date is that unit's premiere,
  not a viewing or upload date; never pad partial dates with invented components.
- Resolve Director/Writer/Cast to verified existing People Vault pages using stable
  identifiers where available and matching credits otherwise. Cast means performers,
  not characters; preserve original versus dubbed voice-language distinctions and
  clarify ambiguity. Preserve multiple/unrelated credits, and clarify missing or
  ambiguous people before affected relation writes. Do not create or edit people here.
- Reuse evidenced or user-selected Genre options; additions/removals preserve other
  memberships unless replacement is requested. Report missing options.
- Status, Watched Date, Score, and Has Document come from the user or creation
  template, not inferred metadata. Never copy public ratings into Score, write Rating,
  infer document availability from adding an entry, or generate personal reviews.
- Verify template application and the consistent icon after creation/update. If
  application fails or the icon is missing, apply the verified template icon using
  supported tools; preserve content and disclose missing templates or repair support.
- Verify poster identity against the selected work/season and output it for manual
  addition. Do not invent image URLs, automatically replace covers, or use art as the icon.
- Recheck relevant state before writes and refetch afterward to verify fields/icon or
  removal. Return page links and unresolved details. Reconcile uncertain outcomes
  before retrying, especially after creation.
