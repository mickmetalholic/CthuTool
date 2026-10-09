## MODIFIED Requirements

### Requirement: Explicit channel management entrypoint
The plugin SHALL provide `notion-manage` with a `Notion ·` display name and implicit invocation disabled, replacing the old add-channel entrypoint and its documentation. It SHALL accept natural-language CRUD requests without mandatory fixed syntax or redundant confirmation of clear authorized operations.

#### Scenario: Manual management
- **WHEN** the user explicitly invokes `$notion-manage` to maintain channel records
- **THEN** the requested CRUD operation is handled and ordinary channel discussion does not implicitly activate this skill
- **AND** the old skill is no longer installed from the plugin source

#### Scenario: No operation supplied
- **WHEN** a bare invocation provides no operation or target
- **THEN** the skill asks what to manage without accessing browser state
