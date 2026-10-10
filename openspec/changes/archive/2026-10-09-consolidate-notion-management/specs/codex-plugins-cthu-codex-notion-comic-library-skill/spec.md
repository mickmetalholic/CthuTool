## MODIFIED Requirements

### Requirement: Explicit-only comic management
The plugin SHALL provide `notion-manage` with a `Notion ·` display name and implicit invocation disabled. It SHALL accept natural-language create, read, update, and reversible-delete requests without a fixed syntax or redundant confirmation of clear authorized operations.

#### Scenario: Manual invocation
- **WHEN** the user invokes `$notion-manage` with a clear operation
- **THEN** the skill handles that operation against Comic Book Library
- **AND** ordinary comic discussion does not implicitly invoke it
