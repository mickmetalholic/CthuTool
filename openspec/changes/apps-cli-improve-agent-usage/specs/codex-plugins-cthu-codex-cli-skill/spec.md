## Purpose

Help agents operate the installed CthuTool CLI from user goals using live command discovery, portable task guidance, and the user's existing authorization.

## ADDED Requirements

### Requirement: Discoverable portable CLI skill
CthuCodex SHALL bundle the automatically discoverable `cthutool-cli` skill with matching invocation metadata. Its instructions and referenced resources SHALL be usable outside a CthuTool checkout without hard-coded host paths or an additional MCP server.

#### Scenario: Installed plugin is used from another directory
- **WHEN** the agent receives a CthuTool CLI operation request outside the source checkout
- **THEN** the skill directs it to discover the installed `chc` executable and its current version/help
- **AND** it does not require repository TypeScript source or a fixed checkout path

### Requirement: Goal-directed supported operations
The skill SHALL route CLI requests across source, Agent, Codex, Obsidian, scripts, and completion operations using live help as authority. It SHALL distinguish CLI updates from Agent updates and preserve explicit source, vault, input, and output targets.

#### Scenario: Agent update is requested
- **WHEN** a user requests an Agent runtime update
- **THEN** the guidance selects `chc agent update` and verifies Agent state rather than updating the CLI source

#### Scenario: Conversion is requested
- **WHEN** the user requests PDF or fixed-layout EPUB conversion to CBZ
- **THEN** the guidance discovers conversion options, retains the intended paths and conflict policy, and verifies converted/skipped/failed counts

### Requirement: Automation and authorization boundaries
The skill SHALL prefer supported JSON and non-interactive inputs for agent operation, interpret command-specific response shapes and exit codes, and preserve the user's authorized scope without requiring routine reconfirmation. Installing missing tools, switching sources, overwriting output, purging data, or changing plugins SHALL NOT be implied by a read-only inspection request.

#### Scenario: Read-only inspection is requested
- **WHEN** the user asks for status or diagnostics
- **THEN** guidance selects inspection operations and reports actionable failures without automatically changing installation or configuration

#### Scenario: A scoped operation is already authorized
- **WHEN** the user has clearly authorized an operation and its targets
- **THEN** the agent completes the operation and verification without adding a blanket approval step
- **AND** it asks only for missing decisions or materially expanded scope

#### Scenario: Interactive skills management cannot run unattended
- **WHEN** a non-interactive agent inspects Codex skills
- **THEN** it can use the JSON inventory and explains any interactive manager requirement without inventing unattended mutation flags
