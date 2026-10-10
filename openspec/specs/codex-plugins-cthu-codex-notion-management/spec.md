# Notion Management Specification

## Purpose

Provide one explicitly invoked entry point that loads only the library-specific guidance needed for personal Notion management requests.

## Requirements

### Requirement: Single manual entry point
The plugin SHALL expose only `notion-manage` for these eleven library management workflows, with implicit invocation disabled, replacing the separate `notion-manage-*` entries.

#### Scenario: Explicit invocation
- **WHEN** the user invokes `$notion-manage` with a clear library request
- **THEN** the shared CRUD rules and that library's guidance govern the operation without a mandatory second confirmation

### Requirement: Selective library reference loading
The skill SHALL keep an index and common rules in its entry point and load only relevant library references. It SHALL clarify ambiguous destinations and SHALL NOT treat a related database as independently authorized for management.

#### Scenario: Music work matching
- **WHEN** a Music Release request needs Works matching
- **THEN** the skill additionally loads Classical Work guidance without gaining permission to create or edit works

#### Scenario: Ordinary book query
- **WHEN** a user asks for books
- **THEN** only the book reference is needed, with no music resolver or unrelated library references loaded

### Requirement: Preserve existing behavior and portable helper
The unified skill SHALL preserve library identity, personal-field, relation, template/icon, and image-output requirements. The optional music resolver SHALL remain usable from the installed skill directory without a repository-specific path.

#### Scenario: Installed music helper
- **WHEN** music enrichment uses a copied plugin installation
- **THEN** its resolver and linked notes remain available within the unified skill

### Requirement: Explicit template application and verification
Creation SHALL explicitly apply the selected live template using the connector's template parameter, without conflicting body content. The skill MUST distinguish background creation success, template application, and icon repair, and MUST NOT silently treat copying an icon as successful template application.

#### Scenario: Asynchronous template
- **WHEN** background creation reports success
- **THEN** the skill refetches to verify template defaults and icon before dependent edits, allowing blank template bodies and requested property overrides

#### Scenario: Missing or unsupported template
- **WHEN** a matching template is absent or cannot be applied
- **THEN** the skill discloses the gap and clarifies before affected creation unless the library explicitly allows a no-template exception

#### Scenario: Recovery after creation
- **WHEN** an existing newly created page has unresolved template application
- **THEN** the skill inspects that page, preserves content, reports icon repair separately, and does not recreate it

### Requirement: Cover source and delivery workflow
For new media entries and requested cover completion or replacement, the skill SHALL use verified direct image links from Goodreads for English books, TMDB Movie then IMDb for movies, TMDB TV matching season posters for multi-season dramas and TMDB TV then IMDb for other dramas, IGDB where possible for games, and IMDb for documentaries and animation. Missing TMDB posters for multi-season dramas SHALL be reported without automatic substitution. Other cases SHALL use matching Douban cover files, including Chinese books, comics, music releases, and unavailable direct-link covers. Existing covers SHALL be preserved unless replacement is requested. Knowledge, channels, apps, and people/organizations SHALL have no cover requirement.

#### Scenario: Direct-link cover
- **WHEN** a matching image from an applicable direct-link source is available
- **THEN** the skill SHALL set the page cover using that image URL and refetch to verify the result, preserving the template icon

#### Scenario: Douban file upload
- **WHEN** a verified Douban image is downloaded and native Notion API access is available through NOTION_TOKEN
- **THEN** the skill SHALL upload the file, assign the uploaded file ID as the page cover, and verify the cover independently of upload success
- **AND** it SHALL keep credentials out of source files, command arguments, and logs, without extracting MCP credentials

#### Scenario: API or token unavailable
- **WHEN** native API access is unavailable, the token is missing, or upload or cover assignment fails
- **THEN** the skill SHALL retain the verified downloaded image under ~/downloads and return its absolute path and the Notion page link for manual setup without blocking successful record creation
- **AND** if image download failed, it SHALL report the failure without claiming a local file exists

### Requirement: Original names for entry titles
When creating entries or setting their names, the skill SHALL use verified original-language names in their original script rather than translated or localized titles. Books SHALL instead use the selected edition's published title, including the Chinese title for a Chinese translation and the English title for an English edition. Translated names and aliases SHALL remain usable for search and identity matching. Official or self-used names SHALL apply to channels, apps, people, and organizations; personal notes SHALL retain user-supplied titles. This rule SHALL NOT authorize renaming records during unrelated updates or merging distinct editions or seasons.

