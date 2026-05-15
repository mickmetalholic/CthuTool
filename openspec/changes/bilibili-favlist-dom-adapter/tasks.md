## 1. Adapter Test Coverage

- [x] 1.1 Add `scratches/collection-hub/extension/src/lib/bilibili-favlist-dom-adapter.spec.ts` with fake DOM helpers matching the existing XHS adapter test style.
- [x] 1.2 Cover `canHandle()` returning true for `https://space.bilibili.com/5059047/favlist?fid=47314147`.
- [x] 1.3 Cover extraction of source `bilibili`, collection ID, title, source URL, collection cover URL, canonical BV item IDs, titles, video URLs, covers, media type `video`, and author records.
- [x] 1.4 Cover skipped cards without BV video links and deduplication of repeated BV links in one card.
- [x] 1.5 Cover the empty-page error `当前 Bilibili 收藏夹没有可导入的视频卡片`.

## 2. Bilibili DOM Adapter

- [x] 2.1 Add `scratches/collection-hub/extension/src/lib/bilibili-favlist-dom-adapter.ts` exporting `bilibiliFavlistDomAdapter`.
- [x] 2.2 Implement page detection for canonical favlist URLs and observed rewritten space URLs that still expose Bilibili video cards.
- [x] 2.3 Implement collection metadata mapping with `bilibili:favlist:<fid>` and `bilibili:favlist:<mid>` fallback IDs.
- [x] 2.4 Implement card extraction using broad selectors for Bilibili cards, BV video links, author links, and images.
- [x] 2.5 Normalize Bilibili video URLs, profile URLs, and image URLs to absolute HTTPS URLs.
- [x] 2.6 Skip cards without BV IDs and throw the specified Bilibili errors for unsupported or empty pages.

## 3. Registry Integration

- [x] 3.1 Import `bilibiliFavlistDomAdapter` in `scratches/collection-hub/extension/src/lib/dom-adapter-registry.ts`.
- [x] 3.2 Register the Bilibili adapter before `sampleDomAdapter` while preserving the existing XHS adapter behavior.
- [x] 3.3 Confirm the page import widget and `extractCollectionWhileScrolling` require no Bilibili-specific UI changes.

## 4. Verification

- [x] 4.1 Run `pnpm --filter @collection-hub/extension test -- src/lib/bilibili-favlist-dom-adapter.spec.ts`.
- [x] 4.2 Run `pnpm --filter @collection-hub/extension test`.
- [x] 4.3 Run `pnpm --filter @collection-hub/extension typecheck`.
