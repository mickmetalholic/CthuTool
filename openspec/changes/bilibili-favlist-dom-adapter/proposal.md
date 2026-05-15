## Why

Collection Hub can import XHS boards today, but Bilibili favlists are another high-value source for saved video collections. Reading the rendered favlist DOM in the user's browser lets the extension reuse the user's existing Bilibili session and page loading behavior without adding direct Bilibili API integration.

## What Changes

- Add Bilibili favlist page support to the extension DOM adapter registry.
- Extract Bilibili favlist collection metadata, video items, covers, canonical video URLs, and author profile metadata from rendered page cards.
- Reuse the existing page import widget, scrolling loader, destination selection, and local API submission flow.
- Keep inline per-card import buttons scoped to XHS for this change.
- Surface Bilibili-specific extraction errors when the page is not a favlist or no importable video cards are found.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `collection-hub-import-extension`: add concrete Bilibili favlist DOM adapter behavior to the existing extension extraction and adapter registry requirements.

## Impact

- Affects the Collection Hub extension under `scratches/collection-hub/extension`.
- Adds adapter-level Vitest coverage for Bilibili favlist extraction.
- No new API endpoints, storage schema changes, dashboard behavior changes, or external Bilibili API dependency are required.
