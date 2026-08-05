## Why

CthuCodex currently exposes reusable skills and Anki MCP through Codex's plugin format, while OpenCode requires its own configuration entries. Without an adapter, the same repository assets must be copied and maintained twice. This change gives OpenCode explicit skills and MCP sync commands while keeping `chc codex install` plugin-only.

## What Changes

- Add `chc opencode skills` to discover enabled repository plugins and add their skill directories to OpenCode `skills.paths`.
- Add `chc opencode mcp` to translate plugin `.mcp.json` declarations into OpenCode `mcp` entries.
- Reuse Codex plugin enable/disable discovery so Codex and OpenCode consume the same repository source.
- Detect the standard OpenCode configuration directory and an existing `opencode.jsonc`, preserving unrelated configuration entries.
- Add CLI diagnostics, JSON output, completion/help coverage, documentation, and integration tests.
- Keep `chc codex install` as the plugin-only installation command; no OpenCode `install` command is introduced.

## Capabilities

### New Capabilities

- `apps-cli-opencode-shared-assets`: Sync repository-owned plugin skills and MCP servers into OpenCode configuration.

### Modified Capabilities

## Impact

- `apps/cli` command registration, repository plugin discovery, OpenCode configuration parsing/writing, tests, CLI bundle, and documentation.
- The new commands update OpenCode user configuration under `~/.config/opencode/opencode.json` or an existing `opencode.jsonc`.
- No new runtime dependency or external service is introduced; existing plugin `.mcp.json` files and skill directories remain the source of truth.
