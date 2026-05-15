# Collection Hub Design

Date: 2026-05-12
Status: Approved for implementation planning
Target directory: `scratches/xhs-collection-organizer`

## Summary

Create an isolated nested pnpm monorepo under `scratches/xhs-collection-organizer` for a browser-extension-driven collection organizer. The first version is a vertical slice prototype: a Plasmo extension extracts collection items from configurable matched pages, asks the user to assign one status to the import batch, sends the result to a NestJS API, stores the data in a JSON file, and displays it in a Next.js dashboard.

The package scope for all nested workspace packages is `@collection-hub`.

## Goals

- Initialize the sub-apps with their official scaffolding tools:
  - NestJS server
  - Next.js web app
  - Plasmo browser extension
  - Shared TypeScript libs package
- Keep the nested workspace independent from the root `@cthutool/*` pnpm/Turbo workspace.
- Implement the thinnest useful end-to-end path: extract, choose status, import, persist, display.
- Use shared contracts so the extension, server, and web app agree on data shapes.
- Avoid binding the first version to a specific production URL or DOM shape.

## Non-Goals

- No production database in the first version.
- No hard-coded final XHS page adapter in the first version.
- No web-side status editing in the first version.
- No background import queue in the extension.
- No authentication or multi-user support.

## Workspace Layout

```text
scratches/xhs-collection-organizer/
├── package.json
├── pnpm-workspace.yaml
├── server/
├── web/
├── extension/
└── libs/
```

Expected package names:

- `@collection-hub/server`
- `@collection-hub/web`
- `@collection-hub/extension`
- `@collection-hub/libs`

The nested `pnpm-workspace.yaml` should include only the four local packages. The root repository workspace config should not be changed for this prototype unless a later plan explicitly chooses to integrate it.

## Architecture

The system has four units:

- Extension: runs on configured pages, extracts collection drafts, lets the user choose one status for the current import, and submits the import payload.
- Server: validates import payloads, upserts collections/items/authors, writes JSON storage, and serves dashboard data.
- Web: renders a read-only dashboard from server API data.
- Libs: owns shared statuses, TypeScript types, DTO schemas, and optional API client helpers.

Data flow:

```text
Matched browser page
  -> Plasmo content script DOM adapter
  -> Plasmo popup import confirmation
  -> POST /api/imports/collections
  -> NestJS import service
  -> JSON repository
  -> GET /api/dashboard
  -> Next.js dashboard
```

## Data Model

The JSON store should be shaped like future database tables so a later migration remains straightforward.

### Collection

- `id`: stable source ID or deterministic fallback
- `sourceUrl`: page URL used for extraction
- `title`: collection title when found
- `description`: optional collection description
- `coverUrl`: optional cover image URL
- `itemIds`: ordered item IDs in the collection
- `importedAt`: first import timestamp
- `updatedAt`: last update timestamp

### Collection Item

- `id`: stable source item ID or deterministic fallback
- `collectionId`: owning collection ID
- `authorId`: linked author ID when available
- `title`: item title or display text
- `noteUrl`: source item URL
- `coverUrl`: optional cover image URL
- `status`: one of the shared status values
- `raw`: small raw extraction snapshot for debugging
- `importedAt`: first import timestamp
- `updatedAt`: last update timestamp

### Author

- `id`: stable source author ID or deterministic fallback
- `name`: display name
- `avatarUrl`: optional avatar image URL
- `profileUrl`: optional author profile URL
- `raw`: small raw extraction snapshot for debugging
- `updatedAt`: last update timestamp

### Status Values

Shared enum values:

- `pending_download`
- `downloaded`
- `not_downloaded`

Display labels:

- 待下载
- 已下载
- 未下载

The UI may localize these labels, but storage and API payloads should use the stable enum values.

## Upsert Rules

- Re-importing an existing item ID overwrites item metadata and status.
- Re-importing an existing collection ID refreshes collection metadata, item order, and updated timestamp.
- Authors are upserted by author ID.
- If an author ID is unavailable, generate a deterministic fallback from profile URL or display name.
- If an item ID is unavailable, generate a deterministic fallback from item URL and collection ID.
- Failed payload validation must not mutate JSON storage.

