## ADDED Requirements

### Requirement: Organizer dashboard
The web app SHALL provide an organizer dashboard for imported collection data and item triage.

#### Scenario: Dashboard loads with data
- **WHEN** dashboard data is available from the API
- **THEN** the page displays a left navigation group for source `xhs`
- **AND** the `xhs` group contains pending download, downloaded, not download, and authors entries
- **AND** the right side displays a list for the selected navigation entry

#### Scenario: Reserved source groups are shown
- **WHEN** dashboard data is available before Bilibili or Instagram adapters exist
- **THEN** the left navigation still reserves Bilibili and INS source groups
- **AND** their fixed collection and author entries show zero counts until matching data exists

#### Scenario: Fixed source collections are displayed
- **WHEN** the API returns fixed destination collections for a source such as `xhs`
- **THEN** the dashboard displays the source's pending download, downloaded, and not download collections in the left navigation
- **AND** it does not present source-site boards as separate organizer collections

#### Scenario: Collection navigation item selected
- **WHEN** the user selects one of the three fixed collection entries
- **THEN** the right side displays items belonging to that fixed collection and selected rating filter
- **AND** each item row includes source platform and media type when available
- **AND** each item row includes item rating controls

#### Scenario: Authors navigation item selected
- **WHEN** the user selects the authors entry
- **THEN** the right side displays author records for the selected source sorted by imported note count
- **AND** each author row includes avatar when available
- **AND** selecting an author shows that author's imported notes grouped by destination status
- **AND** the author detail can link to the author profile URL when available

#### Scenario: Summary widgets are omitted
- **WHEN** the dashboard loads with data
- **THEN** it does not show top metric cards
- **AND** it does not show a separate recent import section

#### Scenario: Dashboard supports item triage
- **WHEN** a user views imported item cards
- **THEN** the dashboard exposes controls to delete an item, move it to another fixed destination status, and assign S/A/B rating
- **AND** the dashboard refreshes API data after successful mutations

### Requirement: API connection state
The dashboard SHALL show whether the local API is reachable.

#### Scenario: API is reachable
- **WHEN** the dashboard successfully retrieves API data
- **THEN** it displays a connected state

#### Scenario: API is unavailable
- **WHEN** the dashboard cannot retrieve API data
- **THEN** it displays an API error state

### Requirement: Empty and loading states
The dashboard SHALL provide loading and empty-store states.

#### Scenario: Data is loading
- **WHEN** the dashboard request is in progress
- **THEN** the page displays a loading state

#### Scenario: Store is empty
- **WHEN** the API returns no imported collections or items
- **THEN** the page displays an empty state explaining that no imports have been captured

### Requirement: Status navigation
The dashboard SHALL allow users to select a fixed destination collection from the left navigation.

#### Scenario: Pending download filter selected
- **WHEN** the user selects the pending download navigation entry
- **THEN** the dashboard displays only items with status `pending_download`

#### Scenario: Downloaded filter selected
- **WHEN** the user selects the downloaded navigation entry
- **THEN** the dashboard displays only items with status `downloaded`

#### Scenario: Not downloaded filter selected
- **WHEN** the user selects the not download navigation entry
- **THEN** the dashboard displays only items with status `not_downloaded`

### Requirement: Rating navigation
The dashboard SHALL allow users to filter each fixed destination collection by rating.

#### Scenario: Unrated filter selected
- **WHEN** the user selects the unrated filter for a destination collection
- **THEN** the dashboard displays only items in that collection without a rating

#### Scenario: S rating filter selected
- **WHEN** the user selects the S rating filter for a destination collection
- **THEN** the dashboard displays only items in that collection with rating `S`

#### Scenario: Rating counts are shown
- **WHEN** a destination collection has rated and unrated items
- **THEN** the navigation entry exposes counts for S, A, B, and unrated filters

### Requirement: Item mutation controls
The dashboard SHALL call local API mutation endpoints for item triage controls.

#### Scenario: User deletes an item
- **WHEN** the user confirms deletion for an item
- **THEN** the dashboard calls `DELETE /api/dashboard/items/:itemId`
- **AND** the item is removed from the current list after refresh

#### Scenario: User moves an item
- **WHEN** the user selects another destination status for an item
- **THEN** the dashboard calls `POST /api/dashboard/items/:itemId/move` with the target status
- **AND** the item moves to the target status collection after refresh

#### Scenario: User rates an item
- **WHEN** the user selects rating `S`, `A`, or `B` for an item
- **THEN** the dashboard calls `POST /api/dashboard/items/:itemId/rating`
- **AND** the selected rating is reflected after refresh
