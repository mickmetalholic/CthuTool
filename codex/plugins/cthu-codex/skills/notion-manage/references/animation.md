# Animation

## Metadata sources

Use IMDb first, then Douban when IMDb is unavailable or lacks the requested field.
Match the same work/season/part and disclose material conflicts. Douban URLs must
not be written into the IMDb property.

## Target and fields

- Database: `https://app.notion.com/p/830265c59ff741d2b670342ebe1bea9a`.
- Data source hint: `collection://2c140453-fba0-4615-b012-d5c1d84a6e7d`.
- People & Organizations: `collection://0beb941d-d073-4079-a207-c8126201d1eb`.
- Default template hint: `fabaade0-573a-42cd-90ff-55b3c8748a07`; observed blank body,
  gray `movie-clapboard-play` icon, `Want to watch`, and unchecked `Has Document`.

Fetch the live schema and template. Metadata fields: `Name` (title), `IMDb` (URL),
`Genre` (multi-select), `Episodes` (number), and `Release Date` (date). `Director`,
`Writer`, and `Cast` relate to People & Organizations. Personal fields: `Status`, `Watched Date`,
`Score`, and `Has Document`. `Rating` is a read-only formula, currently absent from
SQL columns; use supported page/formula reads if needed. Observed statuses: Want to
watch, Watching, Research & archive, Watched. Reuse current options and exact keys;
there are no observed Type, Season, TMDB, or Reference fields. Do not add them or
change schema, formulas, options, or views as a side effect.

## Essential safeguards

- Distinguish series, seasons, parts/cours, films, specials, OVAs/ONAs, remakes, and
  adaptations. Reconcile alternate titles using year, studio/credits, and source
  evidence. Shared franchise names or parent-series IMDb URLs are not duplicate proof.
  Do not silently turn a season into the whole series or link a live-action adaptation.
- Use verified canonical IMDb title URLs matching the selected scope. If unavailable,
  leave IMDb empty/unchanged and report supporting sources; do not invent identifiers
  or put another catalog's URL into IMDb. Follow the metadata source priority above and report conflicts instead of guessing.
- `Episodes` is the selected unit's count, not watched progress. Check whether specials
  are included and distinguish aired/announced counts from confirmed totals for ongoing
  works; leave uncertain values unset/unchanged. Release Date is that unit's premiere,
  not a viewing or upload date; never pad partial dates with invented components.
- Resolve Director/Writer/Cast to verified existing People & Organizations pages using stable
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

Keep Research & archive status distinct from actual removal; clarify ambiguous archive requests.

For shared entity matching and required creation templates, read
[People & Organizations](people-organizations.md). Keep this library's existing
related-record permission limits.
