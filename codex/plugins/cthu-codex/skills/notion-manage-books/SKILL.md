---
name: notion-manage-books
description: Create, read, update, and delete entries in the personal Notion Book Library, including book metadata, reading records, and related authors, series, and access channels. Use only when explicitly invoked as $notion-manage-books.
---

# Notion · Manage Books

Manage the personal Book Library through the connected Notion tools. Accept
natural-language requests; no fixed input format or mandatory review ceremony.
An explicit request authorizes the requested operation. Ask only when missing
information or ambiguous targets materially affect the result.

## Database and fields

Database: `https://app.notion.com/p/3c457831780b46ebbe5a33fffb8f945b`

Fetch the database on invocation and reuse its live schema for the request.
Discover data-source IDs, relation targets, and available options from that
response rather than hard-coding them.

- Book metadata: `Name`, `Author`, `Genres`, `Series`, `Reference`, page cover.
- Personal records: `Status`, `Finished`, `Score`, `Access`, page notes.
- `Rating` is a formula; update `Score`, never write the formula result.
- `Author` relates to People Vault, `Series` to Book Series, and `Access`
  to Book Access. Fetch the relevant related schema when needed.

## Operations

- **Create:** Resolve the book and check for existing entries using its source
  URL, title, and author. Verify likely matches before creating. Use supplied
  information and, when useful, verified public metadata. Default new books to
  `Want to Read` unless the user specifies otherwise.
- **Read:** Search or query the book data source; fetch matching pages for
  details. Use available connector capabilities and report incomplete coverage
  when exhaustive retrieval is unavailable. A limited search is not proof that
  a book is absent or a full-library count is accurate.
- **Update:** Resolve the target and change only requested fields or content.
  For a request to complete metadata, fill missing factual information while
  preserving existing values and personal records. Preserve unrelated notes
  and relation values unless their replacement or removal was requested.
- **Delete:** Resolve the requested book entries and use the connector's
  supported reversible trash/archive operation. Do not delete related people,
  series, or access channels. Report a capability limitation if deletion is
  unavailable rather than claiming completion.

## Care points

- For creates and updates, fetch the database's current default template and
  use its icon as the shared book icon. Create with that template; for existing
  entries, retain an already-applied template and apply it only where needed,
  without resetting personal fields or duplicating existing content. Template
  application can be asynchronous: verify completion before dependent edits.
  If the template is unavailable, fails, or leaves the icon missing, explicitly
  set the same shared icon through a supported icon operation. The observed
  fallback is Notion's gray `book-closed` icon. Verify the resulting icon on
  every create/update; report any unresolved failure rather than claiming it
  was applied. Do not reapply a template merely to repair the icon.
- For every newly created book, include its cover image or a direct image link
  in the result so the user can add it manually. Match the cover to the book
  and identified edition, prefer a stable source URL, and label covers by book
  in batch results. If no verified image is available, state that explicitly;
  do not invent an image URL or substitute a book-detail page for an image.
  Providing the image is required even if an automatic cover update succeeds.
- Different titles, translations, or editions can describe the same work;
  identical titles can describe different works. Do not automatically merge
  editions or invent a permanent work-versus-edition policy for the user.
- Reuse matching authors, series, and access channels. Create a missing related
  entry only when needed for the requested change and its identity is clear.
  People Vault is shared with other libraries; preserve unrelated information.
- Never infer a personal score, completion date, ownership, or access channel
  from public metadata. Do not assume a score scale or substitute a public
  rating. Keep `Research & Archive` distinct from `Read`.
- Use existing genre and status options. Schema changes require a request to
  change the schema; normal entry maintenance does not authorize them.
- Operate on records, not database views or their configuration.
- Verify writes by reading the affected entries and report concise results
  with Notion links. If a write has an uncertain outcome, check existing state
  before retrying so a retry does not create duplicates.
