## ADDED Requirements

### Requirement: Shared repository plugin discovery

The OpenCode adapters SHALL use the same repository plugin enablement rules as `chc codex install`, including enabled manifest entries and discovered plugins that are not disabled.

#### Scenario: Enabled repository plugin is shared

- **WHEN** a repository plugin is enabled in the repository plugin manifest
- **THEN** both `chc opencode skills` and `chc opencode mcp` SHALL consider that plugin's declared assets

#### Scenario: Disabled repository plugin is excluded

- **WHEN** a repository plugin is disabled in the repository plugin manifest
- **THEN** neither OpenCode synchronization command SHALL import assets from that plugin

### Requirement: OpenCode skill path synchronization

The CLI SHALL provide `chc opencode skills`. It SHALL read each enabled plugin's `skills` declaration, resolve declared paths relative to the plugin root, reject paths outside that root, and add the resulting paths to OpenCode `skills.paths` without duplicating existing entries.

#### Scenario: Plugin skills are added to OpenCode

- **WHEN** an enabled plugin declares one or more skill directories and OpenCode has a valid configuration
- **THEN** `chc opencode skills` SHALL add the resolved skill paths to `skills.paths` while retaining unrelated configuration values

#### Scenario: Repeating skill synchronization is idempotent

- **WHEN** `chc opencode skills` is run again without changing the enabled plugins or existing paths
- **THEN** the command SHALL leave the configuration semantically unchanged and report that no update was required

#### Scenario: No plugin skills are declared

- **WHEN** no enabled repository plugin declares a skill path
- **THEN** the command SHALL succeed without creating an empty plugin-owned skill entry

### Requirement: OpenCode MCP synchronization

The CLI SHALL provide `chc opencode mcp`. It SHALL read enabled plugin `.mcp.json` declarations and render them into OpenCode `mcp` entries. Local declarations SHALL combine command and arguments into `command`, convert scalar environment values to strings, resolve the working directory relative to the plugin root with the plugin root as the default, convert `tool_timeout_sec` to milliseconds as `timeout`, and preserve the enabled state. URL declarations SHALL become remote entries with their URL, optional headers, and enabled state.

#### Scenario: Local plugin MCP server is translated

- **WHEN** an enabled plugin declares a local MCP server with command, arguments, environment, and a timeout
- **THEN** `chc opencode mcp` SHALL write an OpenCode local server with the combined command array, string environment values, plugin-root working directory, millisecond timeout, and enabled flag

#### Scenario: Existing MCP configuration is retained

- **WHEN** OpenCode already contains unrelated MCP servers
- **THEN** synchronization SHALL retain those servers and add or update only the enabled plugin servers

#### Scenario: Conflicting MCP names fail safely

- **WHEN** two enabled plugins declare the same MCP server name with different definitions
- **THEN** the command SHALL fail and identify the colliding server name and both plugins instead of silently overwriting one definition

### Requirement: Safe OpenCode configuration handling

The adapters SHALL use `~/.config/opencode/opencode.json` by default, prefer an existing `opencode.jsonc`, and support explicit configuration path and home overrides. They SHALL accept JSONC comments and trailing commas, validate an object root, and write updates atomically while retaining unrelated configuration values.

#### Scenario: Existing JSONC configuration is selected

- **WHEN** `~/.config/opencode/opencode.jsonc` exists and no explicit config path is supplied
- **THEN** synchronization SHALL read and update that JSONC file rather than creating a parallel JSON file

#### Scenario: Missing configuration is created

- **WHEN** neither default OpenCode configuration file exists
- **THEN** synchronization SHALL create `~/.config/opencode/opencode.json` and write the synchronized configuration

#### Scenario: Invalid configuration is rejected

- **WHEN** the selected OpenCode configuration is not valid JSON/JSONC or its root is not an object
- **THEN** synchronization SHALL fail with a configuration error and SHALL NOT replace the invalid file with partial output

### Requirement: Explicit command boundary and output contract

The root CLI SHALL expose `opencode` with `skills` and `mcp` subcommands only. The CLI SHALL NOT expose `chc opencode install`; Codex plugin installation SHALL remain available through `chc codex install`. Each OpenCode subcommand SHALL support the existing human-readable and `--json` output conventions.

#### Scenario: OpenCode help exposes asset commands only

- **WHEN** a user invokes `chc opencode`
- **THEN** help SHALL list `skills` and `mcp` and SHALL not reserve an OpenCode `install` command

#### Scenario: JSON output identifies the operation

- **WHEN** a user invokes either OpenCode synchronization command with `--json`
- **THEN** the command SHALL return a successful JSON object containing `ok: true`, the fully qualified command name, and the synchronization result
