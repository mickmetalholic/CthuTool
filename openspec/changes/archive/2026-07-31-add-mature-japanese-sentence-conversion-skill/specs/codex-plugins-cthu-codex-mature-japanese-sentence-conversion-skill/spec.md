## ADDED Requirements

### Requirement: Plugin-local mature Japanese sentence conversion skill
CthuCodex SHALL provide a plugin-local, explicit-only skill named `anki-convert-mature-japanese-sentence-cards` for promoting eligible `Japanese Sentence` notes to whole-sentence production.

#### Scenario: Skill is packaged with CthuCodex
- **WHEN** the conversion skill is implemented
- **THEN** its instructions live under `codex/plugins/cthu-codex/skills/anki-convert-mature-japanese-sentence-cards/`
- **AND** its display name starts with `Anki ·`

#### Scenario: Skill cannot run implicitly
- **WHEN** the conversion skill is installed
- **THEN** its `agents/openai.yaml` sets `policy.allow_implicit_invocation` to `false`
- **AND** ordinary prompts do not implicitly invoke the existing-note mutation workflow

### Requirement: FSRS-based mature note selection
The skill SHALL select candidate notes using Anki search criteria that represent stable reviewed cards.

#### Scenario: Default selection criteria are used
- **WHEN** the user invokes the skill without a custom stability threshold
- **THEN** the search targets deck `0.Japanese::Japanese Sentences` and note type `Japanese Sentence`
- **AND** it requires review state, excludes learning, suspended, and buried cards, requires `prop:s>=45`, and requires `prop:reps>=3`

#### Scenario: User overrides the stability threshold
- **WHEN** the user supplies a positive stability threshold in days
- **THEN** the skill replaces the default `45` in the `prop:s` search criterion with the supplied value
- **AND** it preserves the remaining default safety filters

#### Scenario: FSRS stability search is unavailable
- **WHEN** Anki rejects or cannot evaluate the `prop:s` criterion
- **THEN** the skill stops and reports that FSRS stability selection is unavailable
- **AND** it does not silently fall back to an interval-based selection rule

### Requirement: Safe whole-sentence cloze transformation
The skill SHALL transform only structurally supported notes by promoting the complete Japanese sentence to the `c1` answer and the existing English translation to the `c1` hint.

#### Scenario: Supported local cloze is transformed
- **WHEN** `文` contains one non-nested `c1` cloze and no other cloze number
- **AND** `訳` contains a non-empty representable English translation
- **THEN** the skill removes the local cloze wrapper while preserving its Japanese answer text in the complete sentence
- **AND** it proposes `{{c1::<complete Japanese sentence>::<English translation>}}` as the new `文`

#### Scenario: Non-target fields are preserved
- **WHEN** the skill proposes a supported conversion
- **THEN** it changes only `文`
- **AND** it leaves `ヒント`, `訳`, `メモ`, and unrelated fields unchanged
- **AND** it leaves all tags unchanged

#### Scenario: Already-converted no-op is skipped
- **WHEN** the generated whole-sentence `文` exactly equals the current `文`
- **THEN** the skill excludes the note from the write candidate set
- **AND** it reports the note as already converted with no change required

#### Scenario: Unsupported note is skipped
- **WHEN** a candidate has a missing translation, malformed or nested cloze markup, multiple cloze deletions, another cloze number, or content that cannot be represented safely
- **THEN** the skill excludes the note from the write candidate set
- **AND** it reports the note ID and skip reason

### Requirement: Mandatory conversion preview and confirmation
The skill SHALL show the exact proposed mutations and obtain explicit user confirmation before updating Anki.

#### Scenario: Candidate preview is shown
- **WHEN** supported candidates have been prepared
- **THEN** the skill shows each candidate note ID, original `文`, and proposed `文`
- **AND** it reports skipped notes separately
- **AND** it does not call an Anki write tool yet

#### Scenario: Dry run stops after preview
- **WHEN** the user requests a dry run or preview
- **THEN** the skill returns the candidate and skip results without updating notes

#### Scenario: User confirms a bounded batch
- **WHEN** the user explicitly confirms the displayed candidate set
- **THEN** the skill updates no more than 20 notes in that batch
- **AND** it reports when additional matching candidates remain for a later batch

#### Scenario: User does not confirm
- **WHEN** the user rejects, changes, or does not confirm the displayed candidate set
- **THEN** the skill does not update any note

### Requirement: Guarded Anki update workflow
The skill SHALL use CthuCodex Anki MCP tools to verify schema, inspect current notes, guard against stale previews, update confirmed candidates, and open successful updates for review.

#### Scenario: Schema and current notes are inspected
- **WHEN** the skill begins candidate preparation
- **THEN** it verifies the `Japanese Sentence` schema through `cthu_anki_collection_schema`
- **AND** it finds and reads candidates through `cthu_anki_find_notes` and `cthu_anki_get_notes`
- **AND** it stops if the expected model or required fields are unavailable

#### Scenario: Confirmed notes are updated with expected values
- **WHEN** the user confirms the preview
- **THEN** the skill calls `cthu_anki_update_notes` with the proposed `文` and the previewed `文` and `訳` as expected field values
- **AND** it does not add or remove tags
- **AND** it requests Browser opening after successful updates

#### Scenario: Update preflight detects a stale note
- **WHEN** any confirmed note no longer matches its previewed expected fields
- **THEN** the MCP update batch performs no writes
- **AND** the skill reports the stale note and prepares no automatic retry

#### Scenario: Runtime update is partially successful
- **WHEN** AnkiConnect fails after one or more notes have already updated
- **THEN** the skill reports the per-note results and partial completion explicitly
- **AND** it does not describe the entire batch as either wholly successful or wholly failed

#### Scenario: Browser opening fails after update
- **WHEN** note updates succeed but Browser opening fails
- **THEN** the skill reports the update success and the Browser warning separately
