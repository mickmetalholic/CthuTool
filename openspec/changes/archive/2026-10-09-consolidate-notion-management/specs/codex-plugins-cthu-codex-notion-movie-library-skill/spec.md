## MODIFIED Requirements

### Requirement: Manual Movie Library CRUD entry point
The plugin SHALL expose `notion-manage` under `Notion ·` for manually invoked query, create, update, and reversible removal, using the authorized Notion connector and agent-native public web tools only.

#### Scenario: Manual invocation
- **WHEN** the skill is installed
- **THEN** `allow_implicit_invocation` SHALL be false
- **AND** ordinary movie discussion or an uninvoked library request SHALL NOT activate it

#### Scenario: Clear mutation or ambiguous intent
- **WHEN** a user invokes the skill with a clear target and requested change
- **THEN** the skill SHALL act within that authorization without mandatory repeated confirmation or fixed input syntax
- **AND** unresolved operation, identity, or destructive scope SHALL be clarified before affected writes

#### Scenario: Runtime boundary
- **WHEN** the skill manages records
- **THEN** it SHALL NOT require a CthuTool backend, direct movie API, API key, script, local service, or new MCP server
- **AND** any future backend integration TODO SHALL preserve identity disambiguation and user-authorized write scope
