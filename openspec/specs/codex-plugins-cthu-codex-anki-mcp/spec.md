# codex-plugins-cthu-codex-anki-mcp Specification

## Purpose
Define the CthuCodex Anki MCP server integration, AnkiConnect status, schema discovery, note lookup, candidate validation, note creation, existing-note updates, media storage, and browser opening workflows.

## Requirements
### Requirement: Plugin-bundled Anki MCP server
CthuCodex SHALL bundle a stdio MCP server for Anki card creation utilities without changing the existing language-coach hook behavior.

#### Scenario: Plugin declares Anki MCP capability
- **WHEN** CthuCodex is installed from `codex/plugins/cthu-codex`
- **THEN** the plugin exposes an Anki MCP server in addition to the existing language-coach hook
- **AND** the plugin metadata identifies both hook and MCP capabilities

#### Scenario: MCP server starts from plugin scripts
- **WHEN** Codex launches the CthuCodex Anki MCP server
- **THEN** it starts a Node script from the plugin's `scripts` directory
- **AND** it does not require project-local `.codex/config.toml` MCP setup

#### Scenario: Language coach remains independent
- **WHEN** the Anki MCP server is added to CthuCodex
- **THEN** the existing `UserPromptSubmit` language-coach hook remains responsible only for English prose review
- **AND** Anki tool behavior is not implemented in the prompt hook

### Requirement: AnkiConnect status tool
The Anki MCP server SHALL expose `cthu_anki_status` to verify AnkiConnect reachability and version compatibility.

#### Scenario: AnkiConnect is reachable
- **WHEN** `cthu_anki_status` is invoked and AnkiConnect responds to `version`
- **THEN** the tool returns `ok: true`, the configured endpoint, and the reported version

#### Scenario: AnkiConnect is unavailable
- **WHEN** `cthu_anki_status` is invoked and the endpoint cannot be reached
- **THEN** the tool returns `ok: false`, the configured endpoint, and a connection error summary
- **AND** it does not throw an unstructured exception to the caller

### Requirement: Collection schema discovery tool
The Anki MCP server SHALL expose `cthu_anki_collection_schema` to read the collection context needed before creating notes.

#### Scenario: Collection schema is read
- **WHEN** `cthu_anki_collection_schema` is invoked
- **THEN** the tool returns available deck names, note type names, note type fields, template field usage where available, and collection tags

#### Scenario: Specific note types are requested
- **WHEN** `cthu_anki_collection_schema` is invoked with a subset of note type names
- **THEN** the tool limits field and template details to the requested note types
- **AND** it reports missing requested note types without failing the entire request

### Requirement: Note search and detail tools
The Anki MCP server SHALL expose read tools for finding and inspecting existing notes before or after card creation.

#### Scenario: Find notes by Anki query
- **WHEN** `cthu_anki_find_notes` is invoked with an Anki search query
- **THEN** the tool returns matching note IDs from AnkiConnect

#### Scenario: Read notes by IDs
- **WHEN** `cthu_anki_get_notes` is invoked with note IDs
- **THEN** the tool returns note details including note ID, note type, tags, and field values

#### Scenario: Empty ID list is rejected
- **WHEN** `cthu_anki_get_notes` is invoked without note IDs
- **THEN** the tool returns a validation error before calling AnkiConnect

### Requirement: Candidate note validation
The Anki MCP server SHALL expose `cthu_anki_validate_notes` to validate candidate notes before writing them.

#### Scenario: Candidate notes can be added
- **WHEN** `cthu_anki_validate_notes` is invoked with valid note payloads
- **THEN** the tool calls AnkiConnect `canAddNotes`
- **AND** it returns per-note validation results

#### Scenario: Candidate note payload is malformed
- **WHEN** `cthu_anki_validate_notes` receives a note without required deck, model, or fields data
- **THEN** the tool returns a structured validation error
- **AND** it does not call AnkiConnect for that malformed batch

### Requirement: Safe batch note creation
The Anki MCP server SHALL expose `cthu_anki_add_notes` to create notes through AnkiConnect with validation and bounded batch behavior.

#### Scenario: Notes are validated and created
- **WHEN** `cthu_anki_add_notes` is invoked with candidate notes
- **THEN** the tool validates the notes before writing
- **AND** it creates notes with AnkiConnect `addNotes` only after validation succeeds
- **AND** it returns per-note creation results including created note IDs

