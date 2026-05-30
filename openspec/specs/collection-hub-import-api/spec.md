## Purpose
Define the Collection Hub local API behavior for validating imports, persisting fixed destination collections, exposing dashboard data, and mutating imported items.

## Requirements

### Requirement: Import payload validation
The server SHALL validate collection import payloads against shared schemas before mutating storage.

#### Scenario: Valid payload is accepted
- **WHEN** the extension submits a valid collection import payload
- **THEN** the server processes the import and returns an import summary

#### Scenario: Invalid payload is rejected
- **WHEN** the extension submits an invalid collection import payload
- **THEN** the server returns a structured 400 error
- **AND** the JSON store is not mutated

### Requirement: Collection import upsert
The server SHALL upsert fixed destination collection, item, and author records from each accepted import payload.

#### Scenario: New collection and items are imported
- **WHEN** an accepted import contains collection, item, and author IDs not present in storage
- **THEN** the server creates or ensures the source platform's three fixed destination collection records
- **AND** it creates item and author records
- **AND** the import summary reports created records

#### Scenario: Existing item is re-imported
- **WHEN** an accepted import contains an item ID already present in storage
- **THEN** the server overwrites that item's metadata and status with the submitted values
- **AND** it preserves the existing item rating when the import payload does not include rating data
- **AND** the import summary reports the item as updated

#### Scenario: Existing collection is re-imported
- **WHEN** an accepted import targets a fixed destination collection already present in storage
- **THEN** the server refreshes that destination collection metadata, item membership, source page metadata, and updated timestamp

### Requirement: Fixed source destination collections
The server SHALL maintain exactly three organizer destination collections per source platform: pending download, downloaded, and not download.

#### Scenario: XHS source collections are derived
- **WHEN** an accepted import payload has source `xhs`
- **THEN** the server ensures collection records with IDs `xhs:pending_download`, `xhs:downloaded`, and `xhs:not_downloaded`
- **AND** their display titles correspond to `待下载`, `已下载`, and `不下载`

#### Scenario: Items are imported into the selected destination
- **WHEN** an accepted import payload has source `xhs` and status `pending_download`
- **THEN** every imported item ID is added to collection `xhs:pending_download`
- **AND** the item status is stored as `pending_download`

#### Scenario: Items move between destination collections
- **WHEN** an item that already belongs to one fixed collection for the same source is re-imported with another status
- **THEN** the server removes that item ID from the other fixed collections for that source
- **AND** it adds the item ID to the selected destination collection

#### Scenario: Source page metadata is preserved
- **WHEN** the accepted import payload includes a source-site collection or board ID, title, URL, and cover
- **THEN** the fixed destination collection preserves that source collection metadata in raw metadata
- **AND** it does not use the source-site collection ID as the organizer collection ID

### Requirement: Source platform persistence
The server SHALL persist the import source platform with collection, item, and author records.

#### Scenario: XHS import is accepted
- **WHEN** an accepted import payload has source `xhs`
- **THEN** the created or updated collection record stores source `xhs`
- **AND** every created or updated item record stores source `xhs`
- **AND** every touched author record stores source `xhs`

#### Scenario: Future source import is accepted
- **WHEN** an accepted import payload uses another source string such as `bilibili` or `instagram`
- **THEN** the same collection, item, and author source fields can store that source without changing the storage shape

### Requirement: Item media type persistence
The server SHALL persist optional item media type values from import payloads.

#### Scenario: Imported item is a video
- **WHEN** an accepted item draft has media type `video`
- **THEN** the item record stores media type `video`

#### Scenario: Imported item is an image note
- **WHEN** an accepted item draft has media type `image`
- **THEN** the item record stores media type `image`

### Requirement: Item rating persistence
The server SHALL persist optional dashboard item rating values independently from import payloads.

#### Scenario: Item is rated
- **WHEN** a client submits rating `S`, `A`, or `B` for an existing item
- **THEN** the item record stores that rating
- **AND** dashboard item and recent item summaries include the rating

#### Scenario: Invalid rating is submitted
- **WHEN** a client submits a rating outside `S`, `A`, or `B`
- **THEN** the server returns a structured 400 error
- **AND** storage is not mutated

