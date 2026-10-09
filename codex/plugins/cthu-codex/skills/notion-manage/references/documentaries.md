# Documentaries

## Metadata sources

Use IMDb first, then Douban when IMDb is unavailable or lacks the requested field.
Match the same film/series/season/episode and disclose material conflicts. Douban
URLs must not be written into the IMDb property.

## Target and fields

- Database: `https://app.notion.com/p/354670d92c464db19d185eb0c40a012a`.
- Data source hint: `collection://e7a55858-5b32-4803-9abc-32498e16f657`.
- Default template hint: `d9d689d6-5c1d-4947-bfee-9a6af8dfc421`; observed blank body,
  gray `document` icon, `Want to watch` status, and unchecked `Is in Library`.

Fetch the live schema and template. `Name` is title; `IMDb` URL; `Type` and `Series`
selects; `Topics` multi-select; `Release Date` and `Watched Date` dates; `Status`
status; `Is in Library` checkbox. `In Library` is a read-only formula, currently
absent from SQL columns; use supported page/formula reads if its result is needed.
Observed types: Film, Series, Season, Episode. Statuses: Want to watch, Watching,
Watched. Reuse live Series/Topics options; Series is a select, not a relation.
Do not change schema, options, formulas, or views as a side effect.

## Essential safeguards

- Distinguish a film, entire series, season, and episode. Verify title, year,
  broadcaster/creator, and season/episode context as relevant. Same names or a
  shared parent-series IMDb URL do not establish duplication. Use the IMDb title
  URL matching the requested scope; do not substitute a series identifier for an
  episode or invent a season-specific identifier. Clarify unresolved matches.
- Verify metadata using the source priority above. Release
  Date belongs to the selected film/series/season/episode, not a streaming upload
  or personal viewing date. Do not turn a year-only date into a fabricated full date.
  Respect requested classification; use verified evidence for delegated Type,
  Series, and Topics choices, and report missing options rather than creating them.
  Topic additions/removals preserve other memberships unless replacement is requested.
- `Status`, `Watched Date`, and `Is in Library` are personal fields; edit only when
  requested. Adding a Notion entry does not mean the user owns the media or watched
  it. Never write `In Library`, infer viewing progress, or generate personal reviews.
- Create with the live template and verify its icon after creation or update. If
  application fails or the icon is missing, manually apply the verified template
  icon using supported tools. Preserve content and report any repair limitation.
- Verify image identity and output it for manual addition; do not automatically
  replace covers or icons with posters, invent URLs, or claim unavailable art was found.
