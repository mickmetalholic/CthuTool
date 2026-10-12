# codex-plugins-cthu-codex-notion-knowledge-skill Specification

## Purpose

Provide lightweight, manually invoked Knowledge Vault management while preserving resource identity, user-authored content, learning status, and type-specific template conventions.

## Requirements

### Requirement: Manual Knowledge Vault CRUD
The plugin SHALL provide `notion-manage` under `Notion ·`, with implicit invocation disabled, for natural-language query, create, scoped update, and reversible removal.

#### Scenario: Invocation and authorization
- **WHEN** explicitly invoked with a clear target and intended change
- **THEN** the skill SHALL perform the authorized operation without fixed syntax or mandatory repeated confirmation
- **AND** material ambiguity SHALL be clarified before affected writes
- **AND** ordinary knowledge discussion SHALL NOT implicitly activate this skill

### Requirement: Live schema and retrieval
The skill SHALL discover current fields, options, relation targets, and templates from the configured Knowledge Vault through the authorized Notion connector.

#### Scenario: Query coverage
- **WHEN** records are requested
- **THEN** the skill SHALL apply requested filters through supported queries or scoped search, parameterize SQL if used, fetch needed pages, and return Notion links
- **AND** pagination, truncated bodies, inaccessible records, and unavailable formula results SHALL be disclosed
- **AND** retrieval SHALL be read-only without external enrichment unless requested

#### Scenario: Property mapping
- **WHEN** mapping values
- **THEN** the skill SHALL distinguish source URL from the Notion page URL and writable Type(Manual) from read-only formula Type
- **AND** it SHALL reuse existing Source/Category/type/status options and preserve category add/remove/replace semantics
- **AND** incompatible schema or access SHALL stop affected writes without modifying schemas, formulas, options, or views

### Requirement: Resource identity and scoped content
The skill SHALL reconcile canonical resource identity and preserve user content outside requested changes.

#### Scenario: Duplicate checks
- **WHEN** adding a resource
- **THEN** the skill SHALL compare source URL and stable identity while preserving meaningful version, lesson, section, and edition distinctions
- **AND** title-only matches SHALL remain candidates, while URL-less notes SHALL be allowed without invented URLs
- **AND** exact duplicates SHALL return existing links; insufficient duplicate coverage SHALL stop creation

#### Scenario: Metadata or body update
- **WHEN** updating a record
- **THEN** the skill SHALL fetch relevant current properties and body, change only requested fields or sections, and preserve other notes, embeds, files, covers, and relations
- **AND** metadata completion SHALL fill missing values without inventing personal insights or automatically summarizing source material into the body
- **AND** requested summaries SHALL cite sources and distinguish them from personal notes, without presenting inaccessible source content as read
- **AND** partial body reads SHALL NOT authorize wholesale replacement

### Requirement: Knowledge classification and relations
The skill SHALL use evidenced or user-specified classification and verified existing related records without inferring personal learning progress.

#### Scenario: Classification and status
- **WHEN** setting Category, Source, or Type(Manual)
- **THEN** valid supplied values SHALL be respected and ambiguous choices clarified using existing options
- **AND** delegated classification SHALL use available evidence, not arbitrary new taxonomy
- **AND** Status SHALL follow the user's request or live template default, not inferred completion

#### Scenario: Related records
- **WHEN** App, Magazine, or Podcast links are requested
- **THEN** the skill SHALL verify live relation targets and existing identities, preserve unrequested memberships, and clarify missing or ambiguous records
- **AND** it SHALL NOT create or modify related pages to force Type or other derived behavior

### Requirement: Type-specific templates and icons
The skill SHALL choose templates by verified type defaults and maintain corresponding icons without destructive reapplication.

#### Scenario: Template selection or failure
- **WHEN** a record is created or updated
- **THEN** creation SHALL use a matching live template, while updates preserve existing content and check the intended type's icon convention
- **AND** pending application SHALL receive bounded verification and failed application or missing icons SHALL receive manual verified-icon repair where supported
- **AND** absent or ambiguous type templates SHALL be reported rather than replaced with an unrelated type's template or guessed icon

### Requirement: Reversible removal and verified results
The skill SHALL distinguish learning-status archival from reversible page removal, verify mutations, and reconcile uncertain outcomes before retrying.

#### Scenario: Status versus trash
- **WHEN** archive intent is ambiguous between Status Archived and page removal
- **THEN** the skill SHALL clarify the intended operation
- **AND** explicit removal SHALL use supported reversible trash/archive or report unavailable support with manual links, never permanent deletion or clearing content

#### Scenario: Reliable result
- **WHEN** writing changes
- **THEN** the skill SHALL recheck relevant state, clarify intervening conflicts, and refetch afterward to verify properties, requested body edits, icon, or removal state
- **AND** it SHALL return page links and incomplete verification details and inspect current state before retrying uncertain operations

### Requirement: Supported creation types
New knowledge records SHALL use only Course, Paper, Resource, Project, Article, or Notes. Live schema discovery MUST NOT expand this supported creation list.

#### Scenario: Additional live option
- **WHEN** the live schema exposes another type option
- **THEN** the skill does not create that type or substitute a different type without clarified user intent
