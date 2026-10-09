# Comics

## Metadata sources

Use Douban for comic metadata and Reference, matching the intended work, volume,
and edition. Report unavailable or mismatched records rather than silently
substituting another catalog.

Template verified on 2026-10-09: `7557bce9-7b38-4e18-a1f7-2a7b84fd71c4`. Refetch the live default
before creation and pass its ID explicitly; copying its icon is not application.

## Database and fields

Database: `https://app.notion.com/p/b8c2404f2d9f4d34ac6208bcb737acdb`

Fetch the current schema and default template on invocation; discover relation
targets and option/template IDs live and reuse them for the request.

- `Name`, `Reference`, page cover: comic identity and source information.
- `Author`: multiple related People & Organizations entries; `Access`: shared Book Access.
- `Status`, `Score`: personal reading records. `Rating` is a read-only formula.
- The observed schema has no `Genres`, `Series`, `Finished`, or progress field.
  Do not assume these exist, add them, or change views during record maintenance.
  Report a requested operation that the live schema cannot represent.

## Care points

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
  Keep `Research & Archive` distinct from `Read`. Do not infer personal scores,
  status, or ownership from public metadata, assume a score scale, or write Rating.
- Use the current comic template on create. Preserve its conventions on update
  without resetting personal fields or duplicating content. Verify asynchronous
  template completion before dependent edits. If application is unsupported,
  fails, or omits the icon, explicitly repair the shared icon via a supported
  operation. The observed fallback is gray `book`, not `book-closed`. Verify
  the icon on creates/updates and report unresolved presentation failures.
- Follow [cover handling](covers.md), matching the work and identified edition.

- Keep the body for personal notes. Do not insert catalog blurbs or duplicate
  bibliographic sections automatically; use targeted edits for requested notes.

Default new comics to `Want to Read` unless requested otherwise. Preserve related people and access channels on removal.

For shared entity matching and required creation templates, read
[People & Organizations](people-organizations.md). Keep this library's existing
related-record permission limits.
