## MODIFIED Requirements

### Requirement: Explicit lightweight book management
The plugin SHALL provide `notion-manage` in the existing `notion-` naming family with a `Notion ·` display name and implicit invocation disabled. It SHALL accept natural-language CRUD requests without a fixed input format or redundant confirmation of an unambiguous authorized operation.

#### Scenario: Manual invocation
- **WHEN** the user invokes `$notion-manage` with a clear book-maintenance request
- **THEN** the skill handles the requested operation against Book Library
- **AND** ordinary book discussion does not implicitly activate this skill

### Requirement: Single book maintenance entrypoint
The plugin SHALL replace `notion-maintain-books` with `notion-manage` and update user documentation to the new explicit-only entrypoint.

#### Scenario: Updated plugin exposes one book skill
- **WHEN** the plugin is updated with this change
- **THEN** the old book skill is absent and documentation directs users to `$notion-manage`
- **AND** no legacy alias restores implicit book maintenance
