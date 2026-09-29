---
name: notion-manage-documentaries
description: Manually manage the personal Notion Documentary Library with query, creation, scoped updates, and reversible removal. Use only when explicitly invoked for this library.
---

# Notion · Manage Documentaries

Use only when explicitly invoked. Interpret natural-language requests; clear intent
and targets authorize the requested operation without mandatory second confirmation.
Clarify unresolved identity or scope before affected writes.

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

## Basic operations

- **Query:** Use supported queries or scoped search, fetch candidates, and return
  relevant fields and page links. Paginate where possible and disclose incomplete
  coverage; snippets alone do not establish identity. Queries remain read-only.
- **Create:** Resolve the requested documentary and scope, check IMDb and contextual
  title matches for duplicates, and return an exact existing match instead of
  duplicating it. Do not infer absence from partial search. Use the live default
  template with requested metadata and preserve its personal defaults. Return a
  verified poster/image or direct image link for manual addition; report if unavailable.
- **Update:** Fetch the target and change only requested fields. Missing-metadata
  completion fills empty values; explicit replacement is allowed. Preserve other
  values, notes, files, and covers. Check template conventions without reapplying
  a template that could duplicate content or reset existing values.
- **Remove:** Identify exact requested pages and use supported reversible trash/
  archive only. If unsupported, explain and provide links for manual removal;
  never substitute permanent deletion or clearing page content.

## Essential safeguards

- Distinguish a film, entire series, season, and episode. Verify title, year,
  broadcaster/creator, and season/episode context as relevant. Same names or a
  shared parent-series IMDb URL do not establish duplication. Use the IMDb title
  URL matching the requested scope; do not substitute a series identifier for an
  episode or invent a season-specific identifier. Clarify unresolved matches.
- Verify metadata against IMDb or official broadcaster/producer sources. Release
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
- Recheck relevant state before writes and refetch afterward to verify fields,
  icon, or removal. Return page links and unresolved details. Reconcile uncertain
  outcomes before retrying, especially after creation.
