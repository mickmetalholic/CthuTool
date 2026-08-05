## Context

CthuTool keeps repository-owned Codex plugins under `codex/plugins`. A plugin can expose skills through `.codex-plugin/plugin.json` and MCP servers through `.mcp.json`. `chc codex install` already resolves which repository plugins are enabled, but OpenCode consumes a different configuration shape: skill directories are listed under `skills.paths` and MCP servers are declared under `mcp`.

The adapter must let Codex and OpenCode consume the same plugin assets without copying skills or introducing a second enablement model. It also needs to work with the standard OpenCode per-user configuration location and fit the existing CLI diagnostics, JSON output, and path-safety conventions.

## Goals / Non-Goals

**Goals:**

- Expose `chc opencode skills` and `chc opencode mcp` as explicit synchronization commands.
- Reuse the repository plugin discovery and enabled/disabled semantics used by `chc codex install`.
- Add idempotent, path-based skill synchronization and MCP declaration translation.
- Preserve unrelated OpenCode configuration values and support both JSON and JSONC files.
- Keep the commands testable with repository, home, plugin, and config path overrides.

**Non-Goals:**

- Add an OpenCode plugin installer, marketplace, cache, or `chc opencode install` command.
- Copy or materialize skill files into an OpenCode-specific directory.
- Start, stop, or manage MCP server processes; OpenCode remains responsible for runtime execution.
- Change Codex plugin installation or the repository plugin manifest format.

## Decisions

### Reuse the enabled repository plugin resolver

Both OpenCode adapters call the shared resolver used by `chc codex install`. Repository manifest entries marked enabled are included, disabled names are excluded, and otherwise-discovered repository plugins remain available. This keeps one source of truth for asset ownership and avoids duplicating enablement logic.

An alternative was to scan `codex/plugins` independently in each adapter. That would be simpler locally, but it would allow Codex and OpenCode to disagree about disabled or explicitly configured plugins.

### Reference skill directories directly

The skills adapter reads the plugin manifest's `skills` string or array, resolves each path relative to the plugin root, verifies it remains inside that root, and adds the absolute paths to OpenCode's `skills.paths`. Existing paths are retained and duplicates are removed.

Copying the directories was rejected because it creates stale generated state and prevents Codex and OpenCode from seeing the same repository changes immediately.

### Translate MCP declarations at the configuration boundary

The MCP adapter treats each plugin `.mcp.json` as the source format and renders OpenCode entries without changing the plugin files. Local declarations become OpenCode `type: "local"` entries with one combined command array, scalar environment values converted to strings, a plugin-root working directory by default, millisecond timeouts, and an enabled flag. URL declarations become `type: "remote"` entries while retaining URL, headers, and enabled state.

If two enabled plugins declare the same server name with different values, synchronization fails rather than silently selecting one. Identical declarations are safe to deduplicate.

### Detect and write the OpenCode configuration safely

The default config directory is `~/.config/opencode`. If `opencode.jsonc` already exists it is selected; otherwise `opencode.json` is used. Explicit path overrides are available for tests and non-standard installations.

The reader accepts JSONC comments and trailing commas, validates that the root is an object, and the writer performs an atomic temporary-file write followed by rename. Semantic values outside the synchronized `skills` or `mcp` fields are retained. Formatting and comments may be normalized when the file is rewritten.

### Keep the command boundary explicit

The root command owns an `opencode` group with only `skills` and `mcp` subcommands. Each subcommand uses the existing CLI context, diagnostics, human output, and `--json` contract. Codex installation remains under `chc codex install`, so future plugin installation behavior does not become coupled to OpenCode asset synchronization.

## Risks / Trade-offs

- **OpenCode schema drift** → Keep the translation limited to the currently supported `skills.paths` and `mcp` shapes and validate the generated configuration with OpenCode's debug commands in development.
- **JSONC comments or formatting are rewritten** → Preserve unrelated semantic configuration values, document that the file is rewritten, and use atomic writes to avoid partial configuration files.
- **MCP server names collide across plugins** → Fail with both plugin names in the error instead of producing nondeterministic configuration.
- **A plugin declares a path outside its root** → Reject the path with the existing path-safety assertion before writing OpenCode configuration.

## Migration Plan

There is no automatic migration. Users run `chc opencode skills` and/or `chc opencode mcp` when they want to expose the repository assets to OpenCode. The operations are idempotent, so repeating them after plugin changes refreshes the same configuration entries. Rollback consists of removing the generated paths or server entries from the OpenCode config; `chc codex install` remains unchanged.

## Open Questions

None for this change. Future work can add explicit ownership markers or removal/pruning commands if OpenCode configuration lifecycle management becomes necessary.
