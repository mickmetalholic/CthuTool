# codex-plugins-cthu-codex-notion-game-library-skill Specification

## Purpose

Provide lightweight, manually invoked Video Game Library management while preserving game identity, personal ownership/play history, and template conventions.

## Requirements

### Requirement: Manual game library CRUD
The plugin SHALL provide `notion-manage` under `Notion ·`, with implicit invocation disabled, for natural-language query, create, update, and reversible removal.

#### Scenario: Invocation and authorization
- **WHEN** explicitly invoked with a clear target and intended change
- **THEN** the skill SHALL perform that authorized operation without fixed input syntax or mandatory repeated confirmation
- **AND** material identity or scope ambiguity SHALL be clarified before affected writes
- **AND** the skill SHALL NOT activate implicitly for ordinary game discussion

### Requirement: Live schema and bounded retrieval
The skill SHALL fetch the configured database and current schema, options, relation targets, and template, using authorized Notion tools for private data.

#### Scenario: Query or unavailable state
- **WHEN** records are requested
- **THEN** the skill SHALL use supported queries or scoped search with requested predicates, parameterize SQL if used, and return page links
- **AND** it SHALL paginate where possible and disclose partial coverage or unavailable derived values
- **AND** retrieval SHALL remain read-only without public enrichment unless requested
- **AND** incompatible schema or missing access SHALL stop affected writes without changing schemas, views, options, or related databases

### Requirement: Game identity and metadata
The skill SHALL reconcile canonical IGDB evidence, title, release context, and intended game/edition scope before metadata writes or deduplication.

#### Scenario: Similar games and editions
- **WHEN** base games, DLC, expansions, remakes, remasters, bundles, ports, or editions could match
- **THEN** the skill SHALL distinguish their identity and clarify unresolved scope rather than merge by title or shared broad identifiers
- **AND** a second owned platform SHALL NOT automatically cause creation of a duplicate game

#### Scenario: Release and source evidence
- **WHEN** filling IGDB, Genres, Release Date, Developer, or Series
- **THEN** values SHALL be evidenced and scoped to the selected game, with existing Genres options reused
- **AND** developer SHALL NOT be silently replaced with publisher, series with bundle, or original release with a later port date
- **AND** uncertain release context and partial dates SHALL be disclosed without invented date components or URLs

### Requirement: Ownership relations and personal play data
The skill SHALL resolve existing Developer, Series, and Owned On targets and preserve user control over ownership, purchase, score, and play history.

#### Scenario: Owned platform versus availability
- **WHEN** a public source lists platforms or compatibility
- **THEN** the skill SHALL NOT infer Owned On from that information
- **AND** explicit ownership changes SHALL resolve verified existing related pages and preserve other owned platforms unless removal was requested
- **AND** missing or ambiguous related identities SHALL be clarified without creating or modifying related pages incidentally

#### Scenario: Personal and derived fields
- **WHEN** personal fields are written
- **THEN** Status, Score, Playtime (h), Purchase Price, Last Played At, and Finished At SHALL come only from user instructions, with live defaults retained otherwise at creation
- **AND** playtime SHALL use hours and price SHALL respect the live currency format, clarifying unspecified units or currency when material
- **AND** public ratings, completion estimates, and store prices SHALL NOT become personal values
- **AND** Played SHALL NOT alone imply a completion date
- **AND** Rating, Playable On, and Emulators SHALL remain read-only, without indirect related-page edits to force their results

### Requirement: Scoped idempotent game mutations
The skill SHALL prevent duplicate creation, preserve unrequested values, and reconcile uncertain results before retries.

#### Scenario: Create or update
- **WHEN** creating or updating a game
- **THEN** the skill SHALL recheck relevant state, identity, and duplicates before writing
- **AND** exact matches SHALL return existing links instead of duplicate records, while insufficient duplicate coverage SHALL stop creation
- **AND** updates SHALL modify only authorized fields; completion SHALL fill empty fields while preserving existing notes, covers, and unrelated values
- **AND** intervening conflicts SHALL be clarified

### Requirement: Game templates covers and verification
The skill SHALL use the live template, maintain its consistent icon, follow the shared Notion Management cover workflow, and verify mutations.

#### Scenario: Template conventions
- **WHEN** a game is created or updated
- **THEN** creation SHALL use the live template and updates SHALL check conventions without resetting properties or duplicating content
- **AND** pending application SHALL receive bounded refetches; failure or missing icons SHALL trigger manual repair using the verified template icon where supported
- **AND** unavailable templates or repairs SHALL be disclosed

#### Scenario: Cover and mutation results
- **WHEN** creation completes
- **THEN** the skill SHALL follow the shared Notion Management cover workflow and report the verified cover result or the local file for manual setup, or disclose that no image could be obtained
- **AND** it SHALL NOT invent image URLs or replace uploaded covers
- **AND** all mutations SHALL be refetched to verify relevant fields, icon, or removal state, returning links and unresolved details
- **AND** uncertain outcomes SHALL be reconciled before retrying

### Requirement: Reversible game removal
The skill SHALL limit deletion to clearly identified records and connector-supported reversible trash or archive.

#### Scenario: Removal capability
- **WHEN** removal is requested
- **THEN** the skill SHALL verify targets and the reversible result, or explain unavailable support with manual links
- **AND** it SHALL NOT use permanent deletion or confuse removing an Owned On relation with deleting the game

### Requirement: Metadata source selection
The skill SHALL follow this source policy: Use IGDB for as much factual metadata as possible, including title, genre, release date, developer, and series. Use other verified sources only for unavailable IGDB records or fields, identify the fallback source, and preserve the intended game and edition scope. Do not replace available verified IGDB data merely for convenience.

#### Scenario: Metadata enrichment
- **WHEN** creating an entry or completing its factual metadata
- **THEN** the skill SHALL select sources according to this policy and verify the requested identity and scope before writing
- **AND** it SHALL disclose unavailable evidence instead of inventing values or identifiers

#### Scenario: IGDB retrieval fallback
- **WHEN** ordinary web reading or direct HTTP retrieval fails or omits needed metadata or cover information
- **THEN** the skill SHALL try the matching IGDB page in the in-app browser before switching sources, reading rendered evidence and the actual cover URL through supported browser tools
- **AND** unavailable or blocked browser access SHALL be reported before following existing source and cover fallbacks, with login or verification handled under normal browser handoff requirements

### Requirement: Owned access rollups
The game reference SHALL expose an on-demand reference for Access, Device, Emulator, Developer, and Series schemas. Playable On SHALL retain its meaning as devices available through Owned On → Access → Device, rather than all supported platforms.

#### Scenario: Inspect playable devices
- **WHEN** resolving the user's playable devices for a game
- **THEN** follow existing owned access relations and leave rollup definitions and related records unchanged
