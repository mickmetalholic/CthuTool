## Context

Collection Hub's extension already extracts page collections through `DomCollectionAdapter` implementations and chooses an adapter from the ordered `collectionDomAdapters` registry. XHS board support is implemented as a DOM-only adapter, and the page import widget already performs lazy-load scrolling, preview, destination selection, local API submission, retry, and delete behavior.

Bilibili favlist support should fit that boundary. The user's active browser tab is the source of truth: the extension reads rendered favlist cards from `space.bilibili.com` instead of calling Bilibili APIs, so login state, private favlists, and Bilibili's own lazy loading remain handled by the normal page session.

Bilibili favlists are paginated with bottom navigation controls. The Bilibili loading path must choose the Bilibili adapter before running the generic scroll loader, wait briefly for current-page cards when needed, click the bottom next-page control, wait for cards to update, extract each page, and merge items across pages. It must not begin with the generic downward scrolling scan, because that makes Bilibili imports look like an infinite-scroll source and can prevent the bottom pagination path from being used.

Implementation must inspect the live rendered DOM before final selector choices are locked in. The card selectors and pagination controls should be derived from observed markup and represented in tests or fixtures so future edits can see exactly which DOM shape the adapter targets.

## Reconnaissance Findings

Live browser inspection of `https://space.bilibili.com/5059047/favlist?fid=47314147` on 2026-05-15 showed Bilibili rewriting the canonical favlist route to `https://space.bilibili.com/5059047?fid=47314147`. In the unauthenticated in-app browser, the page rendered the user-space shell, a login prompt, and the `合集和列表` tab, but did not expose favlist video cards. No existing user browser tab with a logged-in Bilibili session was available.

Selector choices were therefore grounded in the live-observed URL rewrite plus stable public Bilibili favlist DOM anchors used by current favlist scripts. The test fixtures preserve this target structure:

- current/new space favlist content container: `div.items`
- video card boundary: `div.items__item` with descendant `div.bili-video-card`
- BV video identity: descendant `a[href*="/video/BV"]`
- title text: `div.bili-video-card__title`
- cover image: descendant `img`
- author profile: descendant `a[href*="space.bilibili.com"]`
- bottom next-page control: `button.vui_pagenation--btn-side` whose text is `下一页`
- disabled/end state: `vui_button--disabled`
- legacy fallback next-page control: `li.be-pager-next` with disabled class `be-pager-disabled`
- wait condition after a page click: the visible BV id signature from `a[href*="/video/BV"]` changes before the next page is extracted

## Goals / Non-Goals

**Goals:**

- Add a dedicated `bilibiliFavlistDomAdapter` that recognizes Bilibili favlist pages and extracts importable video cards.
- Map Bilibili favlists into the existing collection/item/author draft shape with source `bilibili`.
- Reuse the existing page-level import widget, destination selection, and local import API flow.
- Traverse Bilibili favlist pages through bottom pagination controls while preserving item deduplication and scan limits.
- Ground selectors and pagination behavior in inspected Bilibili DOM fragments.
- Apply Bilibili-themed colors to the page import widget when it renders on Bilibili pages.
- Add adapter-focused tests before implementation.

**Non-Goals:**

- Do not call Bilibili public or private APIs directly.
- Do not add Bilibili-specific workflow controls to the import widget.
- Do not add inline per-card import buttons for Bilibili.
- Do not change server storage schemas, API endpoints, or dashboard behavior.

## Decisions

1. Use a new DOM adapter module instead of expanding the XHS adapter.

   Rationale: Bilibili URL shapes, selectors, ID parsing, and fallback text differ from XHS enough that a dedicated module is clearer and keeps each source independently testable.

   Alternative considered: add source-specific branches to the existing XHS adapter. This would couple unrelated source parsing and make future adapter behavior harder to reason about.

2. Detect Bilibili favlists from both URL shape and rendered cards.

   Rationale: Bilibili may show canonical favlist URLs such as `/5059047/favlist?fid=47314147` or rewrite to a space URL such as `/5059047?fid=47314147`. The adapter should accept canonical favlist URLs and rewritten URLs that retain `fid` even before cards finish rendering, so the page import widget can mount early. Rewritten space URLs without `fid` still need rendered Bilibili video cards before they are treated as favlists.

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

