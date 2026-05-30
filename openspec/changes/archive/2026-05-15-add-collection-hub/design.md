## Context

The repository currently has a root pnpm/Turbo workspace for `@cthutool/*` applications and packages. The Collection Hub is a scratch prototype and must be isolated under `scratches/collection-hub` so it can use its own `@collection-hub/*` package scope and workspace configuration without changing root workspace behavior.

The desired product is an end-to-end vertical slice: a browser extension extracts collection items from configured pages, the user imports the batch into one of three fixed organizer collections for that source, a server persists collections/items/authors, and a web dashboard displays the imported data. The first version uses JSON storage and an extensible DOM adapter boundary. It includes a sample adapter for local fixtures and an initial XHS board adapter based on the observed `xiaohongshu.com/board/<boardId>` DOM.

## Goals / Non-Goals

**Goals:**

- Create a nested pnpm workspace containing `server`, `web`, `extension`, and `libs`.
- Initialize NestJS, Next.js, and Plasmo applications with their official scaffolding tools.
- Provide shared contracts for status values, DTO schemas, dashboard response types, and API error shapes.
- Implement a thin import path from extension extraction through server persistence to dashboard display.
- Persist source platform metadata, starting with `xhs`, so later Bilibili or Instagram adapters can share the same storage model.
- Extract XHS board card metadata from loaded `.note-item` elements, including note URL/ID, author URL/ID, cover URL, author avatar URL, and image/video media type.
- Store imported items under exactly three organizer collections per source platform: pending download, downloaded, and not download.
- Provide the import workflow as an on-page control injected into matched pages, with automatic scroll collection, per-card inline import, batch import, source/status-scoped delete, and no extension popup entry point.
- Provide dashboard triage actions for deleting imported notes, moving notes between fixed destination collections, and assigning optional S/A/B ratings.
- Keep storage simple while preserving future database migration boundaries.

**Non-Goals:**

- Do not add a production database in the first version.
- Do not modify the root `pnpm-workspace.yaml`, root Turbo config, or existing `@cthutool/*` packages.
- Do not implement a silent background queue in the extension.
- Do not implement Bilibili, Instagram, or other non-XHS adapters in this change.
- Do not use the source site's board or playlist as an organizer collection; source page collection metadata is preserved only as import/source metadata.

## Decisions

### Decision: Use an isolated nested pnpm workspace

Create `scratches/collection-hub` with its own `package.json` and `pnpm-workspace.yaml`.

Rationale: The prototype has a different package scope and a multi-app shape that does not need root Turbo integration yet. Keeping it nested reduces risk to the existing monorepo and makes cleanup or extraction easier.

Alternatives considered:

- Root workspace integration: useful later if the scratch becomes a first-class project, but it adds root config churn now.
- Independent folders without workspace wiring: simpler at first, but makes shared contracts awkward and duplicates dependencies.

### Decision: Keep shared contracts framework-free

The `@collection-hub/libs` package owns status enums, TypeScript data types, validation schemas, dashboard response types, and optional fetch helpers. It must avoid NestJS, Next.js, and Plasmo dependencies.

Rationale: All apps need the same data shapes. A framework-free package prevents circular coupling and makes server validation, extension submission, and dashboard rendering align.

Alternatives considered:

- Server-owned DTOs copied into other apps: faster initially, but drift is likely.
- Generated OpenAPI client: useful once the API surface grows, but too heavy for a prototype with three endpoints.

### Decision: Use JSON storage behind a repository boundary

The NestJS server persists data to a local JSON file by default at `data/store.json` relative to the server process working directory. `COLLECTION_HUB_STORE_PATH` can override the store path. Repository methods initialize an empty store, apply upserts in memory, and write atomically using a temporary file followed by rename.

Rationale: JSON storage matches the prototype scope while preserving a clean seam for future SQLite or PostgreSQL migration.

Alternatives considered:

- SQLite: more durable and queryable, but adds migration setup before the extraction workflow is proven.
- PostgreSQL: closer to production, but too much infrastructure for a scratch vertical slice.
- In-memory storage: fastest, but cannot verify persistence between sessions.

### Decision: Use a DOM adapter registry in the extension

The extension exposes match pattern and extraction configuration. Content scripts activate on configured pages and call a registry of `DomCollectionAdapter` implementations with `canHandle()` and `extract()`. The registry currently tries the XHS board adapter first and falls back to the sample adapter.

Rationale: Encapsulating extraction lets XHS, Bilibili, Instagram, and local fixture pages share the same on-page destination selection, submission, retry, and API contracts. A site-specific adapter can evolve independently as a site's DOM changes.