#### Scenario: Translated title supplied
- **WHEN** a user supplies a translated title to create a non-book work entry
- **THEN** the skill SHALL resolve the matching work and write its verified original title while preserving the intended edition or season and library source priorities
- **AND** it SHALL clarify an unverified original name rather than guess or invent a transliteration

#### Scenario: Existing translated title during an unrelated update
- **WHEN** the user updates only a personal score or status
- **THEN** the skill SHALL preserve the existing name without performing an incidental rename

### Requirement: Shared maintenance rules
The entry point SHALL own common CRUD, live-schema, naming, personal-field, note-body, date-precision, relation-preservation, and write-verification rules. Template application and icon recovery SHALL be maintained in one shared reference loaded for creation or updates. Library references SHALL retain their distinct sources, identity scope, schema hints, template selection, icons, and related-record permissions rather than repeat the common workflow.

#### Scenario: Library creation or update
- **WHEN** the skill creates or updates an entry in any library
- **THEN** it SHALL load the shared template workflow and the selected library's applicable conventions
- **AND** App website icons, type/platform-specific templates, seasonal TMDB covers, and library-specific relation permissions SHALL remain intact

#### Scenario: Read-only lookup
- **WHEN** the user requests only a query
- **THEN** the skill SHALL not require loading template or cover mutation workflows

### Requirement: Portable cover upload helper
The skill SHALL provide a dependency-free Node helper accepting page ID, verified image URL, filename, and an optional explicit replacement flag through JSON stdin. It SHALL read NOTION_TOKEN only from the environment, validate bounded image downloads, save collision-free files under ~/downloads, upload and assign covers through the native API, and verify assignment separately from upload success. Image identity and source selection SHALL remain agent responsibilities.

#### Scenario: Existing or concurrently changed cover
- **WHEN** a cover exists without explicit replacement intent, or changes between initial read and assignment
- **THEN** the helper SHALL preserve it and report the outcome without blindly overwriting it

#### Scenario: Uncertain cover assignment
- **WHEN** a PATCH result is uncertain or refetch does not verify the assigned file cover
- **THEN** the helper SHALL avoid mutation retries, report the uncertainty, and return the local image for manual setup

#### Scenario: Installed helper
- **WHEN** the skill is copied outside the repository
- **THEN** the helper SHALL run using Node built-ins without repository paths, services, or additional packages

### Requirement: Shared in-app browser fallback
For all libraries and related entities, when public metadata or image retrieval fails or returns incomplete content, the skill SHALL try opening the matching source page in the in-app browser before changing sources. It SHALL read rendered evidence and actual image URLs through supported browser tools, preserving source priorities and identity/edition scope. This read-only fallback SHALL NOT access unrelated tabs, history, cookies, storage, credentials, or profile files.

#### Scenario: Incomplete or blocked source retrieval
- **WHEN** ordinary retrieval fails or omits needed metadata or image URLs
- **THEN** the skill SHALL try the corresponding source page in the in-app browser as part of the requested lookup
- **AND** if browser access remains unavailable or blocked, it SHALL report the limitation and follow existing source/cover fallbacks, handling login or verification under normal browser handoff requirements

### Requirement: Select missing people for movie and drama creation
When adding movies or dramas, the skill SHALL deduplicate credited identities and directly link verified existing people. It SHALL present only missing people with names, roles, and relevant work/season context for explicit selection before creation. A person spanning roles or seasons SHALL appear once. Ambiguous matches SHALL be clarified rather than duplicated.

#### Scenario: Select new people
- **WHEN** verified credited people are absent from the relation target
- **THEN** a true multi-select tool SHALL be used when available; otherwise a numbered list SHALL accept multiple numbers, all, or none without presenting a single-choice tool as multi-select
- **AND** only selected missing people SHALL be created with the live Person template, verified type/icon, and supported role tags, then linked to the work
- **AND** silence or preselection SHALL NOT authorize creation; unselected people SHALL remain uncreated and unlinked

#### Scenario: Independent creation work
- **WHEN** the missing-person selection is pending
- **THEN** independent metadata, template, cover, and existing-person links SHALL complete without recreating the work later
- **AND** this workflow SHALL NOT trigger unsolicited backfill of existing dramas or expand other libraries' related-record creation permissions