#### Scenario: Batch exceeds maximum size
- **WHEN** `cthu_anki_add_notes` receives more notes than the configured maximum batch size
- **THEN** the tool rejects the request before calling AnkiConnect
- **AND** it reports the maximum allowed batch size

#### Scenario: Validation fails before creation
- **WHEN** `cthu_anki_add_notes` validation reports one or more candidate notes cannot be added
- **THEN** the tool does not call `addNotes`
- **AND** it returns the validation failures to the caller

### Requirement: Media storage tool
The Anki MCP server SHALL expose `cthu_anki_store_media` to store media files in Anki before notes reference them.

#### Scenario: Media is stored
- **WHEN** `cthu_anki_store_media` is invoked with a filename and content payload
- **THEN** the tool stores the media through AnkiConnect
- **AND** it returns the filename that card fields can reference

#### Scenario: Media filename is missing
- **WHEN** `cthu_anki_store_media` is invoked without a filename
- **THEN** the tool returns a validation error before calling AnkiConnect

### Requirement: Open notes in Anki Browser
The Anki MCP server SHALL expose `cthu_anki_open_notes` and SHALL support optional post-create Browser opening from `cthu_anki_add_notes`.

#### Scenario: Open existing notes
- **WHEN** `cthu_anki_open_notes` is invoked with note IDs
- **THEN** the tool calls AnkiConnect `guiBrowse` with an Anki search query based on `nid:<noteId>`
- **AND** it returns whether the Browser opening request succeeded

#### Scenario: Open notes after creation
- **WHEN** `cthu_anki_add_notes` creates notes and `openAfterCreate` is true
- **THEN** the tool calls `guiBrowse` with the created note IDs
- **AND** the tool includes the Browser opening result in its response

#### Scenario: Browser opening fails after creation
- **WHEN** `cthu_anki_add_notes` creates notes but the follow-up `guiBrowse` call fails
- **THEN** note creation remains successful
- **AND** the response includes a warning describing the Browser opening failure

#### Scenario: Many notes are opened after creation
- **WHEN** `cthu_anki_add_notes` creates more notes than the Browser opening limit and `openAfterCreate` is true
- **THEN** the tool opens only the allowed number of created note IDs
- **AND** the response includes a warning that the Browser query was capped

### Requirement: Safe batch updates for existing notes
The Anki MCP server SHALL expose `cthu_anki_update_notes` for validated, bounded updates to existing note fields.

#### Scenario: Valid updates pass preflight
- **WHEN** `cthu_anki_update_notes` receives valid update payloads within the configured batch limit
- **THEN** it reads all target notes through AnkiConnect `notesInfo`
- **AND** it verifies each note exists and every target and expected field exists before writing
- **AND** it compares current field values with all supplied expected field values

#### Scenario: Expected field no longer matches
- **WHEN** any target note has a current field value different from its supplied expected value
- **THEN** the tool rejects the entire batch before calling `updateNoteFields`
- **AND** it returns a structured stale-value error identifying the note and field

#### Scenario: Malformed or oversized batch is rejected
- **WHEN** an update is missing a valid note ID or non-empty fields, or the batch exceeds the configured maximum size
- **THEN** the tool returns a structured validation error before calling AnkiConnect mutation actions
- **AND** it reports the maximum allowed batch size when that limit is exceeded

#### Scenario: Fields are updated
- **WHEN** every update passes preflight
- **THEN** the tool calls AnkiConnect `updateNoteFields` for each target note
- **AND** it preserves fields that were not included in the update payload
- **AND** it does not modify note tags

#### Scenario: Runtime update partially fails
- **WHEN** AnkiConnect returns an error after one or more target notes have already updated
- **THEN** the tool returns per-note results that distinguish field update success and failure states
- **AND** it does not report the batch as atomically rolled back

### Requirement: Post-update Browser review
The Anki MCP server SHALL support optional bounded Anki Browser opening for successfully updated notes.

#### Scenario: Successful updates are opened
- **WHEN** `cthu_anki_update_notes` successfully updates notes and `openAfterUpdate` is true
- **THEN** the tool calls `guiBrowse` with the successfully updated note IDs
- **AND** it includes the Browser opening result in its response

#### Scenario: Browser opening is capped
- **WHEN** successful updates exceed the configured Browser opening limit
- **THEN** the tool opens only the allowed number of note IDs
- **AND** it returns a warning that the Browser query was capped

#### Scenario: Browser opening fails after updates
- **WHEN** note updates succeed but the follow-up `guiBrowse` call fails
- **THEN** the note update results remain successful
- **AND** the response includes a Browser warning
