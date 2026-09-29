---
name: notion-manage-apps
description: Manually manage the personal Notion App Vault with query, creation, scoped updates, and reversible removal. Use only when explicitly invoked for this database.
---

# Notion · Manage Apps

Use only when explicitly invoked. Interpret natural-language requests; clear intent
and targets authorize the requested operation without mandatory second confirmation.
Clarify unresolved app identity or scope before affected writes.

## Target and fields

- Database: `https://app.notion.com/p/0faf46d7187d4c12849f798b8160dba1`.
- Data source hint: `collection://e9c868d0-3310-4a06-bfc7-3035131f285a`.
- `Knowledges` relation: Knowledge Vault,
  `collection://94d3d31a-68e8-4966-bd0c-4bddf8e19ee0`.

Fetch the live schema and available templates. `Name` is title; `URL` is the app/site
URL, currently exposed as `userDefined:URL`, not the Notion page's system `url`.
`Platform` and `Tag` are multi-selects. Observed platforms: Web, MacOS, Windows,
Linux, iOS, Android. Reuse exact live option names, including existing Tag spelling;
do not silently rename taxonomy or add schema fields, options, or views.

No template was returned during discovery. The database has a gray `window` icon;
sampled records use individual uploaded app/site icons. Recheck live availability.
Use a template if one exists; otherwise report its absence and use the verified
gray window fallback for missing icons, preserving existing app-specific icons.
Do not claim a template was applied or create one as a side effect.

## Basic operations

- **Query:** Use supported queries or scoped search, fetch candidates, and return
  relevant fields and page links. Paginate where possible and disclose incomplete
  coverage. Queries stay read-only; snippets alone are not identity proof.
- **Create:** Resolve the app/site and check official product/store URL plus
  name/publisher candidates for duplicates. Return an exact existing match instead
  of duplicating it; report insufficient duplicate coverage before creation. Use
  the live template when available and requested metadata. Return a verified app
  logo/image or direct image link for manual addition, or say none could be verified.
- **Update:** Fetch the record and change only requested fields. Metadata completion
  fills empty values; explicit replacement is allowed. Preserve unrelated properties,
  notes, files, covers, icons, and relations. Do not reapply templates that reset content.
- **Remove:** Identify exact records and use supported reversible trash/archive;
  if unsupported, explain and provide manual page links. Never permanently delete
  or clear content as a substitute. Record CRUD does not install, launch, purchase,
  or uninstall software, or alter app accounts/subscriptions.

## Essential safeguards

- Match product, publisher, and edition where relevant. Same names or shared vendor
  domains do not prove identity; a suite, individual app, extension, fork, and renamed
  successor are not automatically interchangeable. Verify redirects and aliases.
  Normalize only non-identifying tracking parameters; retain product/store IDs and
  meaningful paths or queries. Prefer official product/store evidence and do not
  invent URLs or substitute an unrelated vendor homepage for a product.
- Respect requested Platform/Tag choices. For delegated enrichment, verify current
  platform support; Web availability alone does not prove a native desktop/mobile app.
  Do not infer installation, ownership, or usage from availability. Clarify whether
  Platform means supported platforms or a selected subset if it affects the write.
  Add/remove only requested memberships; replace the whole set only when intended.
  Report unmapped tags or platforms instead of creating options.
- Resolve requested Knowledges links to verified existing records in the live relation
  target. Preserve unrelated members and clarify missing/ambiguous matches. Do not
  create/edit knowledge pages or unrelated reciprocal memberships as a side effect.
- Verify template conventions and icon after creation/update. If application fails
  or the icon is missing, apply the live template icon using supported tools; when
  no template exists, use the verified gray window fallback. Preserve branded icons
  unless replacement is requested and disclose any unavailable template/repair support.
- Verify image identity against the selected app/site. Return images for manual
  addition; do not automatically replace covers or branded icons, copy another app's
  artwork, or invent image URLs. Missing-image disclosure is an acceptable outcome.
- Recheck relevant state before writes and refetch afterward to verify requested
  fields/icon or removal. Return page links and unresolved details. Reconcile
  uncertain outcomes before retrying, especially after creation.
