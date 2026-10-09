# Games

## Metadata sources

Use IGDB for as much factual metadata as possible, including title, genre, release
date, developer, and series. Use other verified sources only for unavailable IGDB
records or fields, identify the fallback source, and preserve the intended game
and edition scope. Do not replace available verified IGDB data merely for convenience.

Template hint (2026-10-09): `49c354ca-caee-4aea-93dc-e49ffa783cc9`.

## Target and fields

Database: `https://app.notion.com/p/4e61f559a0dd4a53b79926dbfe3200ff`.
Fetch it to discover live data sources, relevant field types, options, relation
targets, and default template. The last observed template is blank with a gray
`video-game` icon and `Want to play`; verify live rather than force cached defaults.

- Metadata: `Name` (title), `Genres` (multi-select), `IGDB` (URL), `Release Date`
  (date), and `Developer` / `Series` (relations).
- Personal: `Owned On` (relation), `Status` (status), `Score`, `Playtime (h)`,
  `Purchase Price` (numbers), `Last Played At` and `Finished At` (dates).
- Read-only: `Rating` (formula), `Playable On` and `Emulators` (rollups).
  `Playable On` derives from `Owned On` → Access `Device`: devices playable through
  the user's owned access channels, not all platforms supported by the game.
  Read [game relations](game-relations.md) when resolving these related records.
- Observed statuses: Want to play, Ongoing, Playing/Watching, Played.
  Reuse live options and types; report incompatible fields before affected writes.

## Essential safeguards

- Distinguish base games, DLC, expansions, remakes, remasters, ports, editions, and
  bundles. Reconcile title, year, developer, platform context, and evidenced IGDB
  identity; do not merge by title or a broad shared reference. A second owned
  platform does not automatically require another game record. Clarify conflicts.
- Use a verified canonical IGDB game URL, not an invented slug or unrelated catalog
  page. Metadata needs source evidence; preserve developer versus publisher and
  series versus bundle distinctions. Release Date must match the intended game
  and release scope; do not silently substitute a later port/remaster date. Disclose
  material regional/early-access differences and never pad partial dates.
- `Owned On` expresses the user's ownership, not every supported platform. Set it
  only as requested. Fetch the live targets for Owned On, Developer, and Series,
  resolve verified existing pages, and preserve other members unless their removal
  was requested. Clarify missing/ambiguous targets rather than create or edit related
  pages. Do not force Playable On or Emulators through indirect related-page edits.
- Personal status, score, price, playtime, and dates come only from the user. Never
  copy public ratings, store prices, or completion-time estimates into these fields.
  Playtime uses hours; distinguish setting a total from adding time. Purchase Price
  was formatted as yuan: verify the live currency and clarify foreign or ambiguous
  amounts instead of silently converting. Keep unknowns unset, not zero. Played
  alone does not imply Finished At; release dates are not personal play dates.

Removing an Owned On membership is not deleting the game record.
