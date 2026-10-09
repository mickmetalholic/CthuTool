# Comics

## Metadata sources

Use Douban for comic metadata and Reference when the intended work/volume has a
mainland Chinese publication; otherwise use Goodreads. Verify mainland publication
rather than infer it from a Chinese title, a Taiwan/Hong Kong edition, or a Douban
listing alone. If publication status is unclear, report it rather than assume no
mainland edition exists. Match the intended work, volume, and edition; clarify any
edition conflict instead of silently switching editions. A Goodreads reference is
not a defect by itself. This source rule does not change the shared cover workflow.

Template hint (2026-10-09): `7557bce9-7b38-4e18-a1f7-2a7b84fd71c4`.

## Database and fields

Database: `https://app.notion.com/p/b8c2404f2d9f4d34ac6208bcb737acdb`

- `Name`, `Reference`, page cover: comic identity and source information.
- `Author`: multiple related People & Organizations entries; `Access`: shared Book Access.
- `Status`, `Score`: personal reading records. `Rating` is a read-only formula.
- The observed schema has no `Genres`, `Series`, `Finished`, or progress field.
  Do not assume these exist, add them, or change views during record maintenance.
  Report a requested operation that the live schema cannot represent.

## Care points

Observed shared icon: gray `book` (not `book-closed`). Do not assume a personal score scale.

- Distinguish the whole work, part, volume, and edition. A work-level title may
  use a single-volume catalog reference; that alone does not authorize splitting,
  renaming, or merging entries. Same titles and translated names are candidates,
  not duplicate proof. Clarify scope when it materially affects the operation.
- Preserve multiple creators, including verified original-story and art credits.
  Reuse existing People & Organizations records; create a missing related record only when
  needed for the requested change and its identity is clear. Do not invent role
  fields or overwrite shared records' other library relations.
- Publication completion is not personal reading completion. Finishing one
  volume does not mark the whole work `Read` without corresponding user intent.
  Keep `Research & Archive` distinct from `Read`.
- Follow [cover handling](covers.md), matching the work and identified edition.

Default new comics to `Want to Read` unless requested otherwise. Preserve related people and access channels on removal.
