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
