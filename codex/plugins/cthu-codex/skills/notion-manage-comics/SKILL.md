---
name: notion-manage-comics
description: Create, find, update, and delete entries in the personal Notion Comic Book Library, preserving comic scope, multiple creators, and personal reading records. Use only when explicitly invoked as $notion-manage-comics.
---

# Notion · Manage Comics

Manage comic records through the connected Notion tools using natural-language
requests. Clear requests authorize the requested operations without a fixed
format or redundant confirmation. Clarify material ambiguity before changing
the affected entry.

## Database and fields

Database: `https://app.notion.com/p/b8c2404f2d9f4d34ac6208bcb737acdb`

Fetch the current schema and default template on invocation; discover relation
targets and option/template IDs live and reuse them for the request.

- `Name`, `Reference`, page cover: comic identity and source information.
- `Author`: multiple related People Vault entries; `Access`: shared Book Access.
- `Status`, `Score`: personal reading records. `Rating` is a read-only formula.
- The observed schema has no `Genres`, `Series`, `Finished`, or progress field.
  Do not assume these exist, add them, or change views during record maintenance.
  Report a requested operation that the live schema cannot represent.

## Operations

- **Create:** Resolve the comic and intended scope, then check for duplicates
  using source links, title, creators, and volume/edition context. Return an
  existing match rather than creating it again. Use supplied or verified factual
  metadata; default new entries to `Want to Read` unless otherwise requested.
- **Read:** Find entries by name, creator, status, source, or Notion link. Fetch
  candidate pages as needed. Return useful fields and links, and disclose partial
  retrieval rather than claiming exhaustive counts or definitive absence.
- **Update:** Resolve the existing entry and change only requested fields or
  fill requested missing factual metadata. Preserve unrelated values, creator
  and access relations, cover, and notes unless their change was requested.
- **Delete:** Use supported reversible Notion trash/archive for resolved,
  explicitly requested entries. Preserve related people and access channels.
  If deletion is unsupported, report it without emptying the page or claiming
  success.

## Care points

- Distinguish the whole work, part, volume, and edition. A work-level title may
  use a single-volume catalog reference; that alone does not authorize splitting,
  renaming, or merging entries. Same titles and translated names are candidates,
  not duplicate proof. Clarify scope when it materially affects the operation.
- Preserve multiple creators, including verified original-story and art credits.
  Reuse existing People Vault records; create a missing related record only when
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
- For each new comic, return a verified cover image or direct image link for
  manual addition, even if an automatic cover update succeeds. Match the work
  and identified edition; label representative volume art for work-level entries
  and label each comic in batch results. Prefer stable source URLs. If no verified
  image is found, say so; never invent a link or substitute a catalog page for it.
- Keep the body for personal notes. Do not insert catalog blurbs or duplicate
  bibliographic sections automatically; use targeted edits for requested notes.
- Verify writes and return affected Notion links with any unresolved fields.
  Check existing state before retrying uncertain mutations to avoid duplicates;
  in batches, distinguish each item's outcome and preserve successful entries.
