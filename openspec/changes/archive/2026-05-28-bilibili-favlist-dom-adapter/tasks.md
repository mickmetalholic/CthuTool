## 1. DOM Reconnaissance

- [x] 1.1 Inspect a live Bilibili favlist page such as `https://space.bilibili.com/5059047/favlist?fid=47314147` in the browser.
- [x] 1.2 Record the observed video card DOM structure, including stable card anchors, BV video links, title text, cover images, author links, and collection title candidates.
- [x] 1.3 Record the observed bottom pagination DOM structure, including the pagination container, next-page button, disabled/end-of-list state, current page indicator if present, and any stable accessibility attributes.
- [x] 1.4 Identify the wait condition that proves a page turn has completed, such as page indicator change or the visible BV id set changing.
- [x] 1.5 Convert the observed card and pagination structures into focused test fixtures or fake DOM builders.

## 2. Adapter Test Coverage

- [x] 2.1 Add or update `scratches/collection-hub/extension/src/lib/bilibili-favlist-dom-adapter.spec.ts` using DOM fragments based on the observed live page.
- [x] 2.2 Cover `canHandle()` returning true for `https://space.bilibili.com/5059047/favlist?fid=47314147`.
- [x] 2.3 Cover extraction of source `bilibili`, collection ID, title, source URL, collection cover URL, canonical BV item IDs, titles, video URLs, covers, media type `video`, and author records.
- [x] 2.4 Cover skipped cards without BV video links and deduplication of repeated BV links in one card.
- [x] 2.5 Cover the empty-page error `当前 Bilibili 收藏夹没有可导入的视频卡片`.

## 3. Pagination Test Coverage

- [x] 3.1 Add tests for finding and clicking the bottom next-page control from the observed pagination DOM.
- [x] 3.2 Cover disabled or unavailable next-page states stopping traversal.
- [x] 3.3 Cover waiting for card updates after a page click before extracting the next page.
- [x] 3.4 Cover cross-page item merging and BV ID deduplication.
- [x] 3.5 Cover scan-limit behavior so pagination cannot loop forever.

## 4. Bilibili DOM Adapter

- [x] 4.1 Add or update `scratches/collection-hub/extension/src/lib/bilibili-favlist-dom-adapter.ts` exporting `bilibiliFavlistDomAdapter`.
- [x] 4.2 Implement page detection for canonical favlist URLs and observed rewritten space URLs that still expose Bilibili video cards.
- [x] 4.3 Implement collection metadata mapping with `bilibili:favlist:<fid>` and `bilibili:favlist:<mid>` fallback IDs.
- [x] 4.4 Implement card extraction using stable selectors verified against the observed Bilibili DOM.
- [x] 4.5 Normalize Bilibili video URLs, profile URLs, and image URLs to absolute HTTPS URLs.
- [x] 4.6 Skip cards without BV IDs and throw the specified Bilibili errors for unsupported or empty pages.

## 5. Pagination Loading Flow

- [x] 5.1 Implement or extend the page loading flow so Bilibili favlists advance through the bottom next-page control instead of relying only on generic scrolling.
- [x] 5.2 Keep current-page lazy rendering support by scrolling or waiting within each Bilibili page before extracting that page.
- [x] 5.3 Merge extracted items across pages using item ID or note URL as the dedupe key.
- [x] 5.4 Stop when no enabled next-page control remains, when the configured scan limit is reached, or when page navigation fails to change the rendered cards.

## 6. Registry Integration

- [x] 6.1 Import `bilibiliFavlistDomAdapter` in `scratches/collection-hub/extension/src/lib/dom-adapter-registry.ts`.
- [x] 6.2 Register the Bilibili adapter before `sampleDomAdapter` while preserving the existing XHS adapter behavior.
- [x] 6.3 Confirm the page import widget requires no Bilibili-specific UI changes beyond selecting the Bilibili-aware loading path.

## 7. Bilibili Widget Theme

- [x] 7.1 Confirm Bilibili-themed color tokens from the live page or stable Bilibili brand colors.
- [x] 7.2 Add tests or focused assertions that the page import widget uses Bilibili-themed accents and primary action colors when the extracted source is `bilibili`.
- [x] 7.3 Ensure existing widget controls, labels, destination choices, and import states remain unchanged.
- [x] 7.4 Verify active, disabled, success, warning, and error states remain visually distinguishable with the Bilibili theme.

## 8. Verification

- [x] 8.1 Run the Bilibili adapter test file.
- [x] 8.2 Run the Bilibili pagination-loading tests.
- [x] 8.3 Run the page import widget theme tests.
- [x] 8.4 Run `pnpm --filter @collection-hub/extension test`.
- [x] 8.5 Run `pnpm --filter @collection-hub/extension typecheck`.
