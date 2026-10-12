## ADDED Requirements

### Requirement: Manual Music Release skill entry point
CthuCodex SHALL replace `notion-maintain-album` with `notion-manage-music-releases`, displayed under `Notion ·`, for manual-only management of the configured Music Release database.

#### Scenario: Invocation is explicit
- **WHEN** the plugin is installed
- **THEN** the new skill SHALL set `allow_implicit_invocation: false` and replace the old entry point
- **AND** ordinary music discussion or an uninvoked library request SHALL NOT activate it

### Requirement: Live Music Release schema boundaries
The skill SHALL inspect the live Music Release schema for the requested operation and verify People Vault when resolving Artist relations, without incidental schema or related-page mutations.

#### Scenario: Schema drifts
- **WHEN** a relevant field has changed type, name, or relation target
- **THEN** the skill SHALL report the mismatch and stop the affected write without recreating properties

#### Scenario: Schema is compatible
- **WHEN** a record is managed
- **THEN** the skill SHALL reuse live options and preserve database schema, views, and People Vault pages

### Requirement: Music Release CRUD operations
The skill SHALL support natural-language query, create, update, and reversible removal of Music Release records, including Album, Single, EP, Broadcast, and Other entries.

#### Scenario: Query is requested
- **WHEN** the user requests records or a metadata check
- **THEN** the skill SHALL return matching page links and disclose pagination or search limitations without writing

#### Scenario: A clear mutation is requested
- **WHEN** the target and intended changes are unambiguous
- **THEN** the skill SHALL act within that authorization without a mandatory second confirmation or fixed input syntax
- **AND** it SHALL clarify unresolved identity or destructive scope instead of guessing

#### Scenario: Removal is requested
- **WHEN** the user identifies records to remove
- **THEN** the skill SHALL use reversible trash or archive only if supported and verify the result
- **AND** if unsupported it SHALL report the limitation and provide manual removal links without permanent deletion

### Requirement: Music Release canonical metadata
The skill SHALL preserve MusicBrainz Release Group as the canonical identity and source for name, artist credit, earliest release date, and primary release type when enriching metadata.

#### Scenario: Concrete release is supplied
- **WHEN** the input identifies a regional edition, reissue, or concrete MusicBrainz Release
- **THEN** the skill SHALL resolve its owning Release Group and SHALL NOT substitute edition dates for the original release date

#### Scenario: Metadata is ambiguous or partial
- **WHEN** candidate identity remains ambiguous or the earliest date only has year or month precision
- **THEN** the skill SHALL clarify identity before affected writes and preserve the known date precision without inventing a month or day
- **AND** `Release Date` SHALL remain unmodified unless a full earliest date is verified

### Requirement: Music Release Discogs provenance and existing options
The skill SHALL use a confirmed Discogs Master for identity cross-checking and Genre provenance and SHALL NOT expand options during ordinary record management.

#### Scenario: Master matching supplies genre values
- **WHEN** MusicBrainz links a Discogs Master or a matching Master is found
- **THEN** the skill SHALL verify title, artist, and year, reuse existing normalized genre/style options, and report unavailable options
- **AND** it SHALL NOT use a concrete Discogs Release as a Master or replace MusicBrainz authority with streaming metadata

#### Scenario: Sources conflict
- **WHEN** artist, title identity, or dates conflict across sources
- **THEN** the skill SHALL disclose the conflict and clarify before writing affected metadata

### Requirement: Music Release artist identity preservation
The skill SHALL resolve every requested artist credit to existing People Vault pages, preferring canonical MusicBrainz Artist URLs.

#### Scenario: Artist match is unambiguous
- **WHEN** one matching Artist URL exists or a unique exact normalized name has no conflicting identifier
- **THEN** the skill SHALL use the verified page relation and preserve all resolved credits
- **AND** it SHALL NOT fill People Vault identifiers incidentally

#### Scenario: Artist identity conflicts
- **WHEN** a credit is missing, ambiguous, or has a different non-empty Artist URL
- **THEN** the skill SHALL report the unresolved credit and clarify the affected relation write without creating an Artist page

### Requirement: Music Release scoped authorization
The skill SHALL treat the user's clear instruction as authorization for the requested change, while preserving unrequested values, notes, and covers.

