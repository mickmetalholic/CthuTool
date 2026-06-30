# codex-plugins-cthu-codex-english-expression-skill Specification

## Purpose
Define the CthuCodex English expression card skill for parsing source sentences, generating Anki note candidates, handling tags, and using Anki MCP creation tools.

## Requirements
### Requirement: Plugin-local English expression card skill
CthuCodex SHALL provide a plugin-local explicit-only skill for creating `English Expression` Anki notes from user-provided English sentences, excerpts, and target expressions.

#### Scenario: Skill lives inside CthuCodex
- **WHEN** the English expression card skill is implemented
- **THEN** its skill instructions live under `codex/plugins/cthu-codex/skills/anki-english-expression-card-maker/`
- **AND** the skill is packaged with CthuCodex rather than as a standalone top-level repository skill

#### Scenario: Skill is explicit-only
- **WHEN** the Anki English expression card skill is installed
- **THEN** its `agents/openai.yaml` sets `policy.allow_implicit_invocation` to `false`
- **AND** Codex should use it only when explicitly invoked

#### Scenario: Skill remains separate from prompt hook
- **WHEN** the skill is added to CthuCodex
- **THEN** the existing language-coach `UserPromptSubmit` hook remains responsible only for English prose review
- **AND** English expression card generation is not implemented in the prompt hook

### Requirement: English expression input parsing
The skill SHALL identify an English source sentence, target expression, cloze surface span, optional cloze hint, and optional tags before creating an Anki note.

#### Scenario: Expression is marked in the sentence
- **WHEN** the user provides an English sentence containing exactly one `**...**` span
- **THEN** the skill treats the marked text as the target expression
- **AND** the skill removes only the `**` markers from final note fields

#### Scenario: Expression is provided separately
- **WHEN** the user provides an English sentence and a separate expression line
- **THEN** the skill uses the separate line as a clue to identify the target expression in the sentence
- **AND** the skill asks for clarification if the expression cannot be found exactly or confidently matched

#### Scenario: Input contains a longer excerpt
- **WHEN** the user provides a longer English excerpt and a target expression
- **THEN** the skill selects the sentence containing the target expression when there is exactly one confident containing sentence
- **AND** the skill asks for clarification if multiple sentences or no sentence match

#### Scenario: Expression occurs multiple times
- **WHEN** the target expression occurs multiple times in the selected sentence or excerpt
- **THEN** the skill asks which occurrence to cloze before generating or writing a note

### Requirement: English Expression note generation
The skill SHALL generate a complete `English Expression` note candidate using the user's sentence and target expression.

#### Scenario: Default deck and note type are used
- **WHEN** the skill creates a candidate note
- **THEN** the note uses deck `0.English`
- **AND** the note uses model `English Expression`

#### Scenario: Required fields are generated
- **WHEN** the skill creates a candidate note
- **THEN** the `Sentence` field contains the source sentence with the target expression converted to Anki cloze syntax
- **AND** the `Expression` field contains the target expression without user markup
- **AND** the `Explanation` field contains an English explanation

#### Scenario: Sentence field uses cloze syntax with synonym hints
- **WHEN** the target expression is `get past the maze of`
- **THEN** the `Sentence` field includes a cloze like `{{c1::get past the maze of::navigate / work through / overcome}}`
- **AND** the cloze hint contains two to four short synonyms or paraphrases
- **AND** the cloze hint does not include form cues such as word count, initials, or partially masked spellings

#### Scenario: Explanation follows existing style
- **WHEN** the skill generates the `Explanation` field
- **THEN** the explanation includes `Definition`, `Synonyms`, and `Other Examples` sections
- **AND** the `Synonyms` section includes five to eight close synonyms or paraphrases
- **AND** the other examples are natural English sentences using the expression or a close form of it

### Requirement: English expression tag handling
The skill SHALL treat tags as optional when writing the English expression note to Anki.

#### Scenario: User provides tags in input
- **WHEN** the input includes a `tags:` line
- **THEN** the skill uses the provided tags for the candidate note
- **AND** it does not ask a separate tag-selection question before validation

#### Scenario: User provides standalone tag-like line
- **WHEN** the input includes a standalone line such as `english-reading - article`
- **THEN** the skill treats that line as a tag, not an expression clue
- **AND** the skill normalizes it to `english-reading::article`

#### Scenario: User provides existing hierarchy tag
- **WHEN** the input includes a tag such as `english-reading::book::the-martian`
- **THEN** the skill preserves the Anki hierarchy tag

#### Scenario: User does not provide tags
- **WHEN** the input does not include tags
- **THEN** the skill uses an empty tag list
- **AND** the skill proceeds to validation and creation without asking the user to choose tags

### Requirement: Anki MCP English expression creation workflow
The skill SHALL use existing CthuCodex Anki MCP tools to validate and create English expression notes.

#### Scenario: Schema is checked before note creation
- **WHEN** the skill prepares to create an English expression note
- **THEN** it reads `English Expression` schema with `cthu_anki_collection_schema`
- **AND** it stops for clarification if the expected model or fields are unavailable

#### Scenario: Candidate note is validated before writing
- **WHEN** the candidate note is complete
- **THEN** the skill calls `cthu_anki_validate_notes` before calling `cthu_anki_add_notes`
- **AND** it does not call `cthu_anki_add_notes` if validation fails

#### Scenario: Created note is opened for review
- **WHEN** the note is successfully created
- **THEN** the skill requests post-create review by using `openAfterCreate: true`
- **AND** Browser-opening warnings do not turn successful note creation into a failure
