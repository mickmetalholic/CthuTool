## ADDED Requirements

### Requirement: Plugin-local Japanese sentence card skill
CthuCodex SHALL provide a plugin-local skill for creating `Japanese Sentence` Anki notes from user-provided Japanese example sentences and grammar points.

#### Scenario: Skill lives inside CthuCodex
- **WHEN** the Japanese sentence card skill is implemented
- **THEN** its skill instructions live under `codex/plugins/cthu-codex/skills/anki-japanese-sentence-card-maker/`
- **AND** the skill is packaged with CthuCodex rather than as a standalone top-level repository skill

#### Scenario: Skill is explicit-only
- **WHEN** the Anki Japanese sentence card skill is installed
- **THEN** its `agents/openai.yaml` sets `policy.allow_implicit_invocation` to `false`
- **AND** Codex should use it only when explicitly invoked

#### Scenario: Skill remains separate from prompt hook
- **WHEN** the skill is added to CthuCodex
- **THEN** the existing language-coach `UserPromptSubmit` hook remains responsible only for English prose review
- **AND** Japanese sentence card generation is not implemented in the prompt hook

### Requirement: Japanese sentence input parsing
The skill SHALL identify a Japanese example sentence, clozed surface phrase, and canonical grammar point before creating an Anki note.

#### Scenario: Grammar point is marked in the sentence
- **WHEN** the user provides a Japanese sentence containing one `**...**` grammar-point marker
- **THEN** the skill treats the marked text as the grammar point
- **AND** the skill removes the markdown marker before generating the Anki note fields

#### Scenario: Grammar point is provided separately
- **WHEN** the user provides a Japanese sentence and a separate grammar-point line
- **THEN** the skill treats the sentence as the source sentence
- **AND** the skill uses the separate line as a clue to identify the surface phrase and canonical grammar point

#### Scenario: Grammar clue is an inflected or sentence-bound phrase
- **WHEN** the sentence contains `買うことにした`
- **AND** the user provides a clue such as `買うことにした` or a clear typo such as `買うとにした`
- **THEN** the skill uses `買うことにした` as the clozed surface phrase
- **AND** the skill uses `～ことにする` as the canonical grammar point for `ヒント`

#### Scenario: Input cannot be parsed
- **WHEN** the skill cannot confidently identify both the sentence and grammar point
- **THEN** the skill asks the user for clarification before generating or writing a note

#### Scenario: Canonical grammar point is ambiguous
- **WHEN** multiple canonical grammar patterns could explain the same surface phrase
- **THEN** the skill asks the user which grammar point to use before writing a note

#### Scenario: Grammar point occurrence is ambiguous
- **WHEN** the grammar point occurs multiple times and no occurrence is marked
- **THEN** the skill asks the user which occurrence to cloze before writing a note

### Requirement: Japanese Sentence note generation
The skill SHALL generate a complete `Japanese Sentence` note candidate using the user's sentence and grammar point.

#### Scenario: Default deck and note type are used
- **WHEN** the skill creates a candidate note
- **THEN** the note uses deck `0.Japanese::Japanese Sentences`
- **AND** the note uses model `Japanese Sentence`

#### Scenario: Required fields are generated
- **WHEN** the skill creates a candidate note
- **THEN** the `文` field contains the Japanese sentence with Anki cloze syntax
- **AND** the `ヒント` field contains the canonical grammar point
- **AND** the `訳` field contains an English translation
- **AND** the `メモ` field contains an English grammar explanation

#### Scenario: Cloze includes English hint
- **WHEN** the skill generates the `文` field
- **THEN** the cloze syntax includes an English hint after the second `::`
- **AND** the cloze span may include a wider natural grammar phrase than the grammar point when that improves study value

### Requirement: Tag selection before note creation
The skill SHALL require tags to be selected or provided before writing the note to Anki.

#### Scenario: User provides tags in input
- **WHEN** the input includes a `tags:` line
- **THEN** the skill uses the provided tags for the candidate note
- **AND** it does not ask a separate tag-selection question before validation

#### Scenario: User provides spaced hyphen tag hierarchy shorthand
- **WHEN** the input includes a tag such as `新完全マスター - N３・文法 - 第１部・１１課`
- **THEN** the skill normalizes it to `新完全マスター::N３・文法::第１部・１１課`
- **AND** unspaced hyphens inside tag names are not converted

#### Scenario: User does not provide tags
- **WHEN** the input does not include tags
- **THEN** the skill lists all existing collection tags returned by `cthu_anki_collection_schema`
- **AND** the skill asks the user to choose or enter tags before writing the note

#### Scenario: Existing tags are available
- **WHEN** the skill needs tag selection
- **THEN** it uses `cthu_anki_collection_schema` to read existing collection tags
- **AND** it shows the full existing tag list before asking the user to choose tags

### Requirement: Anki MCP creation workflow
The skill SHALL use existing CthuCodex Anki MCP tools to validate and create notes.

#### Scenario: Schema is checked before note creation
- **WHEN** the skill prepares to create a note
- **THEN** it reads `Japanese Sentence` schema with `cthu_anki_collection_schema`
- **AND** it stops for clarification if the expected model or fields are unavailable

#### Scenario: Candidate note is validated before writing
- **WHEN** the candidate note is complete
- **THEN** the skill calls `cthu_anki_validate_notes` before calling `cthu_anki_add_notes`
- **AND** it does not call `cthu_anki_add_notes` if validation fails

#### Scenario: Created note is opened for review
- **WHEN** the note is successfully created
- **THEN** the skill requests post-create review by using `openAfterCreate: true`
- **AND** Browser-opening warnings do not turn successful note creation into a failure