#### Scenario: Metadata completion is requested
- **WHEN** the user asks to fill missing metadata
- **THEN** the skill SHALL preserve non-empty values and report conflicting source values

#### Scenario: Explicit replacement or stale state
- **WHEN** the user explicitly requests a field replacement
- **THEN** the skill SHALL update that field after checking current state
- **AND** it SHALL clarify any intervening change that makes the intended update ambiguous

### Requirement: Music Release templates covers and write verification
The skill SHALL avoid duplicate canonical identities, create with the live template, repair the consistent icon where needed, and verify writes.

#### Scenario: Duplicate candidates exist
- **WHEN** creating a record
- **THEN** the skill SHALL check canonical Release Group and Master URLs and reconcile title/artist candidates
- **AND** it SHALL NOT infer absence from incomplete search results or blindly retry an uncertain creation

#### Scenario: Template or icon needs attention
- **WHEN** creating or updating a record
- **THEN** the skill SHALL use the template for creation and check template conventions on update without reapplying it destructively
- **AND** if template application fails it SHALL manually repair the live template's consistent icon without duplicating content or resetting personal fields

#### Scenario: Creation or mutation completes
- **WHEN** a write completes
- **THEN** the skill SHALL refetch the affected record and return its link and verification outcome
- **AND** on creation it SHALL return a verified cover image or direct image link for manual addition, or explicitly disclose that no usable image was found
- **AND** uncertain outcomes SHALL be reconciled before retrying

### Requirement: Music Release personal field handling
The skill SHALL preserve personal listening data during metadata enrichment and allow explicitly requested changes to writable personal fields.

#### Scenario: Personal listening fields are requested
- **WHEN** the user requests a Status, Listened Date, or Score change
- **THEN** the skill SHALL change only the requested fields using current schema options
- **AND** it SHALL never write the Rating formula or confuse Listened Date with Release Date

#### Scenario: Creation has no personal values
- **WHEN** a new record is created without explicit listening data
- **THEN** the skill SHALL retain template defaults and SHALL NOT infer a listening date or score

## REMOVED Requirements

### Requirement: Plugin-local Notion album skill
**Reason**: Implicit activation and the old name are replaced.
**Migration**: Use `notion-manage-music-releases` under the replacement "Manual Music Release skill entry point" requirement.

### Requirement: Album and People Vault schema contract
**Reason**: Historical schema migration is outside record CRUD.
**Migration**: Use `notion-manage-music-releases` under the replacement "Live Music Release schema boundaries" requirement.

### Requirement: Album input and operation resolution
**Reason**: Single-album metadata operations are replaced by general record management.
**Migration**: Use `notion-manage-music-releases` under the replacement "Music Release CRUD operations" requirement.

### Requirement: MusicBrainz Release Group resolution
**Reason**: Mandatory scored previews are replaced with optional enrichment and preserved identity safeguards.
**Migration**: Use `notion-manage-music-releases` under the replacement "Music Release canonical metadata" requirement.

### Requirement: Discogs Master matching and Genre option expansion
**Reason**: Automatic option expansion is retired.
**Migration**: Use `notion-manage-music-releases` under the replacement "Music Release Discogs provenance and existing options" requirement.

### Requirement: People Vault Artist relation resolution
**Reason**: Incidental People Vault identifier updates are retired.
**Migration**: Use `notion-manage-music-releases` under the replacement "Music Release artist identity preservation" requirement.

### Requirement: Read-only preview and conflict authorization
**Reason**: Mandatory repeated preview approval is replaced by clear-request authorization.
**Migration**: Use `notion-manage-music-releases` under the replacement "Music Release scoped authorization" requirement.

### Requirement: Idempotent Album write and verification
**Reason**: One-record preview gating is replaced with CRUD verification and template/icon/cover handling.
**Migration**: Use `notion-manage-music-releases` under the replacement "Music Release templates covers and write verification" requirement.

### Requirement: Personal listening data protection
**Reason**: Exclusion of explicitly requested personal-field edits is retired.
**Migration**: Use `notion-manage-music-releases` under the replacement "Music Release personal field handling" requirement.
