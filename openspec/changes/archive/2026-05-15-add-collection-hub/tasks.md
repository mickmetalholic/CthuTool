## 1. Workspace Setup

- [x] 1.1 Verify current official scaffolding commands and flags for NestJS, Next.js, and Plasmo.
- [x] 1.2 Create `scratches/collection-hub` with nested `package.json` and `pnpm-workspace.yaml`.
- [x] 1.3 Scaffold `server`, `web`, and `extension` using the official starters.
- [x] 1.4 Create the `libs` TypeScript package and name all nested packages with the `@collection-hub/*` scope.
- [x] 1.5 Add nested workspace scripts for install, build, typecheck, and package-specific development commands.

## 2. Shared Contracts

- [x] 2.1 Define shared status values `pending_download`, `downloaded`, and `not_downloaded` with Chinese display labels.
- [x] 2.2 Define collection, item, author, import payload, import summary, dashboard response, and API error types.
- [x] 2.3 Add validation schemas for import payloads and reusable parsing helpers.
- [x] 2.4 Export framework-free APIs from `@collection-hub/libs` for server, web, and extension consumers.
- [x] 2.5 Add package-level typecheck/build verification for `libs`.
- [x] 2.6 Define item media types `image` and `video`, plus source platform fields for collection, item, and author records.

## 3. Server Import API

- [x] 3.1 Add NestJS modules/providers for health, imports, dashboard, and JSON storage.
- [x] 3.2 Implement JSON store initialization, atomic temp-file writes, and read/write error handling.
- [x] 3.3 Implement import payload validation at the API boundary using shared schemas.
- [x] 3.4 Implement collection, item, and author upsert behavior with deterministic fallback IDs.
- [x] 3.5 Implement `GET /api/health`, `POST /api/imports/collections`, and `GET /api/dashboard`.
- [x] 3.6 Add focused server tests for validation rejection, successful import, re-import updates, fallback IDs, and dashboard summaries.
- [x] 3.7 Persist source platform on collections, items, and authors, and persist optional item media type.

## 4. Browser Extension

- [x] 4.1 Configure Plasmo extension settings for API base URL and match patterns.
- [x] 4.2 Add the DOM adapter boundary with `canHandle()` and `extract()` behavior.
- [x] 4.3 Add a generic or sample adapter that can produce a valid collection draft for local verification.
- [x] 4.4 Implement user-triggered extraction from popup or page action.
- [x] 4.5 Implement batch status selection before import submission.
- [x] 4.6 Implement API submission, success summary display, visible error state, and retry with the same payload.
- [x] 4.7 Add an adapter registry and an XHS board adapter for loaded `.note-item` cards, including note URLs, author URLs, covers, avatars, and media type.

## 5. Web Dashboard

- [x] 5.1 Implement a Next.js single-page dashboard that reads `GET /api/dashboard`.
- [x] 5.2 Display API connected/error state, loading state, and empty-store state.
- [x] 5.3 Display collection, item, and author totals plus last import timestamp.
- [x] 5.4 Display status distribution and status filter controls.
- [x] 5.5 Display recent imported items and collection summaries without mutation controls.
- [x] 5.6 Display source platform and media type in dashboard item and collection summaries.

## 6. End-to-End Verification

- [x] 6.1 Run nested workspace install and package-level typecheck/build commands.
- [x] 6.2 Submit a sample import payload to the local server and verify the import summary.
- [x] 6.3 Confirm the JSON store contains the imported collection, items, authors, statuses, and timestamps.
- [x] 6.4 Confirm the dashboard reflects the sample import and status filter behavior.
- [x] 6.5 Confirm the root workspace config remains unchanged and the organizer stays isolated under `scratches/collection-hub`.
- [x] 6.6 Verify the XHS board adapter tests and run the full nested workspace check after source/media changes.

## 7. Fixed Destination Collections and Page Control

- [x] 7.1 Update OpenSpec and shared contracts for source/status destination collections and the `不下载` label.
- [x] 7.2 Update server import behavior to derive three fixed collections per source, preserve source page metadata, and move re-imported items between status collections.
- [x] 7.3 Update dashboard summaries to display fixed source/status collections.
- [x] 7.4 Replace the popup-centered import path with a page-integrated extraction, destination selection, submit, error, and retry control.
- [x] 7.5 Verify OpenSpec validation and the nested workspace check after the destination collection/page control change.

## 8. No Popup Toolbar Routing

- [x] 8.1 Update OpenSpec to state that the extension ships no popup and toolbar icon clicks open the configuration page directly.
- [x] 8.2 Add an extension routing test for toolbar icon click behavior.
- [x] 8.3 Remove the popup page, wire the background action click to the options page, and leave the configuration page as a placeholder.
- [x] 8.4 Verify OpenSpec validation, nested workspace checks, and packaged manifest popup absence.

## 9. Dashboard Source Navigation Layout

- [x] 9.1 Update OpenSpec for the dashboard source navigation layout and author list behavior.
- [x] 9.2 Add dashboard view-model tests for the `xhs` navigation entries and selected right-side list.
- [x] 9.3 Expose dashboard author summaries from the API.
- [x] 9.4 Replace the web dashboard metric/recent-import layout with left navigation and right list views.
- [x] 9.5 Verify OpenSpec validation, nested workspace checks, and the local dashboard page.

## 10. Code-Aligned Feature Documentation Refresh

- [x] 10.1 Update OpenSpec to reflect automatic page scrolling extraction, scan progress, and deduplicated collection drafts.
- [x] 10.2 Update OpenSpec to reflect inline XHS per-card import buttons and confirmation flow.
- [x] 10.3 Update OpenSpec to reflect batched extension import submission and source/status-scoped page-side delete.
- [x] 10.4 Update OpenSpec to reflect dashboard delete, move, rating, and bulk delete APIs.
- [x] 10.5 Update OpenSpec to reflect S/A/B item ratings, rating filters, author detail grouping, and reserved Bilibili/INS navigation.
- [x] 10.6 Update OpenSpec to reflect local runtime configuration for `PORT`, `COLLECTION_HUB_STORE_PATH`, and `COLLECTION_HUB_HTTP_BODY_LIMIT`.
