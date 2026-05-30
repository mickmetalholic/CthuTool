## Why

Users need a lightweight way to capture collection items from configurable browser pages, assign download state, persist the data locally, and inspect it from a dashboard. Building this as an isolated scratch workspace lets the end-to-end workflow be validated without disturbing the existing `@cthutool/*` monorepo.

## What Changes

- Add an isolated nested pnpm workspace under `scratches/collection-hub`.
- Scaffold separate NestJS, Next.js, Plasmo, and shared TypeScript packages under the `@collection-hub` scope.
- Add a Plasmo extension flow that injects an on-page import control on configured matched pages, extracts collection items, lets the user choose one of the source platform's three fixed destination collections, and submits the import to a local API without using an extension popup.
- Add an extensible DOM adapter registry with an initial XHS board adapter that extracts loaded `.note-item` cards, note IDs/URLs, cover images, media type, author IDs/URLs, author names, and author avatars.
- Add page scrolling extraction that progressively collects lazy-loaded cards, deduplicates items, reports scan progress, and stops after the page stops growing.
- Add inline import buttons on each XHS card so a single note can be imported directly into one of the three fixed destination collections, with confirmation before submission.
- Add batched import submission for large collections and a page-driven bulk delete action for removing the currently extracted item IDs from a selected status collection.
- Add a NestJS API that validates imports, derives fixed source/status organizer collections, upserts collections/items/authors, preserves source page metadata, persists them to JSON storage, and exposes dashboard data including source platform and item media type.
- Add dashboard item mutation endpoints for single delete, status move, rating, and source/status-scoped bulk delete.
- Add a Next.js organizer dashboard with left source navigation, reserved XHS/Bilibili/INS source groups, fixed collection entries, rating filters, author detail views, and item controls for delete, status movement, and S/A/B rating.
- Add shared contracts for statuses, fixed destination collections, media types, item ratings, source platform metadata, mutation DTO schemas, dashboard response shapes, and API error shapes.

## Capabilities

### New Capabilities

- `collection-hub-workspace`: Defines the isolated nested workspace and shared package boundaries for the organizer prototype.
- `collection-hub-import-extension`: Covers browser extension page matching, DOM extraction, on-page destination collection selection, and import submission behavior.
- `collection-hub-import-api`: Covers server-side import validation, JSON persistence, fixed source/status collection behavior, collection/item/author upserts, dashboard API responses, and dashboard item mutation endpoints.
- `collection-hub-dashboard`: Covers the dashboard that displays imported collections, items, authors, status summaries, rating filters, author details, and item triage controls.

### Modified Capabilities

- None.

## Impact

- Adds files under `scratches/collection-hub/`.
- Adds OpenSpec artifacts under `openspec/changes/add-collection-hub/`.
- Introduces package scope `@collection-hub/*` inside the nested workspace.
- Introduces local API endpoints for health checks, collection imports, and dashboard data.
- Introduces JSON file storage for prototype persistence.
- Makes the extension toolbar icon open the configuration/options page directly; the options page may remain a placeholder in this change.
- Adds local dashboard mutation endpoints under `/api/dashboard/items/*` for deleting, moving, rating, and bulk deleting imported items.
- Adds local runtime configuration through `PORT`, `COLLECTION_HUB_STORE_PATH`, and `COLLECTION_HUB_HTTP_BODY_LIMIT`.
- Does not change the root pnpm workspace, root Turbo configuration, or existing `@cthutool/*` packages.
