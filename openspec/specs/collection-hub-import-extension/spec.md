# collection-hub-import-extension Specification

## Purpose
Define the Collection Hub browser extension behavior for matching source pages, extracting collection items, and submitting imports to the local API.

## Requirements
### Requirement: Configurable page activation
The extension SHALL activate collection extraction only on pages matching user-configured match patterns.

#### Scenario: Page matches configured pattern
- **WHEN** the browser is on a URL that matches the extension's configured patterns
- **THEN** the extension injects or exposes the page-integrated collection import control for that page
- **AND** default settings allow all URLs until the user narrows match patterns in extension storage

#### Scenario: Page does not match configured pattern
- **WHEN** the browser is on a URL that does not match the configured patterns
- **THEN** the extension does not attempt collection extraction for that page

### Requirement: DOM adapter extraction boundary
The extension SHALL extract collection data through a DOM adapter boundary that can decide whether it can handle the page and return a collection draft.

#### Scenario: Adapter handles page
- **WHEN** the user triggers extraction on a matched page and an adapter can handle the current document
- **THEN** the extension receives a collection draft containing collection metadata and item drafts

#### Scenario: Adapter cannot extract data
- **WHEN** extraction is triggered but no adapter can produce a valid collection draft
- **THEN** the extension displays an extraction error and does not submit an import payload

### Requirement: Extensible adapter registry
The extension SHALL select page extractors through an ordered adapter registry.

#### Scenario: Multiple adapters are available
- **WHEN** extraction is triggered on a matched page
- **THEN** the extension tries registered adapters in order
- **AND** it uses the first adapter whose `canHandle()` method accepts the current document

#### Scenario: Future source adapters are added
- **WHEN** a new source such as Bilibili or Instagram is supported later
- **THEN** it can be added as a new DOM adapter without changing on-page destination selection, API submission, or retry behavior

### Requirement: Page-integrated import control
The extension SHALL provide the primary import workflow through a control injected into matched source pages.

#### Scenario: Supported page control is shown
- **WHEN** the current page matches activation patterns and a DOM adapter can handle the document
- **THEN** the extension shows an on-page import control without requiring the popup

#### Scenario: Extracted data is previewed in the page
- **WHEN** the user triggers extraction from the page control
- **THEN** the control displays the detected source platform and loaded item count
- **AND** it shows the three destination collection choices for that source

#### Scenario: Page control scans lazy-loaded content
- **WHEN** the user triggers extraction from the page control
- **THEN** the extension scrolls the page or scrollable containers to collect lazy-loaded cards
- **AND** it deduplicates extracted items by item ID or note URL
- **AND** it reports discovered item count and scan progress while scanning
- **AND** it stops when the page stops growing or the configured scan limit is reached

#### Scenario: Extension has no popup workflow
- **WHEN** the extension is packaged
- **THEN** it does not declare an extension popup page
- **AND** the import workflow remains available directly on the page

### Requirement: Toolbar icon opens configuration
The extension SHALL route toolbar icon clicks directly to the configuration/options page.

#### Scenario: User clicks the extension icon
- **WHEN** the user clicks the extension toolbar icon
- **THEN** the extension opens the configuration/options page directly
- **AND** it does not show a popup first

#### Scenario: Configuration page is placeholder
- **WHEN** the configuration/options page opens in this change
- **THEN** it may render a blank or placeholder configuration surface
- **AND** default API base URL and match-pattern settings remain available to the extension runtime

### Requirement: XHS board extraction
The extension SHALL include an adapter for loaded XHS board pages at `xiaohongshu.com/board/<boardId>`.

#### Scenario: XHS board page contains loaded note cards
- **WHEN** the user triggers extraction on a matched XHS board page with `.note-item` cards loaded in the DOM
- **THEN** the adapter returns a collection draft with source `xhs`
- **AND** the collection ID is `xhs:board:<boardId>`
- **AND** each item ID is `xhs:note:<noteId>` derived from the board note link
- **AND** each item includes an absolute note URL, title, cover URL when present, and media type
- **AND** each author includes ID `xhs:author:<authorId>`, display name, absolute profile URL, and avatar URL when present

