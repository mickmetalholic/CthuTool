# Belongings Inventory

Manage the user's personal physical belongings and storage containers. This is a
separate library, not an extension of Apps, Games, or Knowledge. Public product
catalogs are not an authority for what the user owns or where it is stored.

## Target and observed schema

- Database: `https://app.notion.com/p/7f6dfec720e54f2095ff10bc971a4e35`.
- Data source hint (observed 2026-10-28):
  `collection://8ff2dc3a-16bc-42c3-87d1-f127043841f6`.
- The supplied `v=5953f9f052b44927a72b9e7ffb57aa43` identifies the
  **Storage Place** view, not a separate database. Query the full data source
  for inventory-wide searches; use the saved view only when its behavior is
  explicitly wanted.

Fetch the database and its **live** data source, fields, select options, relation
targets, and available templates at invocation. These are observed field names,
not permission to change the schema:

| Property | Observed type | Meaning / handling |
| --- | --- | --- |
| `Name` | title | User's name for a particular item or container |
| `Brand` | select | Existing brand option only; do not create a new option |
| `Model` | text | Model, specification, or identifying user notes |
| `Price` | number, yuan display | User's recorded price, not public MSRP/current value |
| `Date` | date | Recorded date; preserve precision and user intent |
| `From` | select | Existing purchase/source option only |
| `Prority` | select | Exact live spelling, currently P0 / P1 / P2 |
| `Group` | select | User's grouping, independent of actual containment |
| `Storage Category` | select | User's storage classification, distinct from `Group` |
| `Stored place` | self-relation | Item's linked container/location record(s) |
| `Contents` | self-relation | Records linked as contained in this item/container |

At observation, both `Group` and `Storage Category` offer Carry-on,
Media Center, Study Room, Bedroom, Storage Room, and Others. They are **different
fields** even though their options match. The `Stored place` and `Contents`
relations both point to the Belongings Inventory data source and act as opposite
sides of containment in existing records. Confirm the live relation behavior
before writes. Do not silently correct `Prority` to `Priority`, rename other
properties, introduce a quantity field, or edit options/views/schema.

## Read and identify records

- Scoped search, a schema-backed query, and relevant saved views may be used
  to find items. Search by item label and relevant model/brand, fetch candidate
  pages, and paginate when needed. A filtered view is not proof of absence from
  the database. Return exact Notion page links and distinguish missing values
  from unsupported derived values.
- Identical names may denote different **physical items**. Distinguish by the
  user's item label/suffix, model, brand, observed location, and supplied
  purchase details where available. An identical brand/model or repeated name
  is a candidate, not proof of duplication. Never silently merge separate
  possessions. If an intended new item cannot be distinguished from an existing
  one, clarify whether it is an additional physical unit.
- Preserve the user's item names, nicknames, numbered suffixes, and meaningful
  identifiers; this personal inventory does **not** use the original-title
  conventions for published works. Do not relabel items using a storefront's
  official product title.
- For "where is X?", resolve the exact record, read `Stored place`, and follow
  verified ancestors as needed. For "what is in X?", inspect `Contents` and
  fetch the linked items. Track visited IDs and stop/report cycles or missing
  links rather than inventing a location. `Group` and `Storage Category`
  alone do not prove an item's immediate container or physical position.

## Create, update, and protect personal fields

- Use the shared [template workflow](templates.md) on creation and updates.
  Check live templates and apply a matching one when available. Existing
  records have heterogeneous per-item icons and sometimes blank bodies; no
  universal template or icon was established by the 2026-10-28 read-only
  inspection. **Explicit exception:** if no applicable live template is
  available, a new inventory record may be created without a template; report
  that fact, leave the icon unset unless the user supplied a verified choice,
  and never claim a template was applied. If a matching template exists but
  cannot be applied, follow the shared failure/clarification workflow.
- Check existing candidates before creating; a clear request for multiple
  physical units may create separate records rather than guessing a nonexistent
  quantity property. Do not create a container record just because the user
  mentions a room or an unresolved location.
- Only the user can supply ownership, acquisition `Date`, paid `Price`,
  purchasing `From`, priority, grouping, and storage claims. Do not infer
  them from public listings, an item's release date, its brand, or another
  possession. Use numeric prices and the database's existing currency
  presentation; never convert currencies or infer discounts without a request.
  A missing or unsupported select option must be disclosed, not replaced with
  an arbitrary value such as `Others`.
- Change only requested properties/body sections and preserve all unrelated
  fields, existing formatting, notes, icons, covers, and relation members. For
  an existing `Model` text value with formatting or links, use a faithful page
  read before editing it. A personal item photo/cover is optional; do not apply
  the media-library cover enrichment/upload workflow to this inventory.
- Respect page locks and tool permissions; report blocked writes instead of
  circumventing them. Refetch and verify each affected record after a write.

## Containment and moves

- Resolve the exact item **and** exact destination container as existing
  records in this same data source. If names are ambiguous, clarify rather
  than picking one. Do not infer a container from a shared `Group` or
  `Storage Category`.
- To move an item, inspect its current `Stored place` and both affected
  containers' `Contents`. A clear "move to X" replaces the intended former
  location membership; "also stored in X" adds only the requested membership.
  If the item has several location memberships and it is unclear which to
  replace, clarify before changing them. Preserve unrelated links.
- Never set an item's `Stored place` to itself or a descendant. Traverse the
  prospective destination's ancestor chain (with cycle detection) before
  modifying containment; reject/report proposed cycles or inconsistent paths.
- Prefer a targeted change through `Stored place` for one item, and verify
  the resulting reciprocal `Contents` on the old/new containers. For a
  requested container-`Contents` edit, handle the explicitly selected child
  records without replacing unrelated contents. Do not independently rewrite
  both sides blindly or retry an uncertain relationship mutation. If the
  connector does not maintain reciprocal links as expected, report the
  mismatch and obtain a consistent verified result before claiming success.
- Do **not** automatically change `Group`, `Storage Category`, or
  `Prority` when changing containment (or vice versa). Only update those
  fields when requested.

## Reversible removal

Verify each exact target before trash/archive. If it has `Contents` or acts
as another record's `Stored place`, explain the dependent items and clarify
their intended new locations before removing the container; do not cascade,
detach, relocate, or delete children on your own. For ordinary items, preserve
other related records. Use reversible trash/archive only; do not use the
`Prority` field or an unrelated status as a substitute for removal. Report
unsupported operations and provide the exact page links for manual action.

Example explicit invocations:

- `$notion-manage 找到我的 USB-C 充电器，并告诉我现在放在哪里`
- `$notion-manage 把指定的充电器移到已有的收纳盒里，不改分组`
- `$notion-manage 给 Belongings Inventory 新增一个物品，型号和价格按我提供的信息填写`
