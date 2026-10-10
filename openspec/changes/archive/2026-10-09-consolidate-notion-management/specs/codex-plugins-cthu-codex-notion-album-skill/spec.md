## MODIFIED Requirements

### Requirement: Manual Music Release skill entry point
CthuCodex SHALL replace `notion-maintain-album` with `notion-manage`, displayed under `Notion ·`, for manual-only management of the configured Music Release database.

#### Scenario: Invocation is explicit
- **WHEN** the plugin is installed
- **THEN** the new skill SHALL set `allow_implicit_invocation: false` and replace the old entry point
- **AND** ordinary music discussion or an uninvoked library request SHALL NOT activate it
