# codex-plugins-cthu-codex-notion-drama-library-skill Specification

## Purpose

Provide lightweight, manually invoked management of the personal Notion Drama Library while preserving series/season identity, personal viewing data, and template conventions.

## Requirements

### Requirement: Manual Drama Library management
The plugin SHALL provide `notion-manage`, displayed under `Notion ·`, with implicit invocation disabled and natural-language query, create, update, and reversible removal.

#### Scenario: Authorized operation
- **WHEN** the user explicitly invokes the skill with a clear target and requested change
- **THEN** the skill SHALL act within that authorization without fixed input syntax or mandatory repeated confirmation
- **AND** material ambiguity SHALL be clarified before affected writes

#### Scenario: No invocation
- **WHEN** the user discusses dramas without invoking this skill
- **THEN** the skill SHALL NOT activate implicitly

### Requirement: Live Drama Library schema and retrieval
The skill SHALL discover current schema, options, and template from the configured Drama Library and use the authorized Notion connector for private operations.

#### Scenario: Query
- **WHEN** records are requested
- **THEN** the skill SHALL apply requested filters through supported queries or scoped search, fetch relevant candidates, and return page links
- **AND** it SHALL parameterize SQL if used, paginate where possible, and disclose incomplete coverage or unavailable formulas
- **AND** ordinary retrieval SHALL remain read-only without external enrichment unless requested

#### Scenario: Schema or connector mismatch
- **WHEN** required fields, relation targets, or access are unavailable or incompatible
- **THEN** the skill SHALL report the limitation and stop affected writes without changing schema, views, or options

### Requirement: Drama identity and scoped metadata
The skill SHALL preserve the intended series, season, part, or special identity, evidenced canonical source URLs, and matching episode/date scope.

#### Scenario: Series and season share an identifier
- **WHEN** different records share a series-level IMDb or TMDB URL
- **THEN** the skill SHALL reconcile their season/part identity and SHALL NOT merge or treat them as duplicates solely by that URL
- **AND** unclear scope, remakes, adaptations, or conflicting identities SHALL be clarified

#### Scenario: Canonical source mapping
- **WHEN** metadata is written
- **THEN** IMDb SHALL contain an evidenced title URL, TMDB an evidenced TV URL, and Douban a verified Douban subject URL; the obsolete Reference property SHALL NOT be written
- **AND** movie/person URLs, invented identifiers, and cross-source scope assumptions SHALL NOT be used

#### Scenario: Episode and release metadata
- **WHEN** Episodes or Release Date are filled
- **THEN** the values SHALL match the selected series/season scope with evidence
- **AND** aired counts or announced counts SHALL NOT silently become a final total, nor SHALL Episodes represent personal watching progress
- **AND** partial dates SHALL NOT be padded and unresolved values SHALL remain unset or unchanged with limitations disclosed

#### Scenario: Classification
- **WHEN** Category or Genres are set
- **THEN** the skill SHALL use existing options with evidence or explicit user direction
- **AND** it SHALL NOT infer Category solely from title language or add options

### Requirement: Drama duplicates and scoped writes
The skill SHALL check identities and title/year/season candidates before creation and preserve unrequested values during updates.

#### Scenario: Duplicate creation prevention
- **WHEN** an exact-scope match exists or duplicate coverage is insufficient
- **THEN** the skill SHALL return the existing page or disclose the limitation without creating another record
- **AND** it SHALL recheck relevant state before writing and reconcile uncertain results before retrying

#### Scenario: Update
- **WHEN** a user requests field changes or metadata completion
- **THEN** the skill SHALL fetch the target and apply only authorized changes
- **AND** completion SHALL fill empty fields while preserving non-empty values, notes, covers, and unrelated relation credits
- **AND** intervening conflicts SHALL be clarified before affected writes

