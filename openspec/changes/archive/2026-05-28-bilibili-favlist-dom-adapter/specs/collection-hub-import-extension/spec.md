## ADDED Requirements

### Requirement: Bilibili favlist extraction
The extension SHALL include a DOM adapter for rendered Bilibili favlist pages on `space.bilibili.com`.

#### Scenario: Bilibili favlist page is detected
- **WHEN** the browser is on a Bilibili space favlist URL such as `https://space.bilibili.com/5059047/favlist?fid=47314147`
- **THEN** the Bilibili favlist adapter can handle the document
- **AND** the adapter remains able to handle an observed rewritten Bilibili space URL with `fid` before favlist video cards finish rendering
- **AND** rewritten Bilibili space URLs without `fid` are handled when the page still exposes favlist video cards

#### Scenario: Non-favlist page is rejected
- **WHEN** the browser is not on a Bilibili favlist URL and does not expose rendered Bilibili favlist video cards
- **THEN** the Bilibili favlist adapter cannot handle the document

#### Scenario: Bilibili favlist cards are extracted
- **WHEN** the user triggers extraction on a matched Bilibili favlist page with importable video cards in the DOM
- **THEN** the adapter returns a collection draft with source `bilibili`
- **AND** the collection ID is `bilibili:favlist:<fid>` when the URL has a `fid` query parameter
- **AND** the collection ID falls back to `bilibili:favlist:<mid>` when `fid` is unavailable
- **AND** the collection title is the visible favlist title when available and otherwise `Bilibili 收藏夹`
- **AND** the collection source URL is the current page URL
- **AND** the collection cover URL is the first extracted video cover URL when available
- **AND** each extracted item ID is `bilibili:video:<BV id>`
- **AND** each extracted item note URL is `https://www.bilibili.com/video/<BV id>`
- **AND** each extracted item media type is `video`

#### Scenario: Bilibili card metadata is normalized
- **WHEN** a Bilibili favlist card contains a BV video link, title text, image, and author profile link
- **THEN** the adapter extracts the visible title or falls back to `Bilibili 视频 <BV id>`
- **AND** the adapter normalizes the cover image URL to an absolute HTTPS URL
- **AND** the adapter extracts author ID `bilibili:author:<mid>` when the author profile URL contains a space MID
- **AND** the adapter extracts the visible author name and normalized Bilibili space profile URL when available

#### Scenario: Duplicate and incomplete Bilibili cards are handled
- **WHEN** a card contains repeated links to the same BV video
- **THEN** the adapter includes that BV video only once in the extracted item list
- **AND** cards without a BV video link are ignored

#### Scenario: Bilibili favlist has no importable cards
- **WHEN** the adapter extracts a detected Bilibili favlist page and finds no importable video cards
- **THEN** extraction fails with `当前 Bilibili 收藏夹没有可导入的视频卡片`

#### Scenario: Bilibili extraction is requested on an unsupported page
- **WHEN** extraction is requested but the current URL cannot identify a Bilibili favlist or user space page
- **THEN** extraction fails with `当前页面不是 Bilibili 收藏夹`

#### Scenario: Bilibili adapter participates in existing import flow
- **WHEN** Bilibili favlist extraction succeeds
- **THEN** the existing page import widget can preview the source and item count
- **AND** the existing destination selection and local API import flow are reused without Bilibili-specific UI changes
- **AND** inline per-card import controls remain limited to XHS pages

#### Scenario: Bilibili page widget uses Bilibili-themed colors
- **WHEN** the page import widget is rendered on a Bilibili favlist page
- **THEN** the widget uses Bilibili-themed colors for its source-specific accents and primary actions
- **AND** the colors are based on the observed Bilibili page or stable Bilibili brand colors
- **AND** the initial launcher and pre-extraction panel use the Bilibili theme before an extracted draft is available
- **AND** existing controls, labels, import states, and destination choices remain unchanged
- **AND** active, disabled, success, warning, and error states remain visually distinguishable

#### Scenario: Bilibili favlist pagination is traversed
- **WHEN** the user triggers extraction on a Bilibili favlist page with additional pages available through the bottom next-page control
- **THEN** the extension selects the Bilibili pagination path before running the generic scrolling loader
- **AND** it advances through Bilibili favlist pages using the bottom pagination control
- **AND** it does not scroll page, sidebar, or left-navigation containers while waiting for Bilibili pagination updates
- **AND** it waits a Bilibili-specific pacing interval before each next-page click to reduce risk-control triggers from rapid pagination
- **AND** it honors the page's disabled or unavailable next-page state
- **AND** it waits for the rendered cards to update before extracting each new page
- **AND** it merges extracted items across pages
- **AND** it deduplicates repeated items by BV video ID
- **AND** it stops when no enabled next-page control remains or an explicitly configured scan limit is reached
- **AND** it does not stop at page 30 by default when additional enabled Bilibili pages remain

#### Scenario: Bilibili current page cards are lazy-rendered
- **WHEN** a Bilibili favlist page needs a short delay before current-page cards are rendered
- **THEN** the extension waits for current-page card anchors before extraction
- **AND** it does not use generic downward scrolling or generic scroll-container probing as the first Bilibili loading step or as the way to reach later favlist pages

#### Scenario: Bilibili adapter is registered before sample fallback
- **WHEN** the extension selects an adapter from the ordered registry
- **THEN** the Bilibili favlist adapter is tried before the sample DOM adapter

#### Scenario: Local development pages are not content-script targets
- **WHEN** Collection Hub web development pages run on localhost or loopback addresses
- **THEN** the extension content script is not injected into those local development pages
- **AND** extension development hot reloads do not refresh the Collection Hub frontend
- **AND** the content script manifest targets supported source sites instead of all URLs
