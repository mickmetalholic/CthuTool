## MODIFIED Requirements

### Requirement: Manual Knowledge Vault CRUD
The plugin SHALL provide `notion-manage` under `Notion ·`, with implicit invocation disabled, for natural-language query, create, scoped update, and reversible removal.

#### Scenario: Invocation and authorization
- **WHEN** explicitly invoked with a clear target and intended change
- **THEN** the skill SHALL perform the authorized operation without fixed syntax or mandatory repeated confirmation
- **AND** material ambiguity SHALL be clarified before affected writes
- **AND** ordinary knowledge discussion SHALL NOT implicitly activate this skill
