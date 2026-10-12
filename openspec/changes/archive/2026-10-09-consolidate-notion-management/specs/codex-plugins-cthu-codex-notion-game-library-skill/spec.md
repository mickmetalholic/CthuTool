## MODIFIED Requirements

### Requirement: Manual game library CRUD
The plugin SHALL provide `notion-manage` under `Notion ·`, with implicit invocation disabled, for natural-language query, create, update, and reversible removal.

#### Scenario: Invocation and authorization
- **WHEN** explicitly invoked with a clear target and intended change
- **THEN** the skill SHALL perform that authorized operation without fixed input syntax or mandatory repeated confirmation
- **AND** material identity or scope ambiguity SHALL be clarified before affected writes
- **AND** the skill SHALL NOT activate implicitly for ordinary game discussion
