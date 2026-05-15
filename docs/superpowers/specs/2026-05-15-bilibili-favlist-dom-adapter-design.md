# Bilibili Favlist DOM Adapter Design

## Goal

Add Bilibili collection-page import support to the browser extension by reading the rendered favlist DOM in the user's browser tab. The feature should work from pages like `https://space.bilibili.com/5059047/favlist?fid=47314147` and reuse the existing Collection Hub import widget, scrolling loader, and local API import flow.

## Chosen Approach

Use a dedicated extension-side DOM adapter named `bilibiliFavlistDomAdapter`.

The adapter will not call Bilibili APIs directly. The user's browser page is the source of truth, so login state, private favlists, and Bilibili's page loading behavior remain handled by the user's normal browser session. This matches the existing XHS adapter pattern and keeps the first Bilibili implementation small and maintainable.

## Page Detection

The adapter handles pages whose host is `space.bilibili.com` and whose pathname matches `/<mid>/favlist`, with a `fid` query parameter when present. The page may also normalize from `/<mid>/favlist?fid=...` to `/<mid>?fid=...`, so detection should tolerate both the canonical favlist URL and the observed rewritten URL when the page still exposes favlist cards.

The adapter should return `false` from `canHandle` if no Bilibili favlist URL or rendered Bilibili video cards are present.

## Data Mapping

The extracted draft uses:

- `source`: `bilibili`
- collection id: `bilibili:favlist:<fid>` when `fid` exists, otherwise `bilibili:favlist:<mid>`
- collection title: visible favlist title when available, otherwise `Bilibili 收藏夹`
- collection source URL: current page URL
- collection cover URL: first extracted video cover when available
- item id: `bilibili:video:<BV id>`
- item title: visible video title from the card, falling back to `Bilibili 视频 <BV id>`
- item note URL: canonical `https://www.bilibili.com/video/<BV id>`
- item cover URL: card image URL when available, normalized to an absolute HTTPS URL
- item media type: `video`
- author id: `bilibili:author:<mid>` when an author profile link is found
- author name: visible card author name when available
- author profile URL: normalized Bilibili space URL

The adapter should deduplicate repeated links inside a card by BV id. If a card has no BV link, it is skipped.

## DOM Strategy

Prefer stable, broad selectors observed on the current Bilibili favlist page:

- cards: `.bili-video-card` and `.items__item`
- video links: `a[href*="/video/BV"]`
- author links: `a[href*="space.bilibili.com"]`
- images: descendant `img`

The implementation should avoid relying on hashed CSS module class names. It can use text cleanup and URL parsing helpers similar to the XHS adapter.

## Errors

If a Bilibili favlist page is detected but no importable video cards are found, extraction should throw `当前 Bilibili 收藏夹没有可导入的视频卡片`.

If the URL cannot identify a Bilibili favlist or user space page, extraction should throw `当前页面不是 Bilibili 收藏夹`.

## Integration

Register the new adapter before the sample adapter in `collectionDomAdapters`.

The existing page import widget and `extractCollectionWhileScrolling` flow should work without Bilibili-specific UI changes. Inline per-card import buttons remain XHS-only for this change.

## Testing

Add a Vitest spec for the Bilibili adapter before implementation:

- `canHandle` returns true for the provided favlist URL.
- extraction returns `source: "bilibili"`, the expected collection id, title, source URL, and cover URL.
- extraction maps cards to canonical video ids, titles, URLs, covers, media type `video`, and author records.
- cards without a BV video link are ignored.
- extraction throws the Bilibili empty-page error when the page has no importable cards.

Run the extension adapter tests, then the extension typecheck if available.