#### Scenario: XHS card has no author identity
- **WHEN** a `.note-item` has no author ID, name, avatar, or profile URL
- **THEN** the extracted item remains valid without an author draft

#### Scenario: XHS board page has video cards
- **WHEN** a `.note-item` contains a play marker such as `.play-icon`
- **THEN** the adapter marks that item media type as `video`

#### Scenario: XHS board page has image cards
- **WHEN** a `.note-item` does not contain a play marker
- **THEN** the adapter marks that item media type as `image`

#### Scenario: XHS board is only partially loaded before scanning
- **WHEN** only a subset of board cards is present in the DOM before extraction
- **THEN** the page control attempts to scroll and merge additional cards before batch submission
- **AND** the adapter imports the cards that are available to the DOM by the end of scanning

### Requirement: XHS inline card import
The extension SHALL render per-card import controls on XHS board cards after the page widget is mounted.

#### Scenario: Inline import controls are rendered
- **WHEN** XHS `.note-item` cards are present on a supported page
- **THEN** each card receives an inline import menu anchored near its cover image
- **AND** the menu offers pending download, downloaded, and not download actions

#### Scenario: User imports one card
- **WHEN** the user chooses a destination from an inline card import menu
- **THEN** the extension extracts only that card into a single-item import request
- **AND** it asks for confirmation before submitting
- **AND** it submits the request to the configured API base URL after confirmation

### Requirement: Destination collection selection
The extension SHALL require the user to choose one of the source platform's three fixed destination collections before submission.

#### Scenario: User selects pending download collection
- **WHEN** extracted items are ready and the user chooses the `pending_download` destination collection
- **THEN** the extension submits all items in the batch with status `pending_download`
- **AND** the server can derive the destination collection for the current source from that status

#### Scenario: User selects downloaded collection
- **WHEN** extracted items are ready and the user chooses the `downloaded` destination collection
- **THEN** the extension submits all items in the batch with status `downloaded`
- **AND** the server can derive the destination collection for the current source from that status

#### Scenario: User selects not download collection
- **WHEN** extracted items are ready and the user chooses the `not_downloaded` destination collection
- **THEN** the extension submits all items in the batch with status `not_downloaded`
- **AND** the server can derive the destination collection for the current source from that status

### Requirement: Explicit import submission
The extension SHALL submit extracted data only after explicit user action.

#### Scenario: User confirms import
- **WHEN** extraction has completed and the user confirms submission
- **THEN** the extension sends the import payload to the configured API base URL
- **AND** large payloads are split into batches with progress displayed for the current batch

#### Scenario: User does not confirm import
- **WHEN** extraction has completed and the user closes or cancels the flow
- **THEN** the extension does not send the import payload

### Requirement: Visible submit result and retry
The extension SHALL show success, failure, and retry states after import submission.

#### Scenario: Import succeeds
- **WHEN** the API accepts an import payload
- **THEN** the extension displays the returned import summary

#### Scenario: Import fails
- **WHEN** the API request fails or returns an error
- **THEN** the extension keeps the extracted payload available
- **AND** it offers a retry action using the same payload and selected status

### Requirement: Page-side delete action
The extension SHALL support deleting the currently extracted item IDs from the selected destination collection.

#### Scenario: User deletes extracted items from selected status
- **WHEN** extracted items include stable item IDs and the user confirms the delete action
- **THEN** the extension sends a source/status-scoped delete request to `/api/dashboard/items/bulk-delete`
- **AND** the request contains only unique extracted item IDs

#### Scenario: Delete result is shown
- **WHEN** the API accepts the delete request
- **THEN** the extension displays deleted and skipped item counts

#### Scenario: Extracted items have no stable IDs
- **WHEN** the user tries to delete after extraction but no extracted items have IDs
- **THEN** the extension displays an error and does not submit a delete request

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
