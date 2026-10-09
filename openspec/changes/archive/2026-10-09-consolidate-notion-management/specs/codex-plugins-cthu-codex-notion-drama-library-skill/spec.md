## MODIFIED Requirements

### Requirement: Manual Drama Library management
The plugin SHALL provide `notion-manage`, displayed under `Notion ·`, with implicit invocation disabled and natural-language query, create, update, and reversible removal.

#### Scenario: Authorized operation
- **WHEN** the user explicitly invokes the skill with a clear target and requested change
- **THEN** the skill SHALL act within that authorization without fixed input syntax or mandatory repeated confirmation
- **AND** material ambiguity SHALL be clarified before affected writes

#### Scenario: No invocation
- **WHEN** the user discusses dramas without invoking this skill
- **THEN** the skill SHALL NOT activate implicitly
