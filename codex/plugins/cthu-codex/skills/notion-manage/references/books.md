# Books

## Metadata sources

Use Douban for Chinese-language books and Goodreads for English-language books,
based on the selected edition's language rather than the author's nationality or
original language. Match the work and edition before using metadata or Reference.
For other languages or unavailable matching records, disclose the gap rather than
silently substituting a different edition or source.

Template hint (2026-10-09): `8b795339-5733-4839-979a-1d641d564136`.

## Database and fields

Database: `https://app.notion.com/p/3c457831780b46ebbe5a33fffb8f945b`

- Book metadata: `Name`, `Author`, `Genres`, `Series`, `Reference`, page cover.
- Personal records: `Status`, `Finished`, `Score`, `Access`, page notes.
- `Rating` is a formula; update `Score`, never write the formula result.
- `Author` relates to People & Organizations, `Series` to Book Series, and `Access`
  to Book Access. Fetch the relevant related schema when needed.

## Care points

Use the selected edition's published title for `Name`, including the Chinese title
of a Chinese translation. Keep different language editions distinguishable by their
actual titles; do not replace them with a shared original-language work title.

Observed shared icon: gray `book-closed`. Keep `Research & Archive` distinct from `Read`; do not assume a personal score scale.

- Follow [cover handling](covers.md), matching the work and identified edition.

- Different titles, translations, or editions can describe the same work;
  identical titles can describe different works. Do not automatically merge
  editions or invent a permanent work-versus-edition policy for the user.
- Reuse matching authors, series, and access channels. Create a missing related
  entry only when needed for the requested change and its identity is clear.
  People & Organizations is shared with other libraries; preserve unrelated information.

Default new books to `Want to Read` unless requested otherwise. Delete only requested book records, not related people, series, or access channels.