### Requirement: Drama people and personal fields
Director, Cast, and Writer are user-maintained. Routine creation and enrichment SHALL leave them unchanged and SHALL NOT schedule automatic backfill for missing credits. Only explicit requests for these fields SHALL resolve them to verified existing People Vault records. User control over viewing data SHALL be preserved.

#### Scenario: People relations
- **WHEN** a Director, Cast, or Writer relation is explicitly requested
- **THEN** the skill SHALL verify the live target and related identities, retain multiple credits, and clarify missing or ambiguous people
- **AND** it SHALL NOT create or modify People Vault pages incidentally

#### Scenario: Personal values and formulas
- **WHEN** records are created or updated
- **THEN** Status, Watched Date, Score, and Is in Library SHALL be written only as requested, retaining live template defaults otherwise on creation
- **AND** public ratings SHALL NOT become Score, release dates SHALL NOT become Watched Date, and Rating/In Library formulas SHALL remain read-only
- **AND** Research & Archive SHALL be treated as a status value, not a deletion command

### Requirement: Drama template poster and verification
The skill SHALL use the live default template on creation, maintain its consistent icon on creation/update, follow the shared Notion Management cover workflow, and verify mutations.

#### Scenario: Template and icon
- **WHEN** creating or updating a record
- **THEN** creation SHALL use the live template and updates SHALL preserve template conventions without resetting values or duplicating content
- **AND** pending application SHALL receive bounded verification; failures or missing icons SHALL be repaired with the verified template icon where supported
- **AND** unavailable template or repair capabilities SHALL be disclosed

#### Scenario: Poster and result
- **WHEN** a record is created
- **THEN** the skill SHALL follow the shared Notion Management cover workflow and report the verified cover result or the local file for manual setup, or disclose that no image could be obtained
- **AND** it SHALL NOT invent image URLs or replace uploaded covers

#### Scenario: Mutation verification
- **WHEN** a mutation completes
- **THEN** the skill SHALL refetch and verify relevant fields, icon, or removal state and return page links with unresolved details
- **AND** uncertain outcomes SHALL be reconciled before retry

### Requirement: Reversible drama removal
The skill SHALL remove only clearly identified records through connector-supported reversible trash or archive.

#### Scenario: Removal support
- **WHEN** removal is requested
- **THEN** the skill SHALL verify targets and the reversible result
- **AND** unsupported removal SHALL be reported with manual page links, without permanent deletion or merely changing Status to Research & Archive

### Requirement: Metadata source selection
The skill SHALL follow this source policy: Use metadata sources in order: TMDB TV, then IMDb, then Douban. Fall back when the higher-priority source is unavailable or lacks the requested field. Match the same series/season/part across sources and disclose material conflicts. A fallback source URL must not be written into another catalog's URL property.

#### Scenario: Metadata enrichment
- **WHEN** creating an entry or completing its factual metadata
- **THEN** the skill SHALL select sources according to this policy and verify the requested identity and scope before writing
- **AND** it SHALL disclose unavailable evidence instead of inventing values or identifiers

### Requirement: One record and TMDB poster per season
Multi-season dramas SHALL use one record per season, named with the verified original series title plus Season N. Season Number SHALL hold the verified integer season number and remain unset for whole-series records or unknown seasons. A separate Series Name field SHALL NOT be required. Each record SHALL hold that season's episode count, premiere date, status, and score. A whole-series creation request SHALL resolve to verified regular seasons; explicit season requests SHALL remain scoped to those seasons. Specials SHALL require a request. Existing whole-series records SHALL NOT be split or migrated incidentally.

#### Scenario: Create multiple seasons
- **WHEN** a multi-season drama is added
- **THEN** the skill SHALL check each requested season for duplicates and use its matching TMDB TV season poster, verified by series identity and season number
- **AND** it SHALL clarify overlap with an existing whole-series record rather than duplicate coverage

#### Scenario: Missing season poster
- **WHEN** the matching TMDB TV season poster is unavailable
- **THEN** the skill SHALL disclose the gap without substituting a series poster, another season, IMDb, or Douban artwork automatically