## API Contract

### `GET /api/health`

Returns service status for local integration checks.

### `POST /api/imports/collections`

Accepts one collection import batch from the extension.

Payload fields:

- `source`: string identifying the adapter/source
- `status`: shared status enum applied to all submitted items
- `collection`: collection draft
- `items`: item draft list, each with optional author draft
- `capturedAt`: client capture timestamp

Behavior:

- Validate the payload with shared schemas.
- Reject invalid payloads with structured 400 responses.
- Upsert collection, items, and authors.
- Return an import summary: collection ID, created/updated item counts, author count, and updated timestamp.

### `GET /api/dashboard`

Returns dashboard-ready data:

- totals for collections, items, authors
- status counts
- recent imports/items
- collection summaries with item counts and status counts

The first web app should consume this endpoint directly. It does not need separate list/detail endpoints yet.

## Extension Design

The extension starts generic. It should provide settings for:

- API base URL, defaulting to `http://localhost:3001`
- match patterns list
- selector or adapter configuration

The extension has an adapter boundary:

```ts
interface DomCollectionAdapter {
  canHandle(location: Location, document: Document): boolean
  extract(document: Document): CollectionDraft
}
```

First-version flow:

1. Content script activates on configured match patterns.
2. User triggers extraction from popup or page action.
3. Adapter extracts collection and item drafts.
4. Popup shows collection title and item count.
5. User chooses one status for the whole import.
6. User submits to the configured API base URL.
7. Success shows the import summary.
8. Failure keeps the extracted payload visible and offers retry.

The extension must not silently auto-submit in the background in the first version.

## Web Dashboard Design

The Next.js app is a read-only single-page dashboard.

Primary UI:

- API connection status
- total collections
- total items
- total authors
- last import timestamp
- status distribution
- status filter controls
- recent imported items table
- collection summary cards or table

First-version states:

- loading
- empty store
- API connected with data
- API unavailable/error

The dashboard should feel like an operational tool: compact, scannable, and focused on repeated inspection.

## Server Design

NestJS modules:

- health module
- imports module
- dashboard module
- storage module or repository provider

Storage:

- JSON file under a local data directory inside the nested workspace by default.
- Use atomic writes: write a temp file, then rename it over the store file.
- Initialize an empty store when the file does not exist.
- Keep repository logic separate from controllers so database migration later touches fewer files.

Validation:

- Shared schemas live in `libs`.
- Server validates API payloads at the boundary.
- Domain services operate on parsed, typed data.

## Shared Libs Design

The `libs` package should avoid framework dependencies. It owns:

- shared status enum
- collection/item/author types
- import DTO schemas
- dashboard response types
- API error shape
- optional fetch-based API client helpers

The package should be importable from all three apps.

## Error Handling

- Server returns structured 400 errors for invalid payloads.
- Server returns structured 500 errors for storage write/read failures.
- Extension shows extraction errors, API connection errors, validation errors, and retry affordance.
- Web shows loading, empty, connected, and API error states.
- JSON write failures should not corrupt the previous valid store.

## Verification

Minimum verification for implementation:

- `libs` typecheck/build passes.
- `server` typecheck/build passes.
- `web` typecheck/build passes.
- `extension` typecheck/build passes where the scaffold supports it.
- Server unit tests cover DTO validation and item/author/collection upsert behavior.
- A sample import payload can be posted to the server.
- The dashboard reflects the sample import after the POST succeeds.

Before running scaffolding commands, verify current official CLI commands for NestJS, Next.js, and Plasmo.

## Open Decisions Deferred To Implementation Planning

- Exact scaffold flags for each official starter.
- Whether to add a nested workspace task runner or keep plain pnpm scripts.
- Exact shape of the selector configuration file/UI.
- Whether dashboard rendering should be server-side fetched or client-side fetched in the first Next.js app.
