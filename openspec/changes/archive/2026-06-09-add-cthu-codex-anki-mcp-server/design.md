## Context

CthuCodex lives under `codex/plugins/cthu-codex` as a repository-managed Codex plugin. It currently contains a language-coach hook and a small Node script, with plugin installation handled by `chc codex install` through repository plugin discovery and cache synchronization. The requested feature adds a second, independent utility line: a local MCP server that lets Codex read and write Anki data through AnkiConnect.

AnkiConnect is a local HTTP JSON API exposed by the Anki desktop add-on, usually at `http://127.0.0.1:8765`. It accepts requests shaped around `action`, `version`, and `params`, and returns `result` or `error`. The Anki functionality needed for this change is narrower than the full AnkiConnect API: connection status, collection schema reads, note search, note detail reads, note validation, note creation, media storage, and Browser navigation after creation.

The design should keep three layers distinct:

- The CthuCodex hook remains responsible only for prompt-time language coaching.
- The CthuCodex Anki MCP server exposes deterministic tools around AnkiConnect.
- Codex remains responsible for reasoning over user-provided information and drafting candidate card content.

## Goals / Non-Goals

**Goals:**

- Bundle a stdio MCP server with CthuCodex so installed users can enable Anki tools through the plugin.
- Provide high-level tools instead of a raw AnkiConnect action passthrough.
- Support a safe create flow: inspect schema, search for existing notes, validate candidates, add notes, and optionally open created notes in Anki's Browser.
- Make AnkiConnect endpoint configuration explicit and default to `http://127.0.0.1:8765`.
- Keep failures machine-readable and per-note where possible.
- Ensure repository plugin installation and cache synchronization preserve the plugin's MCP server declaration.

**Non-Goals:**

- Do not expose destructive Anki actions such as deleting decks, deleting notes, suspending cards, or exiting Anki.
- Do not implement a general-purpose `invokeAnkiConnect` tool in the first version.
- Do not make the MCP server perform LLM card generation internally.
- Do not support remote AnkiWeb, AnkiDroid, or direct collection database access.
- Do not change the existing language-coach hook behavior.

## Decisions

### Use a plugin-bundled stdio MCP server

CthuCodex should add a Node stdio MCP server script under the plugin's `scripts/` directory and declare it in the plugin manifest using the Codex-supported plugin-provided MCP server metadata. This keeps the Anki integration local, installable with the rest of CthuCodex, and independent from project `.codex/config.toml`.

Alternative considered: tell users to add a project-scoped MCP server manually. That would work for experimentation, but it would not make Anki card creation a reusable CthuCodex utility.

### Expose a high-level Anki facade

The MCP server should expose these tools:

- `cthu_anki_status`
- `cthu_anki_collection_schema`
- `cthu_anki_find_notes`
- `cthu_anki_get_notes`
- `cthu_anki_validate_notes`
- `cthu_anki_add_notes`
- `cthu_anki_store_media`
- `cthu_anki_open_notes`

These tools map onto AnkiConnect actions such as `version`, `deckNames`, `modelNames`, `modelFieldNames`, `modelFieldsOnTemplates`, `getTags`, `findNotes`, `notesInfo`, `canAddNotes`, `addNotes`, `storeMediaFile`, and `guiBrowse`.

Alternative considered: expose one raw tool that accepts any AnkiConnect action. That is easier to implement, but it gives Codex access to many actions that are unnecessary for card creation and increases the chance of accidental destructive operations.

### Treat Browser opening as optional follow-up behavior

`cthu_anki_add_notes` should accept an `openAfterCreate` option. After successful creation, it can call `guiBrowse` using Anki's `nid:<noteId>` search syntax. For multiple notes it can build an `OR` query, capped to a small maximum to avoid a sluggish Browser. The server should also expose `cthu_anki_open_notes` so existing note IDs can be opened independently.

If Browser opening fails after notes are created, note creation remains successful and the tool returns a warning. This prevents a GUI issue from hiding a successful write.

### Validate before write and report per-note results

`cthu_anki_add_notes` should run `canAddNotes` before `addNotes` unless the caller explicitly indicates validation was already performed for the exact payload. The tool should cap batch size, reject malformed note payloads before hitting AnkiConnect, and return a per-note result array so Codex can explain partial failures.

Alternative considered: call `addNotes` directly and let AnkiConnect reject invalid notes. Prevalidation creates clearer user feedback and avoids avoidable partial writes.

### Keep media storage separate

Media writes should live in `cthu_anki_store_media`, not be hidden inside `cthu_anki_add_notes`. The add tool should accept fields that already reference media filenames. This keeps binary/base64 handling explicit and makes card creation easier to audit.

### Preserve plugin install boundaries

The existing `chc codex install` flow already owns repository plugin registration and cache synchronization. Implementation should verify that copying and normalizing the plugin preserves MCP server manifest metadata and does not rewrite it as hook-only content. If cache synchronization bumps plugin versions, MCP metadata should move with the versioned cache copy.

## Risks / Trade-offs

- AnkiConnect unavailable -> `cthu_anki_status` returns a clear connection failure and other tools fail fast with endpoint information.
- AnkiConnect version differences -> tool handlers should centralize request/response validation and avoid relying on undocumented response shapes.
- GUI Browser opening may fail or focus unpredictably -> post-create opening returns warnings and never invalidates successful note creation.
- Batch creation can create unwanted cards quickly -> enforce batch caps, validation, and explicit input schemas.
- Plugin MCP manifest schema may change -> implementation should verify the current Codex plugin manifest format before coding and cover cache sync with tests.