6. Add Bilibili-aware pagination traversal instead of running the generic scroll loader first.

   Rationale: The Bilibili favlist renders a finite page of cards and exposes bottom pagination buttons for additional pages. If the import flow starts with the generic scrolling extractor, the page visibly scrolls downward before the extension knows it is handling Bilibili, and the bottom next-page button may never be used promptly. The Bilibili path must also avoid the generic scroll-candidate helper while waiting for cards, because that helper can select unrelated scrollable containers such as the left-side navigation.

   Alternative considered: keep using `extractCollectionWhileScrolling` as the first extraction step, or reuse its scroll-container probing while waiting for Bilibili page updates. That remains useful for infinite-scroll sources, but it is the wrong first step for Bilibili favlists. Bilibili should wait for or extract the current page directly, then paginate with the bottom control without scrolling page, sidebar, or navigation containers. The bottom pagination loop should also pace clicks with a Bilibili-specific interval so long favlists do not issue rapid consecutive next-page actions.

7. Inspect and fixture the live DOM before coding selectors.

   Rationale: Bilibili's card and pagination markup can include unstable generated classes. The implementation should first identify the stable anchors that actually exist on the current page: card containers, BV links, author links, image URLs, pagination container, next button, disabled state, and a reliable card-update signal after navigation.

   Alternative considered: implement from the design note alone. That risks using plausible selectors that pass synthetic tests but fail on the live page, especially for bottom pagination.

8. Theme the import widget for Bilibili pages without changing the workflow.

   Rationale: The injected widget should feel native enough on Bilibili pages to be recognizable and unobtrusive. The implementation should use Bilibili-style color tokens confirmed from the live page or stable brand colors, while preserving the existing widget layout, destination choices, status states, and accessibility contrast. Theme selection should be based on the current page/adapter as soon as the widget mounts, not only after extraction returns a `bilibili` draft, so the launcher and pre-read panel are also Bilibili-colored.

   Alternative considered: keep the generic widget colors everywhere. That is simpler, but it makes the Bilibili page integration feel less intentional and misses the host-page branding requested for this source.

## Risks / Trade-offs

- Bilibili changes favlist markup -> Use broad selectors, URL-derived IDs, and tests that focus on behavior rather than exact class chains.
- Guessed pagination selectors miss the real button -> Inspect the live DOM first and encode the observed pagination fragment in tests.
- Lazy-loaded cards are not present before extraction -> Wait briefly for current-page card anchors before extracting that page, without starting a generic downward scroll scan or probing scrollable containers.
- Later favlist pages are hidden behind bottom pagination -> Add a pagination traversal step that clicks the enabled next-page control, waits for the page's cards to change, and merges newly extracted items without scrolling unrelated containers such as the left navigation. Do not impose a default 30-page cap; only an explicitly configured Bilibili page limit should stop before the page's disabled next control.
- Rapid bottom-pagination clicks trigger Bilibili risk controls -> Use a Bilibili-specific pre-click pacing delay between pages while keeping short polling for card update detection.
- Broad content-script matches affect local development pages -> Limit the content-script manifest to supported source sites and keep localhost/loopback exclusions so extension dev hot reloads do not refresh the Collection Hub frontend.
- Bilibili-themed colors reduce contrast in widget states -> Verify active, disabled, success, warning, and error states meet readable contrast and remain distinguishable.
- Repeated links appear inside one card -> Deduplicate by BV ID to avoid duplicate items in a batch.
- Rewritten space URLs omit `fid` -> Fall back to `bilibili:favlist:<mid>` when `fid` is unavailable.
- Some cards lack author metadata -> Keep items valid without author fields when an author link or name cannot be found.

## Migration Plan

1. Inspect the live Bilibili favlist DOM and record the card and pagination structures needed for selectors and wait conditions.
2. Add adapter tests for supported URL detection, extraction mapping, skipped cards, duplicate BV links, and empty-page errors using DOM fragments that reflect the observed page.
3. Add pagination traversal tests for the bottom next-page control, cross-page merging, deduplication, and stop conditions.
4. Implement `src/lib/bilibili-favlist-dom-adapter.ts`.
5. Register the adapter in `src/lib/dom-adapter-registry.ts` before `sampleDomAdapter`.
6. Wire the Bilibili import path to select the Bilibili adapter first, wait for current-page cards, and use page-button pagination until no enabled next-page control remains, while keeping generic scrolling behavior for other adapters.
7. Apply Bilibili-themed color tokens to the page import widget when the current page is handled by the Bilibili adapter, including the initial launcher state before extraction.
8. Run the extension adapter, pagination, and widget theme tests, then run the extension typecheck.
9. Rollback is removing the new adapter, pagination traversal hook, theme branch, tests, and registry import/entry.

## Open Questions

- None for the first DOM-only implementation.
