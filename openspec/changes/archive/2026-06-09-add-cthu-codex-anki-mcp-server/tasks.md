## 1. Plugin Manifest and Packaging

- [x] 1.1 Verify the current Codex plugin manifest schema for plugin-bundled stdio MCP servers.
- [x] 1.2 Update `codex/plugins/cthu-codex/.codex-plugin/plugin.json` to declare the Anki MCP server and include MCP in the plugin capabilities.
- [x] 1.3 Keep the existing language-coach hook declaration unchanged.
- [x] 1.4 Update `codex/plugins/cthu-codex/README.md` with AnkiConnect setup, endpoint configuration, and available Anki tools.

## 2. MCP Server Foundation

- [x] 2.1 Add a Node stdio MCP server script under `codex/plugins/cthu-codex/scripts/`.
- [x] 2.2 Add a centralized AnkiConnect client that sends `action`, `version`, and `params` requests and normalizes `result` and `error` responses.
- [x] 2.3 Support endpoint configuration with a default of `http://127.0.0.1:8765`.
- [x] 2.4 Add shared input validation helpers for note payloads, note IDs, batch limits, and media payloads.

## 3. Read Tools

- [x] 3.1 Implement `cthu_anki_status` using AnkiConnect `version`.
- [x] 3.2 Implement `cthu_anki_collection_schema` using deck, model, field, template, and tag AnkiConnect actions.
- [x] 3.3 Implement `cthu_anki_find_notes` using AnkiConnect `findNotes`.
- [x] 3.4 Implement `cthu_anki_get_notes` using AnkiConnect `notesInfo`.

## 4. Write and Validation Tools

- [x] 4.1 Implement `cthu_anki_validate_notes` using AnkiConnect `canAddNotes`.
- [x] 4.2 Implement `cthu_anki_add_notes` with prevalidation, batch-size enforcement, and AnkiConnect `addNotes`.
- [x] 4.3 Implement per-note result reporting for successful and failed note creation.
- [x] 4.4 Implement `cthu_anki_store_media` using AnkiConnect `storeMediaFile`.

## 5. Browser Opening Workflow

- [x] 5.1 Implement `cthu_anki_open_notes` using AnkiConnect `guiBrowse` and `nid:<noteId>` search queries.
- [x] 5.2 Add `openAfterCreate` support to `cthu_anki_add_notes`.
- [x] 5.3 Cap multi-note Browser opening queries and return warnings when the cap is applied.
- [x] 5.4 Treat post-create Browser opening failures as warnings without changing successful note creation results.

## 6. Repository Plugin Install Support

- [x] 6.1 Add or update plugin manager tests proving install preserves bundled MCP server metadata in local marketplace/plugin state.
- [x] 6.2 Add or update plugin cache synchronization tests proving MCP metadata survives versioned cache copies and hook command normalization.
- [x] 6.3 Adjust `apps/cli` plugin install/cache code only if tests reveal MCP metadata is currently dropped or rewritten. Tests showed no production CLI change was needed.

## 7. Verification

- [x] 7.1 Add unit tests for the AnkiConnect client response handling and validation errors.
- [x] 7.2 Add MCP tool tests with a mocked AnkiConnect endpoint for status, schema reads, search, note details, validation, note creation, media storage, and Browser opening.
- [x] 7.3 Run `pnpm --filter @cthutool/cli test` if CLI install behavior changes.
- [x] 7.4 Run the plugin MCP server locally against a mocked endpoint and verify tool list/handler behavior.
- [x] 7.5 Optionally smoke-test against a real local AnkiConnect instance before archiving the change. Attempted read-only status smoke; local AnkiConnect was not reachable.
