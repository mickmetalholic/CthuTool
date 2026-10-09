# Movies

## Metadata sources

Use metadata sources in order: TMDB Movie, then IMDb, then Douban. Fall back
when the higher-priority source is unavailable or lacks the requested field.
Verify the same movie identity across sources and disclose material conflicts.
A fallback source URL must not be written into another catalog's URL property.

Template hint (2026-10-09): `fb21848b-db84-4973-8a6b-200733661796`.

## Target and fields

Database: `https://app.notion.com/p/1fe5b55e75f5497cb7acb7d439c0424f`.
Fetch it to discover the live data source, relevant property types, options, and
default template each invocation. Do not reuse stale object IDs. The last observed
template is blank with a gray `movie` icon, `Want to watch`, and false `Is in Library`;
verify these live instead of forcing cached defaults.

- Metadata: `Name` (title), `Genres` (multi-select), `Release Date` (date),
  `IMDb` and `TMDB` (canonical URL properties).
- People: `Director` and `Cast` are relations to People & Organizations; verify their live target.
- Personal: `Status` (Want to watch / Watching / Watched), `Watched Date` (date),
  `Score` (number), `Is in Library` (checkbox).
- Read-only formulas: `Rating`, `In Library`.

## Essential safeguards

- Resolve remakes, sequels, adaptations, and movie/TV ambiguity with title, original
  title, year, director, and directly evidenced IDs.
- Store evidenced canonical `https://www.imdb.com/title/tt…/` and
  `https://www.themoviedb.org/movie/…` URLs, not bare IDs, TV/person links, or guessed
  identifiers. A title-only match is not proof of identity. Verify release dates
  and explain material regional/premiere differences; do not pad a year or month
  with invented date components. Reuse current Genres options and report unmapped
  values without adding options.
- For Director/Cast, fetch the live relation target and candidate people pages.
  Prefer verified stable identifiers when available; otherwise reconcile names and
  credits with evidence. Preserve multiple directors/cast members. Clarify missing
  or ambiguous people before affected relation writes; do not create or edit them.
- Follow [cover handling](covers.md), matching the selected movie.
