# Classical Work relations

Schema checked on 2026-10-09; refetch before relying on these hints.
Classical Work (`collection://97d2982c-2812-48ef-ab37-e919a80a5e4f`) currently has:

- `Name`: title; `Composer`: People & Organizations relation; `IMSLP`: URL.
- `Period` and `Work Type`: selects; observed options are Classical and
  Symphony/Overture respectively. Reuse live values rather than inventing options.
- `Music Releases`: reciprocal relation to Music Release's `Works`.

`Catalogue No.` and `Legacy Album` are no longer present. Match existing works by
composer, title, and verified IMSLP work page, retaining meaningful catalogue
prefixes/numbers found in titles or source evidence. A bare number, generic title,
composer page, or download link alone does not identify a work. Clarify ambiguous
work/movement/arrangement matches rather than changing a related record to fit.

This skill writes requested links on Music Release's `Works`; Notion maintains the
reciprocal relation. Do not independently replace `Music Releases` or remove other
recordings. Work Type here is a select; the same name on Music Release is a read-only
rollup, as is Composers. Never copy work metadata into release fields or confuse a
work's composition date with a recording's first release date.

The observed Classical Work template `905d452c-5c04-4d14-b715-dac616e1de75` has a
blank body and 🎼 icon. It is not the Music Release template and must not be applied
to release pages. Discovering this template does not authorize creating works.

For shared entity matching and required creation templates, read
[People & Organizations](people-organizations.md). Keep this library's existing
related-record permission limits.
