# Dramas

## Metadata sources

Use metadata sources in order: TMDB TV, then IMDb, then Douban. Fall back
when the higher-priority source is unavailable or lacks the requested field.
Match the same series/season/part across sources and disclose material conflicts.
A fallback source URL must not be written into another catalog's URL property.

Template hint (2026-10-09): `5a7fa85d-bfc0-43e1-b078-33da787fea7a`.

## Target and fields

Database: `https://app.notion.com/p/f1efac7703c241b7ba411cd082b45e0a`.
Fetch it to discover current data sources, relevant fields, options, and default
template. Last observed template: blank body, gray `tv` icon, `Want to watch`,
and false `Is in Library`; verify live rather than force cached defaults.

- Metadata: `Name` (title), `Category` (select), `Genres` (multi-select), `Episodes`
  and `Season Number` (numbers), `Release Date` (date), `IMDb`, `TMDB`, and `Douban` (URLs).
- People: `Director`, `Cast`, and `Writer` are People & Organizations relations.
- Personal: `Status`, `Watched Date` (date), `Score` (number), `Is in Library`
  (checkbox). `Rating` and `In Library` are read-only formulas.
- Observed categories: American Drama, Japanese Drama, English Drama, Korean Drama,
  HK Drama, Chinese Drama. Statuses: Want to watch, Watching, Research & Archive,
  Watched. Use current options and types; report incompatible fields before writes.

## Essential safeguards

- For multi-season dramas, create one record per season, named with the verified
  original series title plus `Season N` (for example, `Dark — Season 2`). Keep each
  season's status, score, episode count, and premiere date separate. Set
  `Season Number` to the verified integer N; leave it unset for whole-series records
  or an unknown season. The title already identifies the series; no separate
  `Series Name` field is needed. A request for
  the whole multi-season series maps to its verified regular seasons; a request for
  specific seasons creates only those. Do not add specials/Season 0 unless requested.
  Preserve existing whole-series records rather than splitting or migrating them
  incidentally; clarify overlap before creating duplicate coverage.
- Use TMDB TV's matching season poster as that season's cover, verified against the
  series identity and season number. Do not use the general series poster or another
  season's poster. This seasonal rule overrides the shared IMDb/Douban fallback:
  if the matching TMDB season poster is unavailable, report the gap rather than
  silently substituting artwork. Use verified season URLs when available.
- Preserve series, season, part, and special identity. Reconcile remakes, adaptations,
  and similarly named works using title, year, people, and source evidence. A shared
  series-level IMDb/TMDB URL is not proof that two season records are duplicates.
  Do not merge seasons or silently convert a seasonal record into an entire series.
- Use evidenced canonical IMDb title and TMDB **TV** URLs, never movie/person links
  or invented IDs. Store verified Douban subject URLs in `Douban`; the live schema
  has no `Reference` field (checked 2026-10-09). Check cross-source series/season scope rather than
  assume all URLs describe the same unit. Preserve existing valid references.
- `Episodes` describes the selected unit's episode count, not watched progress.
  Verify whether counts cover one season, the whole series, or include specials.
  For ongoing shows, distinguish aired/announced counts from confirmed totals;
  disclose uncertainty and leave unresolved values unset or unchanged.
  `Release Date` must match that same unit's premiere; disclose material regional
  differences and never pad a year/month with invented date components.
- Reuse live Category/Genres options with evidence or user direction; title language
  alone does not establish Category. Report unmapped values. Do not change schemas,
  options, views, or create new season/episode properties as a side effect.
- Verify live People & Organizations targets and existing Director/Cast/Writer identities.
  Prefer evidenced stable identifiers where available; reconcile names and credits
  otherwise. Preserve multiple credits, clarify missing/ambiguous people before
  affected relation writes, and do not create or edit related pages incidentally.

Keep Research & Archive status distinct from actual removal; clarify ambiguous archive requests.
