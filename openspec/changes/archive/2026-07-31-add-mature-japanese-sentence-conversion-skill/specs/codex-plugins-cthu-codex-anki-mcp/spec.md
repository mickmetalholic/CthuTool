## ADDED Requirements

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
