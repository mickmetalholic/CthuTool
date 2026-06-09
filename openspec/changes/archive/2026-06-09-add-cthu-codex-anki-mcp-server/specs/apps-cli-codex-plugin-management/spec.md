## ADDED Requirements

### Requirement: Repository plugin MCP metadata preservation
The `chc codex install` flow SHALL preserve bundled MCP server metadata when installing and synchronizing repository-owned Codex plugins.

#### Scenario: Installed plugin keeps MCP server declaration
- **WHEN** an enabled repository plugin declares a bundled MCP server in its plugin manifest
- **AND** the user runs `chc codex install`
- **THEN** the installed local plugin entry preserves the MCP server declaration
- **AND** existing hook metadata remains preserved

#### Scenario: Plugin cache keeps MCP server declaration
- **WHEN** an enabled repository plugin with bundled MCP server metadata is synchronized to the Codex plugin cache
- **THEN** the versioned cache copy preserves the MCP server declaration
- **AND** hook command normalization does not remove or rewrite unrelated MCP metadata

#### Scenario: Status reports plugin without requiring MCP startup
- **WHEN** the user runs `chc codex status`
- **THEN** repository plugin status is computed from manifest and marketplace state
- **AND** the command does not attempt to start bundled MCP servers
