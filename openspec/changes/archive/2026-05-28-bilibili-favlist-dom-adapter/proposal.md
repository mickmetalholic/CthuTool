## Why

Collection Hub can import XHS boards today, but Bilibili favlists are another high-value source for saved video collections. Reading the rendered favlist DOM in the user's browser lets the extension reuse the user's existing Bilibili session and page loading behavior without adding direct Bilibili API integration.

## What Changes

- Add Bilibili favlist page support to the extension DOM adapter registry.
- Extract Bilibili favlist collection metadata, video items, covers, canonical video URLs, and author profile metadata from rendered page cards.
- Reuse the existing page import widget, destination selection, and local API submission flow.
- Support Bilibili's bottom-button pagination so imports can traverse favlist pages instead of only reading the currently rendered page.
- Verify the live rendered Bilibili DOM before finalizing selectors, especially the video card structure and bottom pagination controls.
- Theme the on-page import widget with Bilibili-style colors when it is displayed on Bilibili pages.
- Keep inline per-card import buttons scoped to XHS for this change.
- Surface Bilibili-specific extraction errors when the page is not a favlist or no importable video cards are found.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `collection-hub-import-extension`: add concrete Bilibili favlist DOM adapter behavior to the existing extension extraction and adapter registry requirements.

## Impact

- Affects the Collection Hub extension under `scratches/collection-hub/extension`, including adapter extraction, page-loading behavior, and page-widget theming for paginated Bilibili favlists.
- Adds adapter-level Vitest coverage for Bilibili favlist extraction.
- No new API endpoints, storage schema changes, dashboard behavior changes, or external Bilibili API dependency are required.