### Requirement: Author metadata persistence
The server SHALL persist author profile metadata from import payloads in the author table.

#### Scenario: Author includes profile and avatar URLs
- **WHEN** an accepted item draft includes an author ID, name, profile URL, and avatar URL
- **THEN** the author record stores the source, ID, name, profile URL, avatar URL, and updated timestamp

### Requirement: Deterministic fallback identifiers
The server SHALL support deterministic fallback identifiers when source IDs are missing.

#### Scenario: Item source ID is missing
- **WHEN** an accepted item draft has no source item ID
- **THEN** the server derives a stable fallback ID from item URL and collection ID

#### Scenario: Author source ID is missing
- **WHEN** an accepted author draft has no source author ID
- **THEN** the server derives a stable fallback ID from profile URL or display name

### Requirement: JSON storage persistence
The server SHALL persist organizer data to a local JSON store using atomic writes.

#### Scenario: Store file is missing
- **WHEN** the server reads storage and the JSON store file does not exist
- **THEN** the server initializes an empty store

#### Scenario: Store write succeeds
- **WHEN** an import mutates storage
- **THEN** the server writes a temporary JSON file and renames it over the store file

#### Scenario: Store write fails
- **WHEN** a storage write fails
- **THEN** the server returns a structured error
- **AND** the previous valid store remains usable

### Requirement: Dashboard data API
The server SHALL expose dashboard-ready data for the web app.

#### Scenario: Dashboard data requested
- **WHEN** the web app requests dashboard data
- **THEN** the server returns totals for collections, items, and authors
- **AND** it returns status counts, recent items, author summaries, and collection summaries
- **AND** recent items include source platform and media type when available
- **AND** item summaries include rating when available
- **AND** collection summaries include source platform and fixed destination status

#### Scenario: Dashboard author summaries requested
- **WHEN** the web app requests dashboard data
- **THEN** the server returns author summaries
- **AND** author summaries include source, name, avatar URL, profile URL, and updated timestamp when available

### Requirement: Health API
The server SHALL expose a health endpoint for local integration checks.

#### Scenario: Health requested
- **WHEN** a client requests the health endpoint
- **THEN** the server returns service availability information

### Requirement: Dashboard item mutation API
The server SHALL expose item-scoped mutation endpoints for dashboard and page-widget triage.

#### Scenario: Single item is deleted
- **WHEN** a client deletes `/api/dashboard/items/:itemId` for an existing item
- **THEN** the server removes the item from storage
- **AND** it removes that item ID from all destination collection memberships

#### Scenario: Missing item is deleted
- **WHEN** a client deletes `/api/dashboard/items/:itemId` for a missing item
- **THEN** the server returns a structured 404 error

#### Scenario: Items are bulk deleted by source and status
- **WHEN** a client submits a valid source/status-scoped bulk delete request
- **THEN** the server deletes only items that match the requested source, status, and fixed destination collection
- **AND** it returns deleted item IDs plus deleted and skipped counts

#### Scenario: Item is moved to another destination status
- **WHEN** a client submits a valid move request for an existing item
- **THEN** the server removes the item ID from every collection for that source
- **AND** it adds the item ID to the target status destination collection
- **AND** it updates the item's `collectionId`, `status`, and `updatedAt`

#### Scenario: Target destination collection is missing during move
- **WHEN** the target fixed destination collection does not yet exist
- **THEN** the server creates it using the fixed destination collection helpers

### Requirement: Local API runtime configuration
The server SHALL expose local runtime configuration for development and extension integration.

#### Scenario: Server port is configured
- **WHEN** the server starts
- **THEN** it listens on `PORT` when provided
- **AND** otherwise listens on port `3001`

#### Scenario: Global API prefix is configured
- **WHEN** server routes are registered
- **THEN** API routes are served under the `/api` prefix

#### Scenario: Request body limit is configured
- **WHEN** `COLLECTION_HUB_HTTP_BODY_LIMIT` is set
- **THEN** the JSON and URL-encoded body parsers use that limit
- **AND** otherwise they use `25mb`

#### Scenario: Local extension CORS is allowed
- **WHEN** the server receives browser requests from local extension or dashboard origins
- **THEN** CORS is enabled with reflected origins for local development
