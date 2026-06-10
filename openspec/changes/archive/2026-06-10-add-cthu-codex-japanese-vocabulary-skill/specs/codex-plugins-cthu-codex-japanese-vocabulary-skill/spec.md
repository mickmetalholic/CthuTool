## ADDED Requirements

### Requirement: Plugin-local Japanese vocabulary card skill
CthuCodex SHALL provide a plugin-local explicit-only skill for creating `Japanese Vocabulary` Anki notes from user-provided Japanese example sentences and vocabulary targets.

#### Scenario: Skill lives inside CthuCodex
- **WHEN** the Japanese vocabulary card skill is implemented
- **THEN** its skill instructions live under `codex/plugins/cthu-codex/skills/anki-japanese-vocabulary-card-maker/`
- **AND** the skill is packaged with CthuCodex rather than as a standalone top-level repository skill

#### Scenario: Skill is explicit-only
- **WHEN** the Anki Japanese vocabulary card skill is installed
- **THEN** its `agents/openai.yaml` sets `policy.allow_implicit_invocation` to `false`
- **AND** Codex should use it only when explicitly invoked

#### Scenario: Skill remains separate from prompt hook
- **WHEN** the skill is added to CthuCodex
- **THEN** the existing language-coach `UserPromptSubmit` hook remains responsible only for English prose review
- **AND** Japanese vocabulary card generation is not implemented in the prompt hook

### Requirement: Japanese vocabulary input parsing
The skill SHALL identify a Japanese example sentence, vocabulary surface form, dictionary-form vocabulary item, and optional lower-priority context markers before creating an Anki note.

#### Scenario: Vocabulary target is marked with double brackets
- **WHEN** the user provides a Japanese sentence containing one `[[...]]` span
- **THEN** the skill treats the marked text as the vocabulary target surface form
- **AND** the skill removes only the `[[` and `]]` markers from final note fields

#### Scenario: Vocabulary target falls back to bold marker
- **WHEN** the user provides no `[[...]]` span
- **AND** the sentence contains exactly one `**...**` span
- **THEN** the skill treats the marked text as the vocabulary target surface form
- **AND** the skill removes only the `**` markers from final note fields

#### Scenario: Double brackets override bold marker
- **WHEN** the input contains both `[[...]]` and `**...**`
- **THEN** the skill treats the `[[...]]` span as the vocabulary target
- **AND** the skill treats the `**...**` span as lower-priority grammar or context information

#### Scenario: Vocabulary is provided separately
- **WHEN** the user provides an example sentence and a separate vocabulary line
- **THEN** the skill uses the separate line as a clue to identify the target surface form and dictionary-form vocabulary item

#### Scenario: Multiple possible targets are present
- **WHEN** the skill cannot confidently identify one vocabulary target
- **THEN** the skill asks the user which vocabulary item to study before generating or writing a note

### Requirement: Dictionary-form vocabulary handling
The skill SHALL store dictionary-form vocabulary in `単語` while preserving the sentence surface form in example fields.

#### Scenario: Target appears in dictionary form
- **WHEN** the marked target is already dictionary form
- **THEN** the skill writes that dictionary form to `単語`
- **AND** the skill uses the same text as the surface form to replace in `穴埋め例文`

#### Scenario: Target appears in inflected form
- **WHEN** the target appears in an inflected sentence form such as `重かった`
- **THEN** the skill writes the dictionary form such as `重い` to `単語`
- **AND** the skill replaces the sentence surface form `重かった` in `穴埋め例文`

#### Scenario: Dictionary form is ambiguous
- **WHEN** the skill cannot confidently infer the dictionary form
- **THEN** the skill asks the user to confirm the dictionary form before writing `単語`

### Requirement: Japanese Vocabulary note generation
The skill SHALL generate a complete `Japanese Vocabulary` note candidate using the user's sentence and vocabulary target.

#### Scenario: Default deck and note type are used
- **WHEN** the skill creates a candidate note
- **THEN** the note uses deck `0.Japanese::Japanese Vocabulary`
- **AND** the note uses model `Japanese Vocabulary`

#### Scenario: Required fields are generated
- **WHEN** the skill creates a candidate note
- **THEN** the `単語` field contains the dictionary-form vocabulary item
- **AND** the `読み方` field contains the reading of the dictionary-form vocabulary item
- **AND** the `穴埋め例文` field contains the example sentence with the target surface form replaced by a short English cue in square brackets
- **AND** the `例文` field contains the example sentence with user markup removed
- **AND** the `意味` field contains an English meaning or explanation

#### Scenario: Kana annotations are preserved
- **WHEN** the input sentence contains kana annotations such as `責任（せきにん）`
- **THEN** the `例文` field preserves those annotations
- **AND** the `穴埋め例文` field preserves those annotations except when the annotated text is the replaced target surface form

#### Scenario: User markup is removed
- **WHEN** the input contains markers such as `[[...]]` or `**...**`
- **THEN** final generated note fields do not include the marker characters

#### Scenario: Existing blank example style is used
- **WHEN** the target word is `重い` in `重い責任（せきにん）`
- **THEN** the `穴埋め例文` field replaces the target surface form with a cue such as `[serious]`
- **AND** the cue is short and contextual rather than a full definition

### Requirement: Tag selection before vocabulary note creation
The skill SHALL treat tags as optional when writing the vocabulary note to Anki.

#### Scenario: User provides tags in input
- **WHEN** the input includes a `tags:` line
- **THEN** the skill uses the provided tags for the candidate note
- **AND** it does not ask a separate tag-selection question before validation

#### Scenario: User provides spaced hyphen tag hierarchy shorthand
- **WHEN** the input includes a tag such as `无敌绿宝书 - N3必考词 - 第2单元`
- **THEN** the skill normalizes it to `无敌绿宝书::N3必考词::第2单元`
- **AND** unspaced hyphens inside tag names are not converted

#### Scenario: User provides a standalone tag-like line
- **WHEN** the input includes a standalone line such as `无敌绿宝书 - N3必考词 - 第2单元`
- **THEN** the skill treats that line as a tag, not a vocabulary clue
- **AND** the skill normalizes it to `无敌绿宝书::N3必考词::第2单元`

#### Scenario: User does not provide tags
- **WHEN** the input does not include tags
- **THEN** the skill uses an empty tag list
- **AND** the skill proceeds to validation and creation without asking the user to choose tags

### Requirement: Anki MCP vocabulary creation workflow
The skill SHALL use existing CthuCodex Anki MCP tools to validate and create vocabulary notes.

#### Scenario: Schema is checked before note creation
- **WHEN** the skill prepares to create a vocabulary note
- **THEN** it reads `Japanese Vocabulary` schema with `cthu_anki_collection_schema`
- **AND** it stops for clarification if the expected model or fields are unavailable

#### Scenario: Candidate note is validated before writing
- **WHEN** the candidate note is complete
- **THEN** the skill calls `cthu_anki_validate_notes` before calling `cthu_anki_add_notes`
- **AND** it does not call `cthu_anki_add_notes` if validation fails

#### Scenario: Created note is opened for review
- **WHEN** the note is successfully created
- **THEN** the skill requests post-create review by using `openAfterCreate: true`
- **AND** Browser-opening warnings do not turn successful note creation into a failure
