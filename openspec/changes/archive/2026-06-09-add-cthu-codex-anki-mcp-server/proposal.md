## Why

CthuCodex currently provides a language-coach hook, but it cannot directly help Codex read a user's local Anki collection or create cards through the running AnkiConnect service. Adding a focused Anki MCP server lets Codex use local collection context, validate candidate notes, create cards, and open the resulting notes in Anki for review without turning the plugin into a full Anki administration surface.

## What Changes

- Add a bundled CthuCodex MCP server that connects to AnkiConnect over HTTP, defaulting to `http://127.0.0.1:8765`.
- Expose high-level Anki tools for service status, collection schema discovery, note search, note detail reads, note validation, note creation, media storage, and opening notes in Anki's Browser.
- Keep card generation agent-facing: Codex derives card content in conversation, while the MCP server performs deterministic Anki reads, validation, writes, and GUI navigation.
- Add safe write behavior: batch note creation validates candidates before writing, caps batch sizes, reports per-note results, and treats post-create GUI opening as a non-fatal warning if it fails.
- Preserve the existing CthuCodex language-coach hook as a separate plugin utility.

## Capabilities

### New Capabilities
- `codex-plugins-cthu-codex-anki-mcp`: Defines the CthuCodex Anki MCP server, its AnkiConnect-backed tools, safe card creation workflow, and post-create Browser opening behavior.

### Modified Capabilities
- `apps-cli-codex-plugin-management`: Repository plugin installation and cache synchronization must preserve bundled MCP server metadata when installing or syncing CthuCodex.

## Impact

- Affected plugin files: `codex/plugins/cthu-codex/.codex-plugin/plugin.json`, `codex/plugins/cthu-codex/README.md`, and new MCP server scripts under `codex/plugins/cthu-codex/scripts/`.
- Affected CLI/plugin install surface: `apps/cli/src/domain/codex-plugin-manager.ts` and related tests, if current cache synchronization strips or ignores bundled MCP server manifest metadata.
- External dependency: a local Anki desktop instance with AnkiConnect enabled and reachable at the configured endpoint.
- User-facing behavior: installed CthuCodex exposes Anki MCP tools in addition to the existing language-coach hook.
