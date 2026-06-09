## ADDED Requirements

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