Alternatives considered:

- Put all selectors directly in the content script: faster initially, but would make future site adapters and fallback behavior harder to reason about.
- Build a full visual selector editor: flexible, but beyond the first vertical slice.

### Decision: Use fixed source/status organizer collections

For each source platform, the organizer owns exactly three destination collections: `pending_download`, `downloaded`, and `not_downloaded`. The server derives organizer collection IDs from source and status, for example `xhs:pending_download`, `xhs:downloaded`, and `xhs:not_downloaded`. The source site's board or collection ID remains part of the import source metadata, not the organizer collection identity.

Rationale: The user's workflow is download triage, not mirroring every source-site collection. Fixed destination collections make repeated imports predictable and keep future sources such as Bilibili or Instagram aligned around the same three buckets.

Alternatives considered:

- Persist each source board as its own organizer collection: useful for provenance, but it creates unbounded collections and makes the three-state workflow harder to scan.
- Store only item status without collections: simpler, but it loses a first-class grouping surface for the dashboard and future download workflows.

### Decision: Move import UI into the matched page and remove popup

The content script injects a small page-integrated control on supported pages. The control triggers extraction, shows the detected source and loaded item count, asks the user to choose one of the three destination collections for that source, submits explicitly, and displays success/error/retry states. No popup entry point is provided.

Rationale: The user already reviews the source page in the logged-in browser context. Keeping extraction and destination selection in the page reduces context switching and makes it clearer which DOM is being imported.

The extension SHALL not ship a popup page. Clicking the extension toolbar icon opens the configuration/options page directly. The configuration page may be a blank placeholder in this change because import configuration can remain on defaults while the page-integrated control is validated.

Alternatives considered:

- Popup-only import: easy to ship, but feels detached from the page being scraped and requires extra extension UI hops.
- Popup as settings launcher: convenient, but still adds an unnecessary intermediate surface when the toolbar icon can open configuration directly.
- Fully automatic import on page load: convenient, but too risky because the user must confirm destination and loaded-card completeness.

### Decision: Scroll the source page before bulk extraction

The page control calls a scroll collector that resets scroll positions, advances window or scrollable containers in viewport-relative steps, repeatedly extracts via the active DOM adapter, deduplicates items by item ID or note URL, and reports discovered item counts while scanning.

Rationale: XHS board pages lazy-load cards, so importing only the initially visible DOM makes collection import incomplete for common boards. A bounded no-growth/stability stop condition keeps the behavior user-triggered while avoiding a silent background queue.

Alternatives considered:

- Import only currently loaded cards: simpler, but misses most collection items on long boards.
- Require the user to manually scroll first: predictable, but easy to forget and hard to verify.
- Run continuous background scanning: convenient, but too implicit for a first version where explicit user confirmation matters.

### Decision: Submit large imports in batches

The extension splits import requests into batches with defaults of 50 items or roughly 512 KiB per request, merges import summaries, and surfaces batch progress in the page widget.

Rationale: Full-board extraction can produce large payloads. Batching keeps request size manageable while preserving the same server import contract and allowing partial progress visibility.

Alternatives considered:

- Increase server body size only: the server now supports `COLLECTION_HUB_HTTP_BODY_LIMIT`, but very large single requests still provide poor user feedback.
- Add an async queue endpoint: more durable, but beyond the local prototype scope.

### Decision: Allow page-side delete for re-triage

The page widget can build a status-scoped delete request from the currently extracted item IDs and submit it after confirmation. The server deletes only items that match the requested source, status, and fixed destination collection, reporting deleted and skipped counts.

Rationale: While reviewing a source board, the user may want to remove the visible or scanned set from a destination collection without switching to the dashboard. Status scoping prevents accidental removal from another bucket.

Alternatives considered:

- Dashboard-only deletion: keeps mutation UI in one app, but makes source-page cleanup slower.
- Delete by source board metadata: less precise because organizer collections are status-based, not source-board-based.

### Decision: Persist source platform and media type

The shared contracts and server records include a string `source` field on collections, items, and authors, plus optional item `mediaType` values `image` and `video`.

Rationale: The first real source is XHS, but the storage model should not imply every imported item came from XHS forever. Media type is needed for user inspection and future download workflows.

Alternatives considered:

- Infer source from IDs such as `xhs:note:*`: compact, but brittle when showing data, querying, or importing future sources.
- Store media type only in `raw`: easy to add, but hides a first-class dashboard and download-relevant field.

### Decision: Make the dashboard an interactive triage surface

