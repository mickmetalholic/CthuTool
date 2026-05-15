## Context

Collection Hub's extension already extracts page collections through `DomCollectionAdapter` implementations and chooses an adapter from the ordered `collectionDomAdapters` registry. XHS board support is implemented as a DOM-only adapter, and the page import widget already performs lazy-load scrolling, preview, destination selection, local API submission, retry, and delete behavior.

Bilibili favlist support should fit that boundary. The user's active browser tab is the source of truth: the extension reads rendered favlist cards from `space.bilibili.com` instead of calling Bilibili APIs, so login state, private favlists, and Bilibili's own lazy loading remain handled by the normal page session.

## Goals / Non-Goals

**Goals:**

- Add a dedicated `bilibiliFavlistDomAdapter` that recognizes Bilibili favlist pages and extracts importable video cards.
- Map Bilibili favlists into the existing collection/item/author draft shape with source `bilibili`.
- Reuse the existing page-level import widget, scrolling loader, destination selection, and local import API flow.
- Add adapter-focused tests before implementation.

**Non-Goals:**

- Do not call Bilibili public or private APIs directly.
- Do not add Bilibili-specific UI to the import widget.
- Do not add inline per-card import buttons for Bilibili.
- Do not change server storage schemas, API endpoints, or dashboard behavior.

## Decisions

1. Use a new DOM adapter module instead of expanding the XHS adapter.

   Rationale: Bilibili URL shapes, selectors, ID parsing, and fallback text differ from XHS enough that a dedicated module is clearer and keeps each source independently testable.

   Alternative considered: add source-specific branches to the existing XHS adapter. This would couple unrelated source parsing and make future adapter behavior harder to reason about.

2. Detect Bilibili favlists from both URL shape and rendered cards.

   Rationale: Bilibili may show canonical favlist URLs such as `/5059047/favlist?fid=47314147` or rewrite to a space URL such as `/5059047?fid=47314147` while still rendering favlist cards. The adapter should accept canonical favlist URLs and the observed rewritten form when the page exposes Bilibili video cards.

   Alternative considered: require only `/favlist` in the path. That would miss rewritten pages that still contain the importable favlist DOM.

3. Treat rendered BV links as the stable item boundary.

   Rationale: Bilibili video links expose canonical BV IDs that can produce stable item IDs and URLs. Cards without a BV link are skipped because they cannot produce a reliable item identity.

   Alternative considered: derive item IDs from card position or image URLs. Those identifiers are not stable enough for re-import and delete behavior.

4. Use broad, stable selectors and URL parsing helpers.

   Rationale: Selectors such as `.bili-video-card`, `.items__item`, `a[href*="/video/BV"]`, `a[href*="space.bilibili.com"]`, and descendant `img` avoid coupling to hashed CSS module names while matching observed favlist markup.

   Alternative considered: rely on highly specific class chains from the current page. That would be brittle across Bilibili frontend changes.

5. Register the Bilibili adapter before the sample adapter.

   Rationale: Source-specific adapters should win before the generic sample adapter fallback. Existing XHS ordering remains intact.

   Alternative considered: append after the sample adapter. That risks sample markup accidentally masking Bilibili extraction in tests or development fixtures.

## Risks / Trade-offs

- Bilibili changes favlist markup -> Use broad selectors, URL-derived IDs, and tests that focus on behavior rather than exact class chains.
- Lazy-loaded cards are not present before extraction -> Reuse `extractCollectionWhileScrolling` so the page can scroll and merge cards before submission.
- Repeated links appear inside one card -> Deduplicate by BV ID to avoid duplicate items in a batch.
- Rewritten space URLs omit `fid` -> Fall back to `bilibili:favlist:<mid>` when `fid` is unavailable.
- Some cards lack author metadata -> Keep items valid without author fields when an author link or name cannot be found.

## Migration Plan

1. Add adapter tests for supported URL detection, extraction mapping, skipped cards, duplicate BV links, and empty-page errors.
2. Implement `src/lib/bilibili-favlist-dom-adapter.ts`.
3. Register the adapter in `src/lib/dom-adapter-registry.ts` before `sampleDomAdapter`.
4. Run the extension adapter tests, then run the extension typecheck.
5. Rollback is removing the new adapter file, its tests, and registry import/entry.

## Open Questions

- None for the first DOM-only implementation.