The Next.js app displays API connectivity and a two-pane organizer view. The left navigation shows fixed collection entries and authors for XHS, plus reserved Bilibili and INS groups before those adapters exist. Each fixed collection exposes rating subfilters for S, A, B, and unrated. The right pane displays item cards or an author explorer. Item cards can open source notes, jump to the author view, move items between destination collections, assign S/A/B ratings, and delete with confirmation. The previous top metric cards and recent-import section are removed.

Rationale: The import flow captures raw collection data, but the user's main workflow is ongoing download triage. Keeping movement, deletion, rating, and author review in the dashboard makes the organizer useful after import while preserving the fixed source/status model.

Alternatives considered:

- Read-only dashboard: simpler, but forces all cleanup and triage back into source pages or future tooling.
- Metric-card dashboard with recent imports: useful for diagnostics, but less aligned with the user's day-to-day task of browsing collections and authors.
- Minimal raw JSON viewer: validates storage, but does not provide useful inspection of imported collections.

### Decision: Keep dashboard mutations item-scoped

The server exposes `DELETE /api/dashboard/items/:itemId`, `POST /api/dashboard/items/bulk-delete`, `POST /api/dashboard/items/:itemId/move`, and `POST /api/dashboard/items/:itemId/rating`. Mutations update JSON storage directly, preserve source/status collection invariants, and return structured validation, storage, or not-found errors.

Rationale: Item-scoped APIs are enough for the current dashboard controls and avoid broader collection CRUD semantics. Move operations reuse the fixed destination collection helpers, and rating is optional metadata on item records.

Alternatives considered:

- Expose generic collection mutation endpoints: more flexible, but unnecessary while organizer collections are derived.
- Encode rating as a collection: that would mix quality triage with download-state triage and complicate navigation.

## Risks / Trade-offs

- Unknown target DOM may limit extraction usefulness → Keep adapter and selector configuration isolated and include a sample adapter for local verification.
- XHS board DOM can change → Keep XHS selectors inside one adapter and cover extraction behavior with DOM fixture tests.
- Automatic scrolling may still miss cards if the source page virtualizes content aggressively → Keep the single-card inline import path and show scan progress so users can retry or import individual cards.
- Re-importing an item into another destination collection can leave stale membership → On import, remove imported item IDs from the other two fixed collections for the same source before adding them to the selected collection.
- Dashboard mutations can drift collection membership if they do not respect fixed destination IDs → Centralize delete/move behavior in the dashboard service and cover it with service/controller tests.
- Source page provenance could be lost when organizer collections are fixed → Preserve the extracted source collection/board metadata in collection raw metadata for audit and future UI use.
- JSON file writes can corrupt data if interrupted → Use atomic temp-file writes and preserve the previous valid store on failure.
- Browser extension CORS/local API setup may fail during manual testing → Make API base URL configurable and expose `GET /api/health`.
- Large source boards can exceed default request limits → Batch extension submissions and keep the server body limit configurable through `COLLECTION_HUB_HTTP_BODY_LIMIT`.
- Package scaffolds may produce different script names or defaults over time → Verify official CLI commands before scaffolding and adapt package scripts after initialization.
- Nested workspace dependencies may not be visible from root tooling → Run install/build/test commands from the nested workspace during implementation.

## Migration Plan

1. Scaffold the nested workspace and sub-apps under `scratches/collection-hub`.
2. Add shared contracts in `libs`.
3. Implement the server import, storage, health, and dashboard APIs.
4. Implement the extension extraction, scroll collection, on-page destination collection selection, submit, delete, and retry flow.
5. Add the XHS board adapter and preserve the sample adapter as a fallback fixture adapter.
6. Implement fixed source/status organizer collections and dashboard read states.
7. Implement dashboard item deletion, movement, rating, rating filters, and author detail grouping.
8. Verify the vertical slice with a sample import payload, XHS board fixture tests, dashboard mutation tests, and dashboard refresh.

Rollback is straightforward because the change is isolated to `scratches/collection-hub` and OpenSpec artifacts. Removing that directory reverts the prototype without touching existing app/package behavior.

## Open Questions

- Exact scaffold flags for NestJS, Next.js, and Plasmo must be confirmed immediately before implementation.
- Richer selector configuration and per-site adapter settings are deferred.
- The dashboard currently fetches API data client-side from `NEXT_PUBLIC_API_BASE_URL`, defaulting to `http://localhost:3001`.
- Whether the dashboard should later expose source page provenance as a separate drill-down view is deferred.
- Real Bilibili and Instagram adapters remain deferred even though the dashboard reserves their navigation groups.
